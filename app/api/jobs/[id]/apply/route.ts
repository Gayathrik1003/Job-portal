import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "job_seeker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = Number.parseInt(id)
    const { resumeId, questionAnswers } = await request.json()

    if (!resumeId) {
      return NextResponse.json({ error: "Please select a resume to apply" }, { status: 400 })
    }

    // Check if job exists and is open
    const jobs = await sql`
      SELECT id, is_open FROM jobs WHERE id = ${jobId}
    `

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!jobs[0].is_open) {
      return NextResponse.json({ error: "Job is no longer accepting applications" }, { status: 400 })
    }

    // Check if user already applied
    const existingApplications = await sql`
      SELECT id FROM applications WHERE job_id = ${jobId} AND seeker_id = ${user.id}
    `

    if (existingApplications.length > 0) {
      return NextResponse.json({ error: "You have already applied for this job" }, { status: 400 })
    }

    // Check if user has a profile
    const profiles = await sql`
      SELECT id FROM job_seeker_profiles WHERE user_id = ${user.id}
    `

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Please complete your profile before applying" }, { status: 400 })
    }

    // Verify the selected resume belongs to the user
    const resumes = await sql`
      SELECT id FROM resumes WHERE id = ${resumeId} AND user_id = ${user.id}
    `
    if (resumes.length === 0) {
      return NextResponse.json({ error: "Selected resume not found or unauthorized" }, { status: 400 })
    }

    let requiredQuestions: any[] = []
    try {
      requiredQuestions = await sql`
        SELECT id, question_text FROM job_questions 
        WHERE job_id = ${jobId} AND is_required = true
      `
    } catch (_) {
      requiredQuestions = []
    }

    for (const question of requiredQuestions) {
      if (!questionAnswers || !questionAnswers[question.id] || !questionAnswers[question.id].trim()) {
        return NextResponse.json(
          {
            error: `Please answer the required question: "${question.question_text}"`,
          },
          { status: 400 },
        )
      }
    }

    // Create application with selected resume_id
    const applicationResult = await sql`
      INSERT INTO applications (job_id, seeker_id, status, resume_id)
      VALUES (${jobId}, ${user.id}, 'applied', ${resumeId})
      RETURNING id
    `

    const applicationId = applicationResult[0].id

    if (questionAnswers) {
      for (const [questionId, answer] of Object.entries(questionAnswers)) {
        if (answer && typeof answer === "string" && answer.trim()) {
          try {
            await sql`
              INSERT INTO application_answers (application_id, question_id, answer_text)
              VALUES (${applicationId}, ${Number.parseInt(questionId)}, ${answer.trim()})
            `
          } catch (_) {
            // ignore if table missing
          }
        }
      }
    }

    return NextResponse.json({ message: "Application submitted successfully" })
  } catch (error) {
    console.error("Job application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
