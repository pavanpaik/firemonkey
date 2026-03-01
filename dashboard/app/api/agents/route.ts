import { NextRequest, NextResponse } from "next/server";
import { runClaudeSkill } from "@/lib/claude";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_SKILLS = [
  "/market-analyst",
  "/news-sentiment",
  "/trade-strategist",
  "/risk-manager",
  "/portfolio-manager",
  "/trade-executor",
  "/morning-brief",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skill, args } = body;

    if (!skill || !VALID_SKILLS.includes(skill)) {
      return NextResponse.json(
        { error: `Invalid skill. Must be one of: ${VALID_SKILLS.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await runClaudeSkill(skill, args || "");

    return NextResponse.json({
      skill,
      args: args || "",
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to run agent" },
      { status: 500 }
    );
  }
}
