import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = prisma as any;

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const item = await db.questionSet.findUnique({
    where: { id },
    include: { items: { include: { question: { include: { options: true } } } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: item });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, level, topics, fields, skills, status, version } = body || {};

  const exist = await db.questionSet.findUnique({ where: { id } });
  if (!exist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.questionSet.update({
    where: { id },
    data: {
      name: name ?? exist.name,
      description: description === undefined ? exist.description : description,
      level: level === undefined ? exist.level : level,
      topics: topics ?? exist.topics,
      fields: fields ?? exist.fields,
      skills: skills ?? exist.skills,
      status: status ?? exist.status,
      version: version ?? exist.version,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await db.$transaction(async (tx: any) => {
    await tx.questionSetQuestion.deleteMany({ where: { questionSetId: id } });
    await tx.questionSet.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}


