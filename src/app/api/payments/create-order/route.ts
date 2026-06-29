import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { calculateShipping } from "@/lib/utils";

function calcTotals(
  items: Array<{ price: number; quantity: number; shippingWeight: number }>,
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
      items: Array<{ variantId: string; quantity: number }>;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      state?: string;
    } = body;

    if (!items?.length || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const variantIds = items.map((i) => i.variantId).filter(Boolean);
    if (variantIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid variant IDs provided" },
        { status: 400 }
      );
    }

    // Fetch LATEST prices & stock from DB (never trust frontend)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, active: true },
      include: { product: { select: { id: true, name: true } } },
    });

    // Validate every item
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json(
          { success: false, error: `Variant not found: ${item.variantId}` },
          { status: 400 }
        );
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for "${variant.product.name} — ${variant.variantName}". Available: ${variant.stock}`,
          },
          { status: 400 }
        );
      }
      if (item.quantity < 1) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for "${variant.variantName}"` },
          { status: 400 }
        );
      }
    }

    // Server-side total calculation
    const enrichedItems = items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const price = Number(variant.sellingPrice);
      return {
        ...item,
        price,
        productName: variant.product.name,
        shippingWeight: Number(variant.shippingWeight),
      };
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
      return NextResponse.json(
        { success: false, error: "Order total too low" },
        { status: 400 }
      );
    }

    // Create Razorpay Order
    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      notes: { customerName, customerEmail, customerPhone },
    });

    // Persist PENDING Payment record (idempotency anchor)
    await prisma.payment.create({
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: "INR",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
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
