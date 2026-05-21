import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { generateInvoicePDFBuffer } from "@/lib/pdf";

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

    const where = status ? { orderStatus: status } : {};

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
        totalAmount: Number(o.totalAmount),
        items: o.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
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

    // Validate stock and compute totals
    const productIds = items.map((i: { productId: string }) => i.productId).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }
    }

    const subtotal = items.reduce(
      (sum: number, i: { quantity: number; unitPrice: number }) =>
        sum + i.quantity * i.unitPrice,
      0
    );
    const shippingAmount = subtotal >= 500 ? 0 : 60;
    const taxAmount = 0;
    const discountAmount = 0;
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
          totalAmount,
          paymentMethod: paymentMethod || "COD",
          couponCode: couponCode || null,
          items: {
            create: items.map((i: {
              productId?: string;
              productName: string;
              quantity: number;
              unitPrice: number;
            }) => ({
              productId: i.productId || null,
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.quantity * i.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      // Reduce stock
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Auto-generate invoice associated with this order
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
          totalAmount,
          paymentMethod: paymentMethod || "COD",
          status: "SENT",
          items: {
            create: items.map((i: {
              productName: string;
              quantity: number;
              unitPrice: number;
            }) => ({
              productName: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              taxRate: 0,
              taxAmount: 0,
              total: i.quantity * i.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      return { order: newOrder, invoice: newInvoice };
    });

    // Generate the PDF buffer and send invoice email (non-blocking)
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
          totalAmount: Number(invoice.totalAmount),
          paymentMethod: invoice.paymentMethod,
          notes: "Thank you for shopping with Avvai Natural Foods! Your organic products will be delivered soon.",
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

        // Send email with attached invoice PDF
        await sendInvoiceEmail({
          to: customerEmail,
          customerName,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: totalAmount,
          pdfBuffer,
          orderId: order.id,
        });
      } catch (err) {
        console.error("Failed to generate or email ecommerce invoice:", err);
      }
    })();

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        totalAmount: Number(order.totalAmount),
        shippingAmount: Number(order.shippingAmount),
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Order POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
