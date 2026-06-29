import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const productId = searchParams.get("productId");
    const movementType = searchParams.get("movementType");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (movementType) where.movementType = movementType;
    if (from || to) {
      where.createdAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: movements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Inventory movements GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch inventory movements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, movementType, quantity, notes } = body;

    if ((!productId && !variantId) || !movementType || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "productId/variantId, movementType, and quantity are required" },
        { status: 400 }
      );
    }

    const validTypes = ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "DAMAGED"];
    if (!validTypes.includes(movementType)) {
      return NextResponse.json({ success: false, error: "Invalid movement type" }, { status: 400 });
    }

    let targetVariantId = variantId;
    let targetProductId = productId;

    if (targetVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: targetVariantId },
      });
      if (!variant) {
        return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
      }
      targetProductId = variant.productId;
    } else if (targetProductId) {
      // Find the default variant or first variant
      const defaultVariant = await prisma.productVariant.findFirst({
        where: { productId: targetProductId, isDefault: true },
      }) || await prisma.productVariant.findFirst({
        where: { productId: targetProductId },
      });

      if (!defaultVariant) {
        return NextResponse.json({ success: false, error: "No variant found for product" }, { status: 404 });
      }
      targetVariantId = defaultVariant.id;
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: targetVariantId },
      include: { product: true },
    });

    if (!variant) {
      return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
    }

    const previousStock = variant.stock;
    const newStock = Math.max(0, previousStock + quantity);

    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          productId: targetProductId,
          variantId: targetVariantId,
          movementType,
          quantity,
          previousStock,
          newStock,
          referenceType: "MANUAL_ADJUSTMENT",
          notes: notes || "Manual stock adjustment",
        },
        include: {
          product: { select: { id: true, name: true, slug: true } },
          variant: { select: { id: true, variantName: true } },
        },
      }),
      prisma.productVariant.update({
        where: { id: targetVariantId },
        data: { stock: newStock },
      }),
    ]);

    return NextResponse.json({ success: true, data: movement }, { status: 201 });
  } catch (error) {
    console.error("Inventory movement POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create inventory movement" }, { status: 500 });
  }
}
