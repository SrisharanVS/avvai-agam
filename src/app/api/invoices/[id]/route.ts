import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, order: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        taxRate: Number(invoice.taxRate),
        discountAmount: Number(invoice.discountAmount),
        shippingAmount: Number(invoice.shippingAmount),
        totalAmount: Number(invoice.totalAmount),
        items: invoice.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
    });
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Invoice PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
