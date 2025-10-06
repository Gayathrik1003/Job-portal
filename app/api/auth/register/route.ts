import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Ensure required tables exist to avoid fresh-DB failures after drop
    await ensureCoreTables()

    const { email, password, role } = await request.json()

    console.log("Registration attempt:", { email, role })

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["job_seeker", "employer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)
    console.log("Password hashed successfully")

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, is_paid, email_verified)
      VALUES (${email}, ${passwordHash}, ${role}, true, false)
      RETURNING id, email, role, is_paid
    `

    console.log("User created:", { id: user.id, email: user.email, role: user.role })

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log("Token created successfully")

    // Set cookie
    const response = NextResponse.json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_paid: user.is_paid,
      },
    })

    // Determine cookie options based on environment
    const isPreviewOrProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "preview"
    const cookieOptions = {
      httpOnly: true,
      secure: isPreviewOrProduction,
      sameSite: "lax" as const, // Changed from conditional "none" or "lax"
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    response.cookies.set("auth-token", token, cookieOptions)

    console.log("Cookie set successfully with options:", cookieOptions)

    return response
  } catch (error) {
    console.error("Registration error:", error)
    const message =
      (error as Error)?.message?.includes("relation") && (error as Error)?.message?.includes("does not exist")
        ? "Database not initialized. Please run the SQL setup scripts in /scripts."
        : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function ensureCoreTables() {
  // Minimal bootstrap for registration flow. Safe to run repeatedly.
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('job_seeker', 'employer', 'admin')),
      is_paid BOOLEAN DEFAULT FALSE,
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
  await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`

  await sql`
    CREATE TABLE IF NOT EXISTS job_seeker_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      education TEXT,
      resume_url VARCHAR(500),
      job_preferences JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      website VARCHAR(255),
      logo_url VARCHAR(500),
      location VARCHAR(255),
      industry VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
}
