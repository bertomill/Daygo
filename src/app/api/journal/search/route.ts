import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Just return an empty result during build
  return NextResponse.json({ entries: [] });
} 