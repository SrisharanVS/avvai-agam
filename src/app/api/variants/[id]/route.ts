import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.productVariant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        variantName: body.variantName,
        quantityValue: body.quantityValue !== undefined ? parseFloat(body.quantityValue) : undefined,
        unit: body.unit,
        customUnit: body.customUnit ?? null,
        sellingPrice: body.sellingPrice !== undefined ? parseFloat(body.sellingPrice) : undefined,
        costPrice: body.costPrice ? parseFloat(body.costPrice) : null,
        stock: body.stock !== undefined ? parseInt(body.stock) : undefined,
        shippingWeight: body.shippingWeight !== undefined ? parseFloat(body.shippingWeight) : undefined,
        sku: body.sku ?? null,
        active: body.active !== undefined ? body.active : undefined,
        isDefault: body.isDefault !== undefined ? body.isDefault : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        quantityValue: Number(updated.quantityValue),
        sellingPrice: Number(updated.sellingPrice),
        costPrice: updated.costPrice ? Number(updated.costPrice) : null,
        shippingWeight: Number(updated.shippingWeight),
      },
    });
  } catch (error) {
    console.error("Variant PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Variant not found" },
        { status: 404 }
      );
    }

    // Guard: product must have at least 1 variant remaining
    const count = await prisma.productVariant.count({
      where: { productId: variant.productId },
    });
    if (count <= 1) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the last variant of a product" },
        { status: 400 }
      );
    }

    await prisma.productVariant.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Variant deleted" });
  } catch (error) {
    console.error("Variant DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete variant" },
      { status: 500 }
    );
  }
}
