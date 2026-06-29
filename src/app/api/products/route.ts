import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VARIANT_SELECT = {
  id: true,
  sku: true,
  variantName: true,
  quantityValue: true,
  unit: true,
  customUnit: true,
  sellingPrice: true,
  costPrice: true,
  stock: true,
  shippingWeight: true,
  barcode: true,
  active: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
};

function formatVariants(variants: any[]) {
  return variants.map((v) => ({
    ...v,
    quantityValue: Number(v.quantityValue),
    sellingPrice: Number(v.sellingPrice),
    costPrice: v.costPrice ? Number(v.costPrice) : null,
    shippingWeight: Number(v.shippingWeight),
  }));
}

function computeProductMeta(variants: any[]) {
  const activeVariants = variants.filter((v) => v.active);
  const prices = activeVariants.map((v) => v.sellingPrice);
  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    variantCount: activeVariants.length,
    totalStock: activeVariants.reduce((s, v) => s + v.stock, 0),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");
    const sort = searchParams.get("sort") || "newest";

    const where: any = { active: true };

    if (category) {
      where.category = { slug: category };
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
        { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
      ];
    }

    // inStock filter — at least one variant with stock > 0
    if (inStock === "true") {
      where.variants = { some: { stock: { gt: 0 }, active: true } };
    }

    const orderBy =
      sort === "rating"
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
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { active: true }, select: VARIANT_SELECT, orderBy: { sellingPrice: "asc" } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => {
      const variants = formatVariants(p.variants);
      return {
        ...p,
        rating: Number(p.rating),
        defaultTaxRate: Number(p.defaultTaxRate),
        variants,
        ...computeProductMeta(variants),
      };
    });

    // Sort by price if needed (on minPrice)
    if (sort === "price_asc") formatted.sort((a, b) => a.minPrice - b.minPrice);
    if (sort === "price_desc") formatted.sort((a, b) => b.minPrice - a.minPrice);

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
      name,
      slug,
      description,
      categoryId,
      imageUrls,
      featured,
      nutritionInfo,
      ingredients,
      benefits,
      tags,
      defaultTaxRate,
      active,
      variants: variantInputs,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, error: "Name and category are required" },
        { status: 400 }
      );
    }

    if (!variantInputs || variantInputs.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one variant is required" },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    // Generate base SKU for product
    const latestVariant = await prisma.productVariant.findFirst({
      where: { sku: { startsWith: "PROD-" } },
      orderBy: { sku: "desc" },
    });
    let nextNum = 1;
    if (latestVariant?.sku) {
      const parts = latestVariant.sku.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const baseSku = `PROD-${String(nextNum).padStart(6, "0")}`;

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name,
          slug: generatedSlug,
          description,
          categoryId,
          imageUrls: imageUrls || [],
          featured: featured || false,
          nutritionInfo,
          ingredients,
          benefits,
          tags: tags || [],
          defaultTaxRate: defaultTaxRate || 0,
          active: active !== undefined ? active : true,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      // Create variants
      const variantData = variantInputs.map((v: any, idx: number) => ({
        productId: newProduct.id,
        sku: v.sku || `${baseSku}-${String.fromCharCode(65 + idx)}`,
        variantName: v.variantName,
        quantityValue: parseFloat(v.quantityValue) || 1,
        unit: v.unit || "GRAM",
        customUnit: v.customUnit || null,
        sellingPrice: parseFloat(v.sellingPrice) || 0,
        costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
        stock: parseInt(v.stock) || 0,
        shippingWeight: parseFloat(v.shippingWeight) || 1,
        active: v.active !== false,
        isDefault: idx === 0 || v.isDefault === true,
      }));

      await tx.productVariant.createMany({ data: variantData });

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { select: VARIANT_SELECT, orderBy: { sellingPrice: "asc" } },
        },
      });
    });

    if (!product) throw new Error("Product creation failed");

    const variants = formatVariants(product.variants);
    return NextResponse.json(
      {
        success: true,
        data: {
          ...product,
          rating: Number(product.rating),
          defaultTaxRate: Number(product.defaultTaxRate),
          variants,
          ...computeProductMeta(variants),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}