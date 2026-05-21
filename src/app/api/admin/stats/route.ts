import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const [totalOrders, revenueResult, totalProducts, lowStockCount, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { stock: { lte: 10 } } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
        totalProducts,
        lowStockCount,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          subtotal: Number(o.subtotal),
          totalAmount: Number(o.totalAmount),
          items: o.items.map((i) => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
