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
    if (po.status !== "DRAFT") {
      return NextResponse.json({ success: false, error: "Only DRAFT orders can be submitted" }, { status: 400 });
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "SENT" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PO submit error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit purchase order" }, { status: 500 });
  }
}
