-- Add status_updated_at column to applications table if it doesn't exist
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have a status_updated_at value
UPDATE applications 
SET status_updated_at = created_at 
WHERE status_updated_at IS NULL;
