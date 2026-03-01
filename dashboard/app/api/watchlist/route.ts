import { NextRequest, NextResponse } from "next/server";
import { getWatchlist, saveWatchlist } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const watchlist = await getWatchlist();
    return NextResponse.json({ watchlist });
  } catch {
    return NextResponse.json(
      { error: "Failed to load watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const watchlist = body.watchlist;
    await saveWatchlist(watchlist);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save watchlist" },
      { status: 500 }
    );
  }
}
