import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";
import { generateInvoicePDFBuffer } from "@/lib/pdf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Prepare data for the PDF compiler
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

    // Generate the PDF buffer
    const pdfBuffer = await generateInvoicePDFBuffer(pdfData);

    // Send email with PDF attachment
    await sendInvoiceEmail({
      to: invoice.customerEmail,
      customerName: invoice.customerName,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: Number(invoice.totalAmount),
      pdfBuffer,
      orderId: invoice.orderId || undefined,
    });

    await prisma.invoice.update({
      where: { id },
      data: { status: "SENT" },
    });

    return NextResponse.json({
      success: true,
      message: `Invoice emailed to ${invoice.customerEmail}`,
    });
  } catch (error) {
    console.error("Invoice email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
