import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

function generatePONumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `PO-${year}${month}-${nanoid(6).toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    const formatted = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      taxAmount: Number(o.taxAmount),
      totalAmount: Number(o.totalAmount),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("PO GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, expectedDeliveryDate, notes, items } = body;

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: "Supplier is required" },
        { status: 400 }
      );
    }
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Find default category for auto-created products
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

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: generatePONumber(),
        supplierId,
        status: "DRAFT",
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        notes,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        items: { create: itemsWithTotals },
      },
      include: {
        supplier: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...po,
          subtotal: Number(po.subtotal),
          taxAmount: Number(po.taxAmount),
          totalAmount: Number(po.totalAmount),
          items: po.items.map((i) => ({
            ...i,
            costPrice: Number(i.costPrice),
            taxAmount: Number(i.taxAmount),
            total: Number(i.total),
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PO POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
