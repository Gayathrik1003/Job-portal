import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Determine cookie options based on environment
  const isPreviewOrProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_URL
  const cookieOptions = {
    httpOnly: true,
    secure: isPreviewOrProduction,
    sameSite: "lax" as const,
    maxAge: 0, // Expire immediately
    path: "/",
  }

  // Clear the cookie and redirect to login
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin
  const response = NextResponse.redirect(new URL("/login", origin), { status: 303 })
  response.cookies.set("auth-token", "", cookieOptions)

  console.log("Logout cookie cleared with options:", cookieOptions)

  return response
}
