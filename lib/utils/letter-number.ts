import { prisma } from "@/lib/prisma";

export interface LetterNumberParams {
  type: "incoming" | "outgoing";
  classificationId?: string | null;
  statusId?: string | null;
  year?: number;
}

async function findMaxSequence(
  type: "incoming" | "outgoing",
  yearStart: Date,
  yearEnd: Date,
  classificationId?: string | null,
  statusId?: string | null
): Promise<number> {
  let letterNumbers: { letterNumber: string }[] = [];

  const baseWhere = {
    date: { gte: yearStart, lte: yearEnd },
    classificationId: classificationId || null,
    statusId: statusId || null,
  };

  if (type === "incoming") {
    letterNumbers = await prisma.incomingLetter.findMany({
      where: baseWhere,
      select: { letterNumber: true },
    });
  } else {
    letterNumbers = await prisma.outgoingLetter.findMany({
      where: baseWhere,
      select: { letterNumber: true },
    });
  }

  let maxSequence = 0;
  for (const letter of letterNumbers) {
    const match = letter.letterNumber.match(/^(\d+)/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSequence) maxSequence = seq;
    }
  }

  return maxSequence;
}

export async function generateLetterNumber(params: LetterNumberParams): Promise<string | null> {
  const { type, classificationId, statusId, year = new Date().getFullYear() } = params;

  const settings = await prisma.setting.findFirst();
  const formatTemplate =
    type === "incoming"
      ? settings?.incomingLetterFormat ?? "{sequence}/{classificationCode}/{statusCode}/{year}"
      : settings?.outgoingLetterFormat ?? "{sequence}/{classificationCode}/{statusCode}/{year}";

  const classification = classificationId
    ? await prisma.classification.findUnique({ where: { id: classificationId } })
    : null;
  const status = statusId
    ? await prisma.letterStatus.findUnique({ where: { id: statusId } })
    : null;

  const classificationCode = classification?.code ?? "-";
  const statusCode = status?.name?.charAt(0).toUpperCase() ?? "-";

  // Find the highest sequence number for this pattern in the current year
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

  const maxSequence = await findMaxSequence(
    type,
    yearStart,
    yearEnd,
    classificationId,
    statusId
  );

  const sequence = String(maxSequence + 1).padStart(4, "0");

  const letterNumber = formatTemplate
    .replace(/\{sequence\}/g, sequence)
    .replace(/\{classificationCode\}/g, classificationCode)
    .replace(/\{statusCode\}/g, statusCode)
    .replace(/\{year\}/g, String(year));

  return letterNumber;
}

export function parseLetterNumberFormat(format: string): boolean {
  const allowedTokens = ["{sequence}", "{classificationCode}", "{statusCode}", "{year}"];
  const tokens = format.match(/\{[^}]+\}/g) || [];
  return tokens.every((token) => allowedTokens.includes(token));
}
