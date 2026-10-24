import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LANGUAGES = ["et", "en"];
const ACTIONS = ["add", "remove", "change"];
const OUTCOMES = ["self_service", "stop", "super_user"];

// Stores only an anonymous record of how a flow ended. Any other fields are ignored.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { language, action, outcome } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof language !== "string" || !LANGUAGES.includes(language) ||
    typeof action !== "string" || !ACTIONS.includes(action) ||
    typeof outcome !== "string" || !OUTCOMES.includes(outcome)
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  try {
    await prisma.usageLog.create({ data: { language, action, outcome } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("POST /api/usage failed", e);
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
