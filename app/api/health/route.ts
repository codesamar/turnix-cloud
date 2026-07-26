import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "samar-cloud",
    timestamp: new Date().toISOString(),
  });
}
