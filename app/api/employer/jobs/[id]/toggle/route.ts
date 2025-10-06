import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = Number.parseInt(id)

    // Verify the job belongs to this employer and get current status
    const jobs = await sql`
      SELECT * FROM jobs WHERE id = ${jobId} AND employer_id = ${user.id}
    `

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const job = jobs[0]
    const newStatus = !job.is_open

    // Toggle job status
    await sql`
      UPDATE jobs 
      SET is_open = ${newStatus}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${jobId}
    `

    // Redirect back to job management page
    return NextResponse.redirect(new URL(`/employer/jobs/${id}`, request.url))
  } catch (error) {
    console.error("Toggle job status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
