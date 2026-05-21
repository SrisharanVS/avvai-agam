import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDFBuffer } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { orderId },
      include: { items: true },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found for this order", { status: 404 });
    }

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
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      items: invoice.items.map((i) => ({
        productName: i.productName,
        description: i.description,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
        taxAmount: Number(i.taxAmount),
        total: Number(i.total),
      })),
    };

    const pdfBuffer = await generateInvoicePDFBuffer(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF by order ID generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
