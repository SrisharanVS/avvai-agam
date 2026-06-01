import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePurchaseOrderPDFBuffer } from "@/lib/pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    const pdfData = {
      poNumber: po.poNumber,
      status: po.status,
      expectedDeliveryDate: po.expectedDeliveryDate,
      notes: po.notes,
      supplier: {
        name: po.supplier.name,
        contactPerson: po.supplier.contactPerson,
        email: po.supplier.email,
        phone: po.supplier.phone,
        address: po.supplier.address,
        gstNumber: po.supplier.gstNumber,
      },
      subtotal: Number(po.subtotal),
      taxAmount: Number(po.taxAmount),
      totalAmount: Number(po.totalAmount),
      createdAt: po.createdAt,
      items: po.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        costPrice: Number(i.costPrice),
        taxRate: Number(i.taxRate),
        taxAmount: Number(i.taxAmount),
        total: Number(i.total),
      })),
    };

    const pdfBuffer = await generatePurchaseOrderPDFBuffer(pdfData);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${po.poNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PO PDF error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate PDF" }, { status: 500 });
  }
}
