import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await getAdminFromCookie();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminData = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({ success: true, data: adminData });
}
