import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch related products from same category
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
      select: {
        id: true, name: true, slug: true, price: true,
        discountedPrice: true, imageUrls: true, weight: true,
        rating: true, stock: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: Number(product.price),
        discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
        rating: Number(product.rating),
        related: related.map((r) => ({
          ...r,
          price: Number(r.price),
          discountedPrice: r.discountedPrice ? Number(r.discountedPrice) : null,
          rating: Number(r.rating),
        })),
      },
    });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.product.update({
      where: { slug },
      data: { ...body },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        price: Number(updated.price),
        discountedPrice: updated.discountedPrice ? Number(updated.discountedPrice) : null,
      },
    });
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await prisma.product.delete({ where: { slug } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
