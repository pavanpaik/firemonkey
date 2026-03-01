import { NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const history = await getTradeHistory();
    return NextResponse.json(history);
  } catch {
    return NextResponse.json(
      { error: "Failed to load trade history" },
      { status: 500 }
    );
  }
}
