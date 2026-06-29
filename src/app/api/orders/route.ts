import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { generateInvoicePDFBuffer } from "@/lib/pdf";
import { calculateShipping, ceilShippingWeight } from "@/lib/utils";

function generateOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `AVV-${ymd}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    const where: { orderStatus?: string; paymentStatus?: string } = {};
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        taxAmount: Number(o.taxAmount),
        shippingAmount: Number(o.shippingAmount),
        discountAmount: Number(o.discountAmount),
        gatewayFee: Number(o.gatewayFee),
        totalAmount: Number(o.totalAmount),
        items: o.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
          quantityValueSnapshot: i.quantityValueSnapshot
            ? Number(i.quantityValueSnapshot)
            : null,
        })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName, customerEmail, customerPhone,
      address, city, state, pincode, landmark, deliveryNotes,
      paymentMethod, items, couponCode,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !address || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate stock on ProductVariant
    const variantIds = items
      .map((i: any) => i.variantId)
      .filter(Boolean);

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true } } },
    });

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (variant && variant.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${variant.product.name} — ${variant.variantName}`,
          },
          { status: 400 }
        );
      }
    }

    // Load shipping settings
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
    const shippingFeeTN = parseFloat(settingsMap.get("shipping_fee_tn") ?? "60");
    const shippingFeeOther = parseFloat(settingsMap.get("shipping_fee_other") ?? "100");
    const freeShippingThreshold = parseFloat(
      settingsMap.get("free_shipping_threshold") ?? "500"
    );

    // Build enriched items with numeric shippingWeight per variant
    const itemsWithWeight = items.map((item: any) => {
      const variant = variants.find((v) => v.id === item.variantId);
      return {
        ...item,
        shippingWeight: variant ? Number(variant.shippingWeight) : 1,
      };
    });

    const subtotal = items.reduce(
      (sum: number, i: { quantity: number; unitPrice: number }) =>
        sum + i.quantity * i.unitPrice,
      0
    );

    const shippingAmount = calculateShipping({
      items: itemsWithWeight,
      subtotal,
      state,
      shippingFeeTN,
      shippingFeeOther,
      freeShippingThreshold,
    });

    const taxAmount = 0;
    const discountAmount = 0;
    const gatewayFee = 0;
    const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

    const orderNumber = generateOrderNumber();

    const { order, invoice } = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          customerPhone,
          address,
          city,
          state,
          pincode,
          landmark: landmark || null,
          deliveryNotes: deliveryNotes || null,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          gatewayFee,
          totalAmount,
          paymentMethod: paymentMethod || "COD",
          couponCode: couponCode || null,
          items: {
            create: items.map((i: any) => {
              const variant = variants.find((v) => v.id === i.variantId);
              return {
                productId: variant?.product?.id || null,
                variantId: i.variantId || null,
                productName: i.productName,
                variantNameSnapshot: variant?.variantName || null,
                quantityValueSnapshot: variant
                  ? Number(variant.quantityValue)
                  : null,
                unitSnapshot: variant?.unit || null,
                customUnitSnapshot: variant?.customUnit || null,
                skuSnapshot: variant?.sku || null,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.quantity * i.unitPrice,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Deduct stock from ProductVariant and record movements
      for (const item of items) {
        const variant = variants.find((v) => v.id === item.variantId);
        if (!variant) continue;

        const previousStock = variant.stock;
        const newStock = Math.max(0, previousStock - item.quantity);

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: variant.productId,
            variantId: variant.id,
            movementType: "SALE",
            quantity: -item.quantity,
            previousStock,
            newStock,
            referenceType: "ORDER",
            referenceId: newOrder.id,
            notes: `Sale — Order ${orderNumber}`,
          },
        });
      }

      // Auto-generate invoice
      const invoiceNumber = `INV-${orderNumber.split("-")[1] || Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          type: "ECOMMERCE",
          orderId: newOrder.id,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          billingAddress: `${address}, ${city}, ${state} - ${pincode}`,
          subtotal,
          taxAmount,
          taxRate: 0,
          discountAmount,
          shippingAmount,
          gatewayFee,
          totalAmount,
          paymentMethod: paymentMethod || "COD",
          status: "SENT",
          items: {
            create: items.map((i: any) => {
              const variant = variants.find((v) => v.id === i.variantId);
              return {
                productId: variant?.productId || null,
                variantId: i.variantId || null,
                productName: i.productName,
                variantNameSnapshot: variant?.variantName || null,
                quantityValueSnapshot: variant
                  ? Number(variant.quantityValue)
                  : null,
                unitSnapshot: variant?.unit || null,
                customUnitSnapshot: variant?.customUnit || null,
                skuSnapshot: variant?.sku || null,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                unitPriceSnapshot: i.unitPrice,
                taxRate: 0,
                taxAmount: 0,
                total: i.quantity * i.unitPrice,
              };
            }),
          },
        },
        include: { items: true },
      });

      return { order: newOrder, invoice: newInvoice };
    });

    // Email invoice (non-blocking)
    const totalWeightKg = itemsWithWeight.reduce(
      (s: number, i: { shippingWeight: number; quantity: number }) =>
        s + i.shippingWeight * i.quantity,
      0
    );
    const billableWeight = ceilShippingWeight(totalWeightKg);

    (async () => {
      try {
        const pdfData = {
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          customerPhone: invoice.customerPhone,
          billingAddress: invoice.billingAddress,
          subtotal: Number(invoice.subtotal),
          taxAmount: Number(invoice.taxAmount),
          discountAmount: Number(invoice.discountAmount),
          shippingAmount: Number(invoice.shippingAmount),
          gatewayFee: Number(invoice.gatewayFee),
          totalAmount: Number(invoice.totalAmount),
          paymentMethod: invoice.paymentMethod,
          notes: `Thank you for shopping with Avvai Iyarkai Agam! Items weight: ${totalWeightKg.toFixed(2)} kg | Shipping charged for: ${billableWeight} kg`,
          createdAt: invoice.createdAt,
          items: invoice.items.map((i) => ({
            productName: i.productName,
            description: i.variantNameSnapshot || null,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            taxRate: Number(i.taxRate),
            taxAmount: Number(i.taxAmount),
            total: Number(i.total),
          })),
        };

        const pdfBuffer = await generateInvoicePDFBuffer(pdfData);
        await sendInvoiceEmail({
          to: customerEmail,
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount,
          pdfBuffer,
          orderId: order.id,
        });
      } catch (err) {
        console.error("Failed to generate or email ecommerce invoice:", err);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...order,
          subtotal: Number(order.subtotal),
          totalAmount: Number(order.totalAmount),
          shippingAmount: Number(order.shippingAmount),
          gatewayFee: Number(order.gatewayFee),
          items: order.items.map((i) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
