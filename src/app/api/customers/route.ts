import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where: Record<string, any> = {};
    if (search) {
      where.OR = [
        { customerId: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { customerId: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          invoices: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.customer.count({ where }),
    ]);

    // Format stats in-memory
    const formatted = customers.map((c) => {
      const orderCount = c.invoices.length;
      const totalSpent = c.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
      const lastOrder = c.invoices.length > 0 
        ? c.invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt.toISOString()
        : null;
      return {
        id: c.id,
        customerId: c.customerId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        gstNumber: c.gstNumber,
        orderCount,
        totalSpent,
        lastOrder,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, address, gstNumber, force } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }

    // Duplicate Check: Check Phone/Email unless "force" is true
    if (!force) {
      const emailTrim = email?.trim()?.toLowerCase() || null;
      const phoneTrim = phone?.trim() || null;

      const ORConditions: any[] = [];
      if (emailTrim) ORConditions.push({ email: { equals: emailTrim, mode: "insensitive" } });
      if (phoneTrim) ORConditions.push({ phone: phoneTrim });

      if (ORConditions.length > 0) {
        const existing = await prisma.customer.findFirst({
          where: { OR: ORConditions }
        });

        if (existing) {
          return NextResponse.json({
            success: false,
            duplicate: true,
            customer: existing,
            error: "A customer with this email or phone number already exists."
          }, { status: 409 });
        }
      }
    }

    // Sequence Generator for customerId (CUS-XXXXXX)
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
    const customerId = `CUS-${String(nextNum).padStart(6, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        customerId,
        name: name.trim(),
        email: email?.trim()?.toLowerCase() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error("Customer POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}
