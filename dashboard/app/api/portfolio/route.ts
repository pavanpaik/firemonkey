import { NextResponse } from "next/server";
import { getPortfolioState } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const portfolio = await getPortfolioState();
    return NextResponse.json(portfolio);
  } catch {
    return NextResponse.json(
      { error: "Failed to load portfolio state" },
      { status: 500 }
    );
  }
}
