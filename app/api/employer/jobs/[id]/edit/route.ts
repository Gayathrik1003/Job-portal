import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "employer") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verify the job belongs to this employer
    const jobs = await sql`
      SELECT * FROM jobs WHERE id = ${Number.parseInt(id)} AND employer_id = ${user.id}
    `

    if (jobs.length === 0) {
      return NextResponse.redirect(new URL("/employer/dashboard", request.url))
    }

    // Redirect to edit page
    return NextResponse.redirect(new URL(`/employer/jobs/${id}/edit`, request.url))
  } catch (error) {
    console.error("Edit job redirect error:", error)
    return NextResponse.redirect(new URL("/employer/dashboard", request.url))
  }
}
