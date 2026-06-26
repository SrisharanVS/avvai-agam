import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const shippingFeeTN = parseFloat(settingsMap.get("shipping_fee_tn") ?? "60");
    const shippingFeeOther = parseFloat(settingsMap.get("shipping_fee_other") ?? "100");
    const freeShippingThreshold = parseFloat(
      settingsMap.get("free_shipping_threshold") ?? "500"
    );

    return NextResponse.json({
      success: true,
      data: {
        shippingFeeTN,
        shippingFeeOther,
        freeShippingThreshold,
        // Fallback for backward compatibility
        shippingFee: shippingFeeTN,
      },
    });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shippingFeeTN, shippingFeeOther, freeShippingThreshold } = body;

    if (
      typeof shippingFeeTN !== "number" ||
      typeof shippingFeeOther !== "number" ||
      typeof freeShippingThreshold !== "number"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid parameters. Fees must be numbers." },
        { status: 400 }
      );
    }

    if (shippingFeeTN < 0 || shippingFeeOther < 0 || freeShippingThreshold < 0) {
      return NextResponse.json(
        { success: false, error: "Parameters cannot be negative." },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "shipping_fee_tn" },
        update: { value: String(shippingFeeTN) },
        create: { key: "shipping_fee_tn", value: String(shippingFeeTN) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "shipping_fee_other" },
        update: { value: String(shippingFeeOther) },
        create: { key: "shipping_fee_other", value: String(shippingFeeOther) },
      }),
      prisma.systemSetting.upsert({
        where: { key: "free_shipping_threshold" },
        update: { value: String(freeShippingThreshold) },
        create: { key: "free_shipping_threshold", value: String(freeShippingThreshold) },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        shippingFeeTN,
        shippingFeeOther,
        freeShippingThreshold,
      },
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("PUT settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

