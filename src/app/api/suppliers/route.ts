import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const includeArchived = searchParams.get("includeArchived") === "true";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (!includeArchived) where.isArchived = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { purchaseOrders: true } } },
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: suppliers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, contactPerson, email, phone, gstNumber, address, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Supplier name is required" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), contactPerson, email, phone, gstNumber, address, notes },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Supplier POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}
