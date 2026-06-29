import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const [
      totalOrders,
      revenueResult,
      totalProducts,
      recentOrders,
      pendingPOCount,
      lowStockProducts,
      inventoryValueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.product.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      prisma.purchaseOrder.count({
        where: { status: { in: ["DRAFT", "SENT", "PARTIALLY_RECEIVED"] } },
      }),
      prisma.product.findMany({
        where: {
          active: true,
          variants: {
            some: {
              active: true,
              stock: { lte: 10 },
            },
          },
        },
        include: {
          variants: {
            where: { active: true },
          },
        },
        take: 10,
      }),
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(stock * COALESCE("costPrice", "sellingPrice")), 0)::float AS total
        FROM product_variants
      `,
    ]);

    const lowStockCount = lowStockProducts.length;
    const inventoryValue = Number(inventoryValueResult[0]?.total ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
        totalProducts,
        lowStockCount,
        pendingPOCount,
        inventoryValue,
        lowStockProducts: lowStockProducts.map((p) => {
          const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
          return {
            id: p.id,
            name: p.name,
            totalStock,
            variantCount: p.variants.length,
          };
        }),
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
