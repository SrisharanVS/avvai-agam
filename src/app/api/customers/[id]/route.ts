import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { items: true }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    // Also fetch storefront orders if email is available
    let storefrontOrders: any[] = [];
    if (customer.email) {
      storefrontOrders = await prisma.order.findMany({
        where: { customerEmail: { equals: customer.email, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        include: { items: true }
      });
    }

    // Aggregate purchase history (items bought)
    const itemsMap = new Map<string, {
      productName: string;
      sku: string;
      totalQty: number;
      totalSpent: number;
      lastPurchased: Date;
    }>();

    // Aggregate from invoices
    for (const inv of customer.invoices) {
      for (const item of inv.items) {
        const sku = item.skuSnapshot || "PROD-UNKNOWN";
        const key = `${item.productName}-${sku}`;
        const existing = itemsMap.get(key);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalSpent += Number(item.total);
          if (inv.createdAt > existing.lastPurchased) {
            existing.lastPurchased = inv.createdAt;
          }
        } else {
          itemsMap.set(key, {
            productName: item.productName,
            sku,
            totalQty: item.quantity,
            totalSpent: Number(item.total),
            lastPurchased: inv.createdAt
          });
        }
      }
    }

    // Aggregate from storefront orders
    for (const order of storefrontOrders) {
      for (const item of order.items) {
        const sku = "PROD-STOREFRONT";
        const key = `${item.productName}-${sku}`;
        const existing = itemsMap.get(key);
        if (existing) {
          existing.totalQty += item.quantity;
          existing.totalSpent += Number(item.total);
          if (order.createdAt > existing.lastPurchased) {
            existing.lastPurchased = order.createdAt;
          }
        } else {
          itemsMap.set(key, {
            productName: item.productName,
            sku,
            totalQty: item.quantity,
            totalSpent: Number(item.total),
            lastPurchased: order.createdAt
          });
        }
      }
    }

    const purchaseHistory = Array.from(itemsMap.values()).sort((a, b) => b.totalQty - a.totalQty);

    // Compute stats
    const totalSpent = customer.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0) +
                       storefrontOrders.reduce((sum, ord) => sum + Number(ord.totalAmount), 0);
    const orderCount = customer.invoices.length + storefrontOrders.length;

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          customerId: customer.customerId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          gstNumber: customer.gstNumber,
          createdAt: customer.createdAt,
        },
        stats: {
          orderCount,
          totalSpent,
          invoiceCount: customer.invoices.length,
          storefrontOrderCount: storefrontOrders.length
        },
        invoices: customer.invoices.map((inv) => ({
          ...inv,
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.taxAmount),
          totalAmount: Number(inv.totalAmount)
        })),
        storefrontOrders: storefrontOrders.map((ord) => ({
          ...ord,
          subtotal: Number(ord.subtotal),
          totalAmount: Number(ord.totalAmount)
        })),
        purchaseHistory
      }
    });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customer details" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, address, gstNumber } = body;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name?.trim() !== undefined ? name.trim() : undefined,
        email: email !== undefined ? (email?.trim()?.toLowerCase() || null) : undefined,
        phone: phone !== undefined ? (phone?.trim() || null) : undefined,
        address: address !== undefined ? (address?.trim() || null) : undefined,
        gstNumber: gstNumber !== undefined ? (gstNumber?.trim() || null) : undefined,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Customer PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }

    // Check if customer has associated invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id }
    });

    if (invoiceCount > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete customer with existing invoice records."
      }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete customer" }, { status: 500 });
  }
}
