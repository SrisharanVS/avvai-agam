import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            _count: { select: { items: true } },
          },
        },
        _count: { select: { purchaseOrders: true } },
      },
    });

    if (!supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    // Calculate total spend across all received POs
    const spendResult = await prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where: {
        supplierId: id,
        status: { in: ["RECEIVED", "PARTIALLY_RECEIVED"] },
      },
    });

    const data = {
      ...supplier,
      purchaseOrders: supplier.purchaseOrders.map((po) => ({
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
      })),
      totalSpend: Number(spendResult._sum.totalAmount || 0),
      totalOrders: supplier._count.purchaseOrders,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Supplier GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, contactPerson, email, phone, gstNumber, address, notes, isArchived } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(gstNumber !== undefined && { gstNumber }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Supplier PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if supplier has any purchase orders
    const poCount = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (poCount > 0) {
      return NextResponse.json(
        { success: false, error: "Cannot delete supplier with existing purchase orders. Archive instead." },
        { status: 400 }
      );
    }
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (error) {
    console.error("Supplier DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete supplier" }, { status: 500 });
  }
}
