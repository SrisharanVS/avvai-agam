import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true, address: true, gstNumber: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, variantName: true, stock: true } },
          },
        },
      },
    });

    if (!po) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
        items: po.items.map((i) => ({
          ...i,
          costPrice: Number(i.costPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
    });
  } catch (error) {
    console.error("PO GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { supplierId, expectedDeliveryDate, notes, items } = body;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Purchase order not found" }, { status: 404 });
    }
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ success: false, error: "Only DRAFT orders can be edited" }, { status: 400 });
    }

    // Recalculate totals if items provided
    let updateData: Record<string, unknown> = {
      ...(supplierId && { supplierId }),
      ...(expectedDeliveryDate !== undefined && {
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      }),
      ...(notes !== undefined && { notes }),
    };

    if (items) {
      let defaultCategory = await prisma.category.findFirst();
      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: {
            name: "Uncategorized",
            slug: "uncategorized",
            description: "Default category for auto-created products",
          },
        });
      }

      let subtotal = 0;
      let taxAmount = 0;
      const itemsWithTotals = [];

      for (const item of items) {
        const lineSubtotal = item.quantity * item.costPrice;
        const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
        subtotal += lineSubtotal;
        taxAmount += lineTax;

        let finalVariantId: string | null = item.variantId || null;
        let finalProductId: string | null = item.productId || null;
        let variantRecord: any = null;
        let productRecord: any = null;

        // Resolve variant
        if (finalVariantId) {
          variantRecord = await prisma.productVariant.findUnique({
            where: { id: finalVariantId },
            include: { product: true },
          });
          if (variantRecord) {
            productRecord = variantRecord.product;
            finalProductId = productRecord.id;
          }
        } else if (finalProductId) {
          productRecord = await prisma.product.findUnique({ where: { id: finalProductId } });
          if (productRecord) {
            // Use the default variant
            variantRecord = await prisma.productVariant.findFirst({
              where: { productId: productRecord.id, isDefault: true },
            });
            finalVariantId = variantRecord?.id || null;
          }
        } else {
          // Auto-resolve or create product by name
          productRecord = await prisma.product.findFirst({
            where: { name: { equals: item.productName.trim(), mode: "insensitive" } },
          });

          if (productRecord) {
            finalProductId = productRecord.id;
            variantRecord = await prisma.productVariant.findFirst({
              where: { productId: productRecord.id, isDefault: true },
            });
            finalVariantId = variantRecord?.id || null;
          }
        }

        // Auto-create product + default variant if not found
        if (!productRecord) {
          const slug = item.productName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

          productRecord = await prisma.product.create({
            data: {
              name: item.productName.trim(),
              slug,
              active: true,
              categoryId: defaultCategory.id,
            },
          });
          finalProductId = productRecord.id;

          // Create default variant
          variantRecord = await prisma.productVariant.create({
            data: {
              productId: productRecord.id,
              sku: null,
              variantName: item.unit || "1 unit",
              quantityValue: 1,
              unit: "CUSTOM",
              customUnit: item.unit || "unit",
              sellingPrice: item.costPrice,
              costPrice: item.costPrice,
              stock: 0,
              shippingWeight: 1,
              isDefault: true,
            },
          });
          finalVariantId = variantRecord.id;
        }

        itemsWithTotals.push({
          productId: finalProductId,
          variantId: finalVariantId,
          productName: item.productName,
          quantity: item.quantity,
          receivedQuantity: 0,
          unit: item.unit || variantRecord?.customUnit || variantRecord?.unit || "units",
          costPrice: item.costPrice,
          taxRate: item.taxRate || 0,
          taxAmount: lineTax,
          total: lineSubtotal + lineTax,
          // Snapshots
          productNameSnapshot: item.productName,
          variantNameSnapshot: variantRecord?.variantName || null,
          skuSnapshot: variantRecord?.sku || null,
          unitSnapshot: item.unit || variantRecord?.unit || "units",
          costPriceSnapshot: item.costPrice,
          taxRateSnapshot: item.taxRate || 0,
        });
      }

      // Delete existing items and recreate
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        items: { create: itemsWithTotals },
      };
    }

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...po,
        subtotal: Number(po.subtotal),
        taxAmount: Number(po.taxAmount),
        totalAmount: Number(po.totalAmount),
      },
    });
  } catch (error) {
    console.error("PO PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update purchase order" }, { status: 500 });
  }
}
