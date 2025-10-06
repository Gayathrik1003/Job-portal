import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    await ensureApplicationsTables()
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let applications: any[] = []
    try {
      applications = await sql`
        SELECT 
          a.id,
          a.job_id,
          a.seeker_id,
          a.status,
          a.application_date,
          a.employer_notes,
          j.title as job_title,
          ep.company_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
        WHERE a.seeker_id = ${user.id}
        ORDER BY a.application_date DESC
      `
    } catch (_) {
      applications = []
    }

    // Get questions and answers for each application
    const applicationsWithQuestions = await Promise.all(
      applications.map(async (app) => {
        try {
          const questions = await sql`
            SELECT
              eq.id,
              eq.question_text,
              eq.asked_at,
              sa.answer_text,
              sa.answered_at
            FROM employer_questions eq
            LEFT JOIN seeker_answers sa ON eq.id = sa.question_id AND sa.seeker_id = ${user.id}
            WHERE eq.application_id = ${app.id}
            ORDER BY eq.asked_at ASC
          `
          return { ...app, questions }
        } catch (_) {
          return { ...app, questions: [] }
        }
      }),
    )

    return NextResponse.json({ applications: applicationsWithQuestions })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function ensureApplicationsTables() {
  // Create applications table if missing (minimal columns)
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      seeker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied','accepted','rejected')),
      application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Columns added by later migrations
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS employer_notes TEXT`
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
  await sql`ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL`
}
