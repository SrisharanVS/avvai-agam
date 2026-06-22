import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, invoice: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        shippingAmount: Number(order.shippingAmount),
        discountAmount: Number(order.discountAmount),
        gatewayFee: Number(order.gatewayFee),
        totalAmount: Number(order.totalAmount),
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      },
    });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order" },
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
    const { orderStatus, paymentStatus } = body;

    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          ...(orderStatus && { orderStatus }),
          ...(paymentStatus && { paymentStatus }),
        },
      });

      // Sync corresponding Invoice status if order status updates
      if (paymentStatus === "PAID") {
        await tx.invoice.updateMany({
          where: { orderId: id },
          data: { status: "PAID" },
        });
      } else if (orderStatus === "CANCELLED") {
        await tx.invoice.updateMany({
          where: { orderId: id },
          data: { status: "CANCELLED" },
        });
      }

      return updatedOrder;
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
