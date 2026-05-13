import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("[Notes API] GET - Starting request");
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.warn("[Notes API] GET - No session found");
      return NextResponse.json({ error: "Unauthorized", details: "No session" }, { status: 401 });
    }

    if (!session.user?.id) {
      console.warn("[Notes API] GET - No user ID in session");
      return NextResponse.json({ error: "Unauthorized", details: "No user ID" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[Notes API] GET - Fetching notes for user: ${userId}`);
    
    const note = await prisma.note.findUnique({ where: { userId } });
    console.log(`[Notes API] GET - Success: Found note with ${note?.content?.length || 0} characters`);
    
    return NextResponse.json({ 
      success: true,
      content: note?.content || "",
      id: note?.id
    });
  } catch (error) {
    console.error("[Notes API] GET - Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Notes API] GET - Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[Notes API] POST - Starting request");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Notes API] POST - No user session");
      return NextResponse.json({ error: "Unauthorized", details: "No user ID" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { content } = body;

    if (typeof content !== "string") {
      console.warn("[Notes API] POST - Invalid content type");
      return NextResponse.json({ error: "Invalid content. Must be a string." }, { status: 400 });
    }

    console.log(`[Notes API] POST - Creating note for user: ${userId}`);
    
    const note = await prisma.note.create({
      data: { userId, content },
    });
    
    console.log(`[Notes API] POST - Success: Created note ${note.id}`);
    return NextResponse.json({ 
      success: true,
      note: { id: note.id, content: note.content, createdAt: note.createdAt }
    }, { status: 201 });
  } catch (error) {
    console.error("[Notes API] POST - Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Notes API] POST - Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to create note", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("[Notes API] PUT - Starting request");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Notes API] PUT - No user session");
      return NextResponse.json({ error: "Unauthorized", details: "No user ID" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { content } = body;

    if (typeof content !== "string") {
      console.warn("[Notes API] PUT - Invalid content type");
      return NextResponse.json({ error: "Invalid content. Must be a string." }, { status: 400 });
    }

    console.log(`[Notes API] PUT - Updating note for user: ${userId}`);
    
    const note = await prisma.note.upsert({
      where: { userId },
      update: { content },
      create: { userId, content },
    });
    
    console.log(`[Notes API] PUT - Success: Updated note ${note.id}`);
    return NextResponse.json({ 
      success: true,
      note: { id: note.id, content: note.content, updatedAt: note.updatedAt }
    });
  } catch (error) {
    console.error("[Notes API] PUT - Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Notes API] PUT - Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to save notes", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("[Notes API] DELETE - Starting request");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Notes API] DELETE - No user session");
      return NextResponse.json({ error: "Unauthorized", details: "No user ID" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[Notes API] DELETE - Deleting note for user: ${userId}`);
    
    await prisma.note.delete({ where: { userId } });
    
    console.log(`[Notes API] DELETE - Success: Note deleted`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notes API] DELETE - Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Notes API] DELETE - Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to delete note", details: errorMessage },
      { status: 500 }
    );
  }
}