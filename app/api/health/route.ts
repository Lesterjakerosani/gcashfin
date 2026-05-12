import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple health check
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: process.env.DATABASE_URL ? "configured" : "missing"
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}