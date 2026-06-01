import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    // Use raw query since Prisma doesn't support column-to-column comparisons in `where`
    const products = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        slug: string;
        stock: number;
        minimumStockLevel: number;
      }>
    >`
      SELECT id, name, slug, stock, "minimumStockLevel"
      FROM products
      WHERE "minimumStockLevel" > 0
        AND stock <= "minimumStockLevel"
      ORDER BY stock ASC
    `;

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: Number(p.stock),
      minimumStockLevel: Number(p.minimumStockLevel),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Low stock GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch low stock products" }, { status: 500 });
  }
}
