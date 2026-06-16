import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [users, incoming, outgoing, classifications, statuses] = await Promise.all([
      prisma.user.count(),
      prisma.incomingLetter.count(),
      prisma.outgoingLetter.count(),
      prisma.classification.count(),
      prisma.letterStatus.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: {
        users,
        incomingLetters: incoming,
        outgoingLetters: outgoing,
        classifications,
        statuses,
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
