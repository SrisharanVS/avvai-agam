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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { active: true },
          select: VARIANT_SELECT,
          orderBy: { sellingPrice: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch related products
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, active: true },
      take: 4,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { active: true }, select: VARIANT_SELECT, orderBy: { sellingPrice: "asc" } },
      },
    });

    const variants = formatVariants(product.variants);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        rating: Number(product.rating),
        defaultTaxRate: Number(product.defaultTaxRate),
        variants,
        ...computeProductMeta(variants),
        related: related.map((r) => {
          const rv = formatVariants(r.variants);
          return {
            ...r,
            rating: Number(r.rating),
            defaultTaxRate: Number(r.defaultTaxRate),
            variants: rv,
            ...computeProductMeta(rv),
          };
        }),
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

    const {
      name, description, categoryId, imageUrls, featured,
      nutritionInfo, ingredients, benefits, tags, defaultTaxRate, active,
      variants: variantInputs,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // Update product fields
      const updatedProduct = await tx.product.update({
        where: { slug },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(categoryId && { categoryId }),
          ...(imageUrls !== undefined && { imageUrls }),
          ...(featured !== undefined && { featured }),
          ...(nutritionInfo !== undefined && { nutritionInfo }),
          ...(ingredients !== undefined && { ingredients }),
          ...(benefits !== undefined && { benefits }),
          ...(tags !== undefined && { tags }),
          ...(defaultTaxRate !== undefined && { defaultTaxRate }),
          ...(active !== undefined && { active }),
        },
      });

      // Upsert variants if provided
      if (variantInputs && Array.isArray(variantInputs)) {
        const incomingIds = variantInputs
          .filter((v: any) => v.id)
          .map((v: any) => v.id);

        // Delete variants removed from the list
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: updatedProduct.id },
          select: { id: true },
        });
        const toDelete = existingVariants
          .map((v) => v.id)
          .filter((id) => !incomingIds.includes(id));

        if (toDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert each variant
        for (let i = 0; i < variantInputs.length; i++) {
          const v = variantInputs[i];
          const data = {
            variantName: v.variantName,
            quantityValue: parseFloat(v.quantityValue) || 1,
            unit: v.unit || "GRAM",
            customUnit: v.customUnit || null,
            sellingPrice: parseFloat(v.sellingPrice) || 0,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : null,
            stock: parseInt(v.stock) || 0,
            shippingWeight: parseFloat(v.shippingWeight) || 1,
            active: v.active !== false,
            isDefault: v.isDefault === true || i === 0,
            sku: v.sku || null,
          };

          if (v.id) {
            await tx.productVariant.update({ where: { id: v.id }, data });
          } else {
            await tx.productVariant.create({
              data: { ...data, productId: updatedProduct.id },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: updatedProduct.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { active: true }, select: VARIANT_SELECT, orderBy: { sellingPrice: "asc" } },
        },
      });
    });

    if (!updated) throw new Error("Update failed");

    const variants = formatVariants(updated.variants);
    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        rating: Number(updated.rating),
        defaultTaxRate: Number(updated.defaultTaxRate),
        variants,
        ...computeProductMeta(variants),
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
  _request: NextRequest,
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
