import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { calculateShipping } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotals(
  items: Array<{ price: number; quantity: number; weight: string | null }>,
  state: string | undefined,
  shippingFeeTN: number,
  shippingFeeOther: number,
  freeShippingThreshold: number
): { subtotal: number; shipping: number; tax: number; gatewayFee: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = calculateShipping({
    items,
    subtotal,
    state,
    shippingFeeTN,
    shippingFeeOther,
    freeShippingThreshold,
  });
  const tax = 0;
  const baseTotal = subtotal + shipping + tax;
  const gatewayFee = Math.round(baseTotal * 0.0236 * 100) / 100;
  return { subtotal, shipping, tax, gatewayFee, total: baseTotal + gatewayFee };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      state,
    }: {
      items: Array<{ productId: string; quantity: number }>;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      state?: string;
    } = body;

    // ── 1. Input validation ────────────────────────────────────────────────
    if (!items?.length || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);
    if (productIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid product IDs provided" },
        { status: 400 }
      );
    }

    // ── 2. Fetch LATEST prices & stock from DB (never trust frontend) ──────
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: {
        id: true,
        name: true,
        price: true,
        discountedPrice: true,
        stock: true,
        active: true,
        weight: true,
      },
    });

    // ── 3. Validate every item ─────────────────────────────────────────────
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }
      if (item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for "${product.name}"` },
          { status: 400 }
        );
      }
    }

    // ── 4. Server-side total calculation ───────────────────────────────────
    const enrichedItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const price = product.discountedPrice
        ? Number(product.discountedPrice)
        : Number(product.price);
      return { ...item, price, productName: product.name, weight: product.weight };
    });

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
    const shippingFeeTN = parseFloat(settingsMap.get("shipping_fee_tn") ?? "60");
    const shippingFeeOther = parseFloat(settingsMap.get("shipping_fee_other") ?? "100");
    const freeShippingThreshold = parseFloat(
      settingsMap.get("free_shipping_threshold") ?? "500"
    );

    const { subtotal, shipping, tax, gatewayFee, total } = calcTotals(
      enrichedItems,
      state,
      shippingFeeTN,
      shippingFeeOther,
      freeShippingThreshold
    );
    const amountInPaise = Math.round(total * 100);

    if (amountInPaise < 100) {
      // Razorpay minimum is ₹1
      return NextResponse.json(
        { success: false, error: "Order total too low" },
        { status: 400 }
      );
    }

    // ── 5. Create Razorpay Order ───────────────────────────────────────────
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      notes: {
        customerName,
        customerEmail,
        customerPhone,
      },
    });

    // ── 6. Persist a PENDING Payment record (idempotency anchor) ──────────
    await prisma.payment.create({
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: "INR",
        status: "PENDING",
      },
    });

    // ── 7. Return order details to client ─────────────────────────────────
    return NextResponse.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      // Server-computed totals (for display only)
      breakdown: { subtotal, shipping, tax, gatewayFee, total },
    });
  } catch (error) {
    console.error("[payments/create-order] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
