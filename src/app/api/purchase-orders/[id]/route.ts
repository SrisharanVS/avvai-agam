import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true, address: true, gstNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, stock: true } },
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
        items: po.items.map((i) => ({
          ...i,
          costPrice: Number(i.costPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
    });
  } catch (error) {
    console.error("PO GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { supplierId, expectedDeliveryDate, notes, items } = body;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ success: false, error: "Only DRAFT orders can be edited" }, { status: 400 });
    }

    // Recalculate totals if items provided
    let updateData: Record<string, unknown> = {
      ...(supplierId && { supplierId }),
      ...(expectedDeliveryDate !== undefined && {
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      }),
      ...(notes !== undefined && { notes }),
    };

    if (items) {
      let subtotal = 0;
      let taxAmount = 0;
      const itemsWithTotals = items.map((item: {
        productId?: string;
        productName: string;
        quantity: number;
        unit?: string;
        costPrice: number;
        taxRate?: number;
      }) => {
        const lineSubtotal = item.quantity * item.costPrice;
        const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
        subtotal += lineSubtotal;
        taxAmount += lineTax;
        return {
          productId: item.productId || null,
          productName: item.productName,
          quantity: item.quantity,
          receivedQuantity: 0,
          unit: item.unit || "units",
          costPrice: item.costPrice,
          taxRate: item.taxRate || 0,
          taxAmount: lineTax,
          total: lineSubtotal + lineTax,
        };
      });

      // Delete existing items and recreate
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        items: { create: itemsWithTotals },
      };
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
      },
    });
  } catch (error) {
    console.error("PO PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update purchase order" }, { status: 500 });
  }
}
