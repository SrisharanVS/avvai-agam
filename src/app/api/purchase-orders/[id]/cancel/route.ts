import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, error: `Cannot cancel a ${po.status} purchase order` },
        { status: 400 }
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PO cancel error:", error);
    return NextResponse.json({ success: false, error: "Failed to cancel purchase order" }, { status: 500 });
  }
}
