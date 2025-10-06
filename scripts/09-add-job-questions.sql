-- Add custom questions table for job postings
CREATE TABLE IF NOT EXISTS job_questions (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add application answers table for custom questions
CREATE TABLE IF NOT EXISTS application_answers (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES job_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id, question_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_questions_job_id ON job_questions(job_id);
CREATE INDEX IF NOT EXISTS idx_application_answers_application_id ON application_answers(application_id);
