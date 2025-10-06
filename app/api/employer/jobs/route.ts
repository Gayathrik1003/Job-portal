import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    await ensureJobTables()
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserFromToken(token)
    if (!user || user.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      title,
      description,
      experience_required,
      salary,
      location,
      country,
      is_remote,
      job_type,
      domain,
      contact_email,
      customQuestions,
    } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Job title and description are required" }, { status: 400 })
    }

    if (!contact_email) {
      return NextResponse.json({ error: "Contact email is required" }, { status: 400 })
    }

    const jobResult = await sql`
      INSERT INTO jobs (
        employer_id, 
        title, 
        description, 
        experience_required, 
        salary, 
        location, 
        country, 
        is_remote, 
        job_type, 
        domain,
        contact_email
      )
      VALUES (
        ${user.id}, 
        ${title}, 
        ${description}, 
        ${experience_required || null}, 
        ${salary || null}, 
        ${location || null}, 
        ${country || null}, 
        ${is_remote}, 
        ${job_type || null}, 
        ${domain || null},
        ${contact_email}
      )
      RETURNING id
    `

    const jobId = jobResult[0].id

    if (customQuestions && customQuestions.length > 0) {
      for (let i = 0; i < customQuestions.length; i++) {
        const question = customQuestions[i]
        if (question.text && question.text.trim()) {
          await sql`
            INSERT INTO job_questions (job_id, question_text, is_required, question_order)
            VALUES (${jobId}, ${question.text.trim()}, ${question.isRequired || false}, ${i + 1})
          `
        }
      }
    }

    return NextResponse.json({ message: "Job posted successfully" })
  } catch (error) {
    console.error("Post job error:", error)
    const message =
      (error as Error)?.message?.includes("relation") && (error as Error)?.message?.includes("does not exist")
        ? "Database not initialized. Please run the SQL setup scripts in /scripts."
        : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function ensureJobTables() {
  // Create jobs table if missing (minimal schema used by this endpoint)
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      employer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      experience_required VARCHAR(100),
      salary VARCHAR(100),
      location VARCHAR(255),
      country VARCHAR(100),
      is_remote BOOLEAN DEFAULT FALSE,
      job_type VARCHAR(50),
      domain VARCHAR(100),
      is_open BOOLEAN DEFAULT TRUE,
      posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Add columns that later scripts introduce, if missing
  await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`

  // Supporting table for custom questions
  await sql`
    CREATE TABLE IF NOT EXISTS job_questions (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      is_required BOOLEAN DEFAULT FALSE,
      question_order INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
}
