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
    const { productId, movementType, quantity, notes } = body;

    if (!productId || !movementType || !quantity) {
      return NextResponse.json(
        { success: false, error: "productId, movementType, and quantity are required" },
        { status: 400 }
      );
    }

    const validTypes = ["PURCHASE", "SALE", "ADJUSTMENT", "RETURN", "DAMAGED"];
    if (!validTypes.includes(movementType)) {
      return NextResponse.json({ success: false, error: "Invalid movement type" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const previousStock = product.stock;
    // For adjustments, quantity can be negative (stock reduction)
    const newStock = Math.max(0, previousStock + quantity);

    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          productId,
          movementType,
          quantity,
          previousStock,
          newStock,
          referenceType: "MANUAL_ADJUSTMENT",
          notes: notes || "Manual stock adjustment",
        },
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
    ]);

    return NextResponse.json({ success: true, data: movement }, { status: 201 });
  } catch (error) {
    console.error("Inventory movement POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create inventory movement" }, { status: 500 });
  }
}
