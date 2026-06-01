import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, notes } = body as {
      items: { itemId: string; receivedQuantity: number }[];
      notes?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }
    if (po.status === "CANCELLED" || po.status === "RECEIVED") {
      return NextResponse.json(
        { success: false, error: `Cannot receive inventory for a ${po.status} purchase order` },
        { status: 400 }
      );
    }

    // Process each received item in a transaction
    await prisma.$transaction(async (tx) => {
      for (const receiveItem of items) {
        const poItem = po.items.find((i) => i.id === receiveItem.itemId);
        if (!poItem) continue;

        const qty = Number(receiveItem.receivedQuantity);
        if (qty <= 0) continue;

        const remaining = poItem.quantity - poItem.receivedQuantity;
        const actualReceived = Math.min(qty, remaining);
        if (actualReceived <= 0) continue;

        // Update received quantity on PO item
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQuantity: { increment: actualReceived } },
        });

        // Update product stock and cost prices if linked to a product
        if (poItem.productId && poItem.product) {
          const product = poItem.product;
          const previousStock = product.stock;
          const newStock = previousStock + actualReceived;
          const costPrice = Number(poItem.costPrice);

          // Weighted average cost calculation
          const currentAvg = product.averageCostPrice ? Number(product.averageCostPrice) : costPrice;
          const newAvgCost =
            previousStock === 0
              ? costPrice
              : (currentAvg * previousStock + costPrice * actualReceived) / newStock;

          await tx.product.update({
            where: { id: poItem.productId },
            data: {
              stock: newStock,
              lastPurchasePrice: costPrice,
              averageCostPrice: newAvgCost,
              costPrice: costPrice,
            },
          });

          // Record inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: poItem.productId,
              movementType: "PURCHASE",
              quantity: actualReceived,
              previousStock,
              newStock,
              referenceType: "PURCHASE_ORDER",
              referenceId: po.id,
              notes: notes || `Received from PO ${po.poNumber}`,
            },
          });
        }
      }

      // Determine new PO status
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = updatedItems.every(
        (i) => i.receivedQuantity >= i.quantity
      );
      const anyReceived = updatedItems.some((i) => i.receivedQuantity > 0);

      const newStatus = allReceived
        ? "RECEIVED"
        : anyReceived
          ? "PARTIALLY_RECEIVED"
          : po.status;

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });
    });

    const updated = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, stock: true } } } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        subtotal: Number(updated!.subtotal),
        taxAmount: Number(updated!.taxAmount),
        totalAmount: Number(updated!.totalAmount),
        items: updated!.items.map((i) => ({
          ...i,
          costPrice: Number(i.costPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
      message: "Inventory received successfully",
    });
  } catch (error) {
    console.error("PO receive error:", error);
    return NextResponse.json({ success: false, error: "Failed to receive inventory" }, { status: 500 });
  }
}
