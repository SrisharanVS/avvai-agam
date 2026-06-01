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
      customerId, customerName, customerEmail, customerPhone, billingAddress, gstNumber,
      updateCustomerProfile = true,
      taxRate = 0, discountAmount = 0, shippingAmount = 0,
      paymentMethod = "COD", notes, items,
    } = body;

    if (!customerName || !customerEmail || !items?.length) {
      return NextResponse.json(
        { success: false, error: "Customer name, email, and items are required" },
        { status: 400 }
      );
    }

    // 1. Resolve Customer profile
    let finalCustomerId: string | null = customerId || null;
    let customerRecord: any = null;

    if (finalCustomerId) {
      customerRecord = await prisma.customer.findUnique({ where: { id: finalCustomerId } });
    } else {
      // Lookup customer by email
      customerRecord = await prisma.customer.findFirst({
        where: { email: { equals: customerEmail.trim().toLowerCase(), mode: "insensitive" } }
      });
    }

    if (customerRecord) {
      finalCustomerId = customerRecord.id;
      
      // Update Customer profile if checkbox is checked and values differ
      const emailTrim = customerEmail.trim().toLowerCase();
      const phoneTrim = customerPhone?.trim() || null;
      const addressTrim = billingAddress?.trim() || null;
      const gstTrim = gstNumber?.trim() || null;

      const hasDiff = 
        customerRecord.name !== customerName.trim() ||
        (customerRecord.email || "").toLowerCase() !== emailTrim ||
        (customerRecord.phone || null) !== phoneTrim ||
        (customerRecord.address || null) !== addressTrim ||
        (customerRecord.gstNumber || null) !== gstTrim;

      if (hasDiff && updateCustomerProfile) {
        customerRecord = await prisma.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customerName.trim(),
            email: emailTrim,
            phone: phoneTrim,
            address: addressTrim,
            gstNumber: gstTrim
          }
        });
        console.log(`Updated customer profile ${customerRecord.customerId} inline with invoice changes.`);
      }
    } else {
      // Automatically Create Customer if they don't exist
      const latestCustomer = await prisma.customer.findFirst({
        orderBy: { customerId: "desc" },
        where: { customerId: { startsWith: "CUS-" } }
      });
      let nextNum = 1;
      if (latestCustomer) {
        const parts = latestCustomer.customerId.split("-");
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNum = num + 1;
        }
      }
      const newCustomerId = `CUS-${String(nextNum).padStart(6, "0")}`;

      customerRecord = await prisma.customer.create({
        data: {
          customerId: newCustomerId,
          name: customerName.trim(),
          email: customerEmail.trim().toLowerCase(),
          phone: customerPhone?.trim() || null,
          address: billingAddress?.trim() || null,
          gstNumber: gstNumber?.trim() || null
        }
      });
      finalCustomerId = customerRecord.id;
      console.log(`Auto-created Customer ${newCustomerId} during invoice creation.`);
    }

    // 2. Process items & fetch product details for snapshots
    let subtotal = 0;
    let totalTax = 0;
    
    const processedItems = [];
    for (const item of items) {
      const itemTaxRate = item.taxRate ?? taxRate;
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (itemTaxRate / 100);
      subtotal += itemTotal;
      totalTax += itemTax;

      // Find product matching name or id to log snapshots
      let product: any = null;
      if (item.productId) {
        product = await prisma.product.findUnique({ where: { id: item.productId } });
      } else {
        product = await prisma.product.findFirst({
          where: { name: { equals: item.productName, mode: "insensitive" } }
        });
      }

      processedItems.push({
        productName: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: itemTaxRate,
        taxAmount: parseFloat(itemTax.toFixed(2)),
        total: parseFloat((itemTotal + itemTax).toFixed(2)),
        // ERP Snapshots & relation
        productId: product?.id || null,
        productNameSnapshot: item.productName,
        skuSnapshot: product?.sku || "PROD-UNKNOWN",
        unitSnapshot: product?.unit || "units",
        unitPriceSnapshot: item.unitPrice,
        taxRateSnapshot: itemTaxRate
      });
    }

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
        // ERP snapshots & links
        customerId: finalCustomerId,
        customerIdSnapshot: customerRecord?.customerId || null,
        customerNameSnapshot: customerName,
        customerPhoneSnapshot: customerPhone || null,
        customerEmailSnapshot: customerEmail,
        customerAddressSnapshot: billingAddress || null,
        gstNumberSnapshot: gstNumber || customerRecord?.gstNumber || null,
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
