import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.subject || !body?.message) {
    return NextResponse.json({ error: "subject and message are required." }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: typeof body.userId === "string" ? body.userId : null,
      email: typeof body.email === "string" ? body.email : null,
      subject: body.subject,
      message: body.message,
      category: typeof body.category === "string" ? body.category : "other",
      priority: typeof body.priority === "string" ? body.priority : "medium",
      messages: {
        create: {
          senderType: typeof body.userId === "string" ? "user" : "system",
          senderUserId: typeof body.userId === "string" ? body.userId : null,
          message: body.message,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
