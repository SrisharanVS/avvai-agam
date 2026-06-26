import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendInvoiceEmail } from "@/lib/email";
import { generateInvoicePDFBuffer } from "@/lib/pdf";
import { calculateShipping } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Customer data (re-validated server side against the Payment record)
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      state,
      pincode,
      landmark,
      deliveryNotes,
      // Cart (product IDs + quantities only — prices re-fetched from DB)
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
      items: Array<{ productId: string; quantity: number }>;
    } = body;

    // ── 1. Basic input validation ──────────────────────────────────────────
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !customerName ||
      !customerEmail ||
      !items?.length
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ── 2. Idempotency check — reject duplicates ───────────────────────────
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
      // Payment already processed — return the existing order info
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

    // ── 3. HMAC Signature Verification ────────────────────────────────────
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
      // Mark payment as failed on invalid signature
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: "FAILED", razorpayPaymentId: razorpay_payment_id },
      });

      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Payment not verified." },
        { status: 400 }
      );
    }

    // ── 4. Re-fetch product prices & validate stock ────────────────────────
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        discountedPrice: true,
        stock: true,
        weight: true,
      },
    });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }
    }

    // Re-compute totals server-side
    const enrichedItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = product.discountedPrice
        ? Number(product.discountedPrice)
        : Number(product.price);
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        total: item.quantity * unitPrice,
        weight: product.weight,
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

    // ── 5. Prisma Transaction: create Order, Items, Inventory, Invoice, Payment ──
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber(orderNumber);

    const { order, invoice } = await prisma.$transaction(async (tx) => {
      // 5a. Create Order (CONFIRMED + PAID for Razorpay)
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
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          orderStatus: "CONFIRMED",
          items: {
            create: enrichedItems.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // 5b. Reduce stock + create InventoryMovement for each item
      for (const item of enrichedItems) {
        const product = products.find((p) => p.id === item.productId)!;
        const previousStock = product.stock;
        const newStock = Math.max(0, previousStock - item.quantity);

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
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

      // 5c. Create Invoice (PAID for Razorpay)
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
          paymentMethod: "RAZORPAY",
          status: "PAID",
          items: {
            create: enrichedItems.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxRate: 0,
              taxAmount: 0,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // 5d. Update Payment record — link orderId, mark SUCCESS
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

    // ── 6. Generate PDF and send invoice email (async, non-blocking) ───────
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
          notes:
            "Thank you for shopping with Avvai Natural Foods! Your payment was received and your organic products will be delivered soon.",
          createdAt: invoice.createdAt,
          items: invoice.items.map((i) => ({
            productName: i.productName,
            description: null,
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

    // ── 7. Respond with success ────────────────────────────────────────────
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
