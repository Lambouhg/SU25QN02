/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const db: any = prisma as any;

type ListQuery = {
  page?: string;
  pageSize?: string;
  status?: string; // default: published
  search?: string;
  level?: string;
  topics?: string; // comma separated
  fields?: string; // comma separated
  skills?: string; // comma separated
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q: ListQuery = Object.fromEntries(searchParams.entries());

  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 100);

  const where: any = {};
  where.status = q.status || "published";
  if (q.search) where.name = { contains: q.search, mode: "insensitive" };
  if (q.level) where.level = q.level;
  if (q.topics) where.topics = { hasSome: q.topics.split(",").map((s) => s.trim()).filter(Boolean) };
  if (q.fields) where.fields = { hasSome: q.fields.split(",").map((s) => s.trim()).filter(Boolean) };
  if (q.skills) where.skills = { hasSome: q.skills.split(",").map((s) => s.trim()).filter(Boolean) };

  const [items, total] = await Promise.all([
    db.questionSet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        level: true,
        topics: true,
        fields: true,
        skills: true,
        version: true,
        updatedAt: true,
        _count: {
          select: {
            items: true
          }
        }
      },
    }),
    db.questionSet.count({ where }),
  ]);

  return NextResponse.json({ data: items, page, pageSize, total });
}


