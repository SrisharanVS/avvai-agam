import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateInvoiceNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ymd}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");

    const where = type ? { type: type as "ECOMMERCE" | "MANUAL" } : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { items: true },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices.map((inv) => ({
        ...inv,
        subtotal: Number(inv.subtotal),
        taxAmount: Number(inv.taxAmount),
        taxRate: Number(inv.taxRate),
        discountAmount: Number(inv.discountAmount),
        shippingAmount: Number(inv.shippingAmount),
        totalAmount: Number(inv.totalAmount),
        items: inv.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Invoices GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName, customerEmail, customerPhone, billingAddress,
      taxRate = 0, discountAmount = 0, shippingAmount = 0,
      paymentMethod = "COD", notes, items,
    } = body;

    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Customer name, email, and items are required" },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const processedItems = items.map((item: {
      productName: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      taxRate?: number;
    }) => {
      const itemTaxRate = item.taxRate ?? taxRate;
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (itemTaxRate / 100);
      subtotal += itemTotal;
      totalTax += itemTax;
      return {
        productName: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: itemTaxRate,
        taxAmount: parseFloat(itemTax.toFixed(2)),
        total: parseFloat((itemTotal + itemTax).toFixed(2)),
      };
    });

    const totalAmount = subtotal + totalTax + shippingAmount - discountAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        type: "MANUAL",
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        billingAddress: billingAddress || null,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(totalTax.toFixed(2)),
        taxRate,
        discountAmount,
        shippingAmount,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paymentMethod,
        notes: notes || null,
        items: { create: processedItems },
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...invoice,
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        taxRate: Number(invoice.taxRate),
        discountAmount: Number(invoice.discountAmount),
        shippingAmount: Number(invoice.shippingAmount),
        totalAmount: Number(invoice.totalAmount),
        items: invoice.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          taxRate: Number(i.taxRate),
          taxAmount: Number(i.taxAmount),
          total: Number(i.total),
        })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Invoice POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
