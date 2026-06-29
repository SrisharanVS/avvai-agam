import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendInvoiceEmail } from "@/lib/email";
import { generateInvoicePDFBuffer } from "@/lib/pdf";
import { calculateShipping, ceilShippingWeight } from "@/lib/utils";

function generateOrderNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `AVV-${ymd}-${random}`;
}

function generateInvoiceNumber(orderNumber: string): string {
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${orderNumber.split("-")[1] || Date.now()}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName, customerEmail, customerPhone,
      address, city, state, pincode, landmark, deliveryNotes,
      items,
    }: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
      deliveryNotes?: string;
      items: Array<{ variantId: string; quantity: number }>;
    } = body;

    if (
      !razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||
      !customerName || !customerEmail || !items?.length
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Idempotency check
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!existingPayment) {
      return NextResponse.json(
        { success: false, error: "Payment order not found. Do not tamper with payment data." },
        { status: 404 }
      );
    }

    if (existingPayment.status === "SUCCESS") {
      const order = existingPayment.orderId
        ? await prisma.order.findUnique({
          where: { id: existingPayment.orderId },
          include: { invoice: true },
        })
        : null;
      return NextResponse.json({
        success: true,
        orderId: order?.id,
        orderNumber: order?.orderNumber,
        invoiceNumber: order?.invoice?.invoiceNumber,
        alreadyProcessed: true,
      });
    }

    if (existingPayment.status === "FAILED") {
      return NextResponse.json(
        { success: false, error: "This payment was already recorded as failed" },
        { status: 400 }
      );
    }

    // HMAC Signature Verification
    let signatureValid = false;
    try {
      signatureValid = verifyRazorpaySignature({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    if (!signatureValid) {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "FAILED", razorpayPaymentId: razorpay_payment_id },
      });
      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Payment not verified." },
        { status: 400 }
      );
    }

    // Re-fetch variant prices & validate stock
    const variantIds = items.map((i) => i.variantId).filter(Boolean);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: { select: { id: true, name: true } } },
    });

    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { success: false, error: `Variant not found: ${item.variantId}` },
          { status: 400 }
        );
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${variant.product.name} — ${variant.variantName}". Available: ${variant.stock}`,
          },
          { status: 400 }
        );
      }
    }

    // Re-compute totals server-side
    const enrichedItems = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const unitPrice = Number(variant.sellingPrice);
      return {
        variantId: item.variantId,
        productId: variant.productId,
        productName: variant.product.name,
        variantName: variant.variantName,
        quantity: item.quantity,
        unitPrice,
        total: item.quantity * unitPrice,
        shippingWeight: Number(variant.shippingWeight),
        sku: variant.sku,
        quantityValue: Number(variant.quantityValue),
        unit: variant.unit,
        customUnit: variant.customUnit,
      };
    });

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
    const shippingFeeTN = parseFloat(settingsMap.get("shipping_fee_tn") ?? "60");
    const shippingFeeOther = parseFloat(settingsMap.get("shipping_fee_other") ?? "100");
    const freeShippingThreshold = parseFloat(
      settingsMap.get("free_shipping_threshold") ?? "500"
    );

    const subtotal = enrichedItems.reduce((s, i) => s + i.total, 0);
    const shippingAmount = calculateShipping({
      items: enrichedItems,
      subtotal,
      state,
      shippingFeeTN,
      shippingFeeOther,
      freeShippingThreshold,
    });
    const taxAmount = 0;
    const discountAmount = 0;
    const baseTotal = subtotal + shippingAmount + taxAmount - discountAmount;
    const gatewayFee = Math.round(baseTotal * 0.0236 * 100) / 100;
    const totalAmount = baseTotal + gatewayFee;

    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber(orderNumber);

    const { order, invoice } = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName, customerEmail, customerPhone,
          address, city, state, pincode,
          landmark: landmark || null,
          deliveryNotes: deliveryNotes || null,
          subtotal, taxAmount, shippingAmount, discountAmount, gatewayFee, totalAmount,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          items: {
            create: enrichedItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              variantNameSnapshot: i.variantName,
              quantityValueSnapshot: i.quantityValue,
              unitSnapshot: i.unit,
              customUnitSnapshot: i.customUnit || null,
              skuSnapshot: i.sku || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // Deduct variant stock + record inventory movements
      for (const item of enrichedItems) {
        const variant = variants.find((v) => v.id === item.variantId)!;
        const previousStock = variant.stock;
        const newStock = Math.max(0, previousStock - item.quantity);

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            movementType: "SALE",
            quantity: -item.quantity,
            previousStock,
            newStock,
            referenceType: "ORDER",
            referenceId: newOrder.id,
            notes: `Sale — Order ${orderNumber} (Razorpay)`,
          },
        });
      }

      // Create Invoice (PAID)
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          type: "ECOMMERCE",
          orderId: newOrder.id,
          customerName, customerEmail,
          customerPhone: customerPhone || null,
          billingAddress: `${address}, ${city}, ${state} - ${pincode}`,
          subtotal, taxAmount, taxRate: 0, discountAmount, shippingAmount, gatewayFee, totalAmount,
          paymentMethod: "RAZORPAY",
          status: "PAID",
          items: {
            create: enrichedItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              productName: i.productName,
              variantNameSnapshot: i.variantName,
              quantityValueSnapshot: i.quantityValue,
              unitSnapshot: i.unit,
              customUnitSnapshot: i.customUnit || null,
              skuSnapshot: i.sku || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              unitPriceSnapshot: i.unitPrice,
              taxRate: 0,
              taxAmount: 0,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // Update Payment record — link orderId, mark SUCCESS
      await tx.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          orderId: newOrder.id,
          razorpayPaymentId: razorpay_payment_id,
          status: "SUCCESS",
          paymentMethod: "razorpay",
        },
      });

      return { order: newOrder, invoice: newInvoice };
    });

    // PDF + email (non-blocking)
    const totalWeightKg = enrichedItems.reduce(
      (s, i) => s + i.shippingWeight * i.quantity,
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
          paymentMethod: "RAZORPAY",
          notes: `Thank you for shopping with Avvai Natural Foods! Items weight: ${totalWeightKg.toFixed(2)} kg | Shipping charged for: ${billableWeight} kg`,
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
        console.error("[payments/verify] Failed to generate/send invoice email:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount,
    });
  } catch (error) {
    console.error("[payments/verify] error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
