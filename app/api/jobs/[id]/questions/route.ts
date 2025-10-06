import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const jobId = Number.parseInt(id)

    const questions = await sql`
      SELECT id, question_text, is_required, question_order
      FROM job_questions
      WHERE job_id = ${jobId}
      ORDER BY question_order ASC
    `

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error fetching job questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
