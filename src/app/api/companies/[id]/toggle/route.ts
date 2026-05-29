import { NextRequest, NextResponse } from "next/server";
import { toggleCompanyStatus } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const company = await toggleCompanyStatus(id);
  if (!company) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ company });
}
