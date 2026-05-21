import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const where: any = {};

    // Category filter
    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Featured filter
    if (featured === "true") {
      where.featured = true;
    }

    // Stock filter
    if (inStock === "true") {
      where.stock = {
        gt: 0,
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          tags: {
            has: search,
          },
        },
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};

      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }

      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Sorting
    const orderBy =
      sort === "price_asc"
        ? { price: "asc" as const }
        : sort === "price_desc"
          ? { price: "desc" as const }
          : sort === "rating"
            ? { rating: "desc" as const }
            : sort === "popular"
              ? { reviewCount: "desc" as const }
              : { createdAt: "desc" as const };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      prisma.product.count({
        where,
      }),
    ]);

    // Convert Decimal values to numbers
    const formatted = products.map((p) => ({
      ...p,
      price: Number(p.price),
      discountedPrice: p.discountedPrice
        ? Number(p.discountedPrice)
        : null,
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
      {
        success: false,
        error: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      categoryId,
      price,
      discountedPrice,
      stock,
      imageUrls,
      featured,
      nutritionInfo,
      ingredients,
      benefits,
      weight,
      tags,
    } = body;

    // Validation
    if (!name || !categoryId || !price) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, category, and price are required",
        },
        {
          status: 400,
        }
      );
    }

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const product = await prisma.product.create({
      data: {
        name,
        slug: generatedSlug,
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

      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,

        data: {
          ...product,
          price: Number(product.price),
          discountedPrice: product.discountedPrice
            ? Number(product.discountedPrice)
            : null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Product POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}