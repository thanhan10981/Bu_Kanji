import { NextResponse } from "next/server";

// Google OAuth is completed by the NestJS backend. This legacy route remains
// only to keep old bookmarked callback URLs harmless.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/kanji", request.url));
}