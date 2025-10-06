-- Add contact_email column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Update existing jobs to use employer's email as default contact
UPDATE jobs 
SET contact_email = u.email 
FROM users u 
WHERE jobs.employer_id = u.id AND jobs.contact_email IS NULL;
