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
    return NextResponse.json({ success: false, error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, expectedDeliveryDate, notes, items } = body;

    if (!supplierId) {
      return NextResponse.json({ success: false, error: "Supplier is required" }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one item is required" }, { status: 400 });
    }

    // Find default category for inline auto-created products
    let defaultCategory = await prisma.category.findFirst();
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "Uncategorized",
          slug: "uncategorized",
          description: "Default category for auto-created products"
        }
      });
    }

    // Calculate totals & resolve/create products
    let subtotal = 0;
    let taxAmount = 0;
    const itemsWithTotals = [];

    for (const item of items) {
      const lineSubtotal = item.quantity * item.costPrice;
      const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
      subtotal += lineSubtotal;
      taxAmount += lineTax;

      let finalProductId = item.productId || null;
      let productRecord: any = null;

      if (finalProductId) {
        productRecord = await prisma.product.findUnique({ where: { id: finalProductId } });
      } else {
        // Look up product by name
        productRecord = await prisma.product.findFirst({
          where: { name: { equals: item.productName.trim(), mode: "insensitive" } }
        });
        if (productRecord) {
          finalProductId = productRecord.id;
        }
      }

      // If product does not exist, auto-create it
      if (!productRecord) {
        // Generate SKU sequentially
        const latestProduct = await prisma.product.findFirst({
          orderBy: { sku: "desc" },
          where: { sku: { startsWith: "PROD-" } }
        });
        let nextNum = 1;
        if (latestProduct && latestProduct.sku) {
          const parts = latestProduct.sku.split("-");
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) {
            nextNum = num + 1;
          }
        }
        const sku = `PROD-${String(nextNum).padStart(6, "0")}`;
        const slug = item.productName.toLowerCase().trim()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

        productRecord = await prisma.product.create({
          data: {
            name: item.productName.trim(),
            slug,
            sku,
            unit: item.unit || "units",
            defaultTaxRate: item.taxRate || 0,
            stock: 0,
            price: item.costPrice, // Default selling price set to cost price
            costPrice: item.costPrice,
            active: true,
            categoryId: defaultCategory.id
          }
        });
        finalProductId = productRecord.id;
        console.log(`Auto-created missing product ${sku} during PO creation: ${item.productName}`);
      }

      itemsWithTotals.push({
        productId: finalProductId,
        productName: item.productName,
        quantity: item.quantity,
        receivedQuantity: 0,
        unit: item.unit || productRecord.unit || "units",
        costPrice: item.costPrice,
        taxRate: item.taxRate || 0,
        taxAmount: lineTax,
        total: lineSubtotal + lineTax,
        // ERP Snapshots
        productNameSnapshot: item.productName,
        skuSnapshot: productRecord.sku || "PROD-UNKNOWN",
        unitSnapshot: item.unit || productRecord.unit || "units",
        costPriceSnapshot: item.costPrice,
        taxRateSnapshot: item.taxRate || 0
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
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("PO POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create purchase order" }, { status: 500 });
  }
}
