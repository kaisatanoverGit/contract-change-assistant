import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.knowledgeItem.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true, topic: true,
        questionEn: true, answerEn: true, stepsEn: true,
        questionEt: true, answerEt: true, stepsEt: true,
      },
    });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/knowledge failed", e);
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
