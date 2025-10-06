import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await getUserFromToken(token)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Cascade deletes are set on FKs where possible; ensure manual cleanup for non-cascades
    try {
      await sql`DELETE FROM applications WHERE seeker_id = ${user.id}`
    } catch (_) {}
    try {
      await sql`DELETE FROM jobs WHERE employer_id = ${user.id}`
    } catch (_) {}
    try {
      await sql`DELETE FROM resumes WHERE user_id = ${user.id}`
    } catch (_) {}
    try {
      await sql`DELETE FROM notifications WHERE user_id = ${user.id}`
    } catch (_) {}
    try {
      await sql`DELETE FROM job_seeker_profiles WHERE user_id = ${user.id}`
    } catch (_) {}
    try {
      await sql`DELETE FROM employer_profiles WHERE user_id = ${user.id}`
    } catch (_) {}

    await sql`DELETE FROM users WHERE id = ${user.id}`

    const response = NextResponse.json({ message: "Account deleted" })
    response.cookies.set("auth-token", "", { httpOnly: true, secure: false, sameSite: "lax", maxAge: 0, path: "/" })
    return response
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}








