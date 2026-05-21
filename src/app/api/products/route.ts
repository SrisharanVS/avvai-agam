import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";

    const where: Prisma.ProductWhereInput = {};

    if (category) where.category = { slug: category };
    if (featured === "true") where.featured = true;
    if (inStock === "true") where.stock = { gt: 0 };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price = { ...where.price as Prisma.DecimalFilter, gte: parseFloat(minPrice) };
      if (maxPrice) where.price = { ...where.price as Prisma.DecimalFilter, lte: parseFloat(maxPrice) };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : sort === "rating"
        ? { rating: "desc" }
        : sort === "popular"
        ? { reviewCount: "desc" }
        : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountedPrice: p.discountedPrice ? Number(p.discountedPrice) : null,
      rating: Number(p.rating),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, slug, description, categoryId, price, discountedPrice,
      stock, imageUrls, featured, nutritionInfo, ingredients,
      benefits, weight, tags,
    } = body;

    if (!name || !categoryId || !price) {
      return NextResponse.json(
        { success: false, error: "Name, category, and price are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description,
        categoryId,
        price,
        discountedPrice: discountedPrice || null,
        stock: stock || 0,
        imageUrls: imageUrls || [],
        featured: featured || false,
        nutritionInfo,
        ingredients,
        benefits,
        weight,
        tags: tags || [],
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: Number(product.price),
        discountedPrice: product.discountedPrice ? Number(product.discountedPrice) : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Product POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
