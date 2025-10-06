-- Remove all mock/sample data added by seed scripts
-- This will keep only your original job seeker and hirer accounts

-- Delete all applications first (foreign key constraints)
DELETE FROM applications;

-- Delete all jobs
DELETE FROM jobs;

-- Delete all employer profiles except your original one
DELETE FROM employer_profiles 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'employer@techcorp.com'
);

-- Delete all job seeker profiles except your original one  
DELETE FROM job_seeker_profiles
WHERE user_id IN (
    SELECT id FROM users 
    WHERE email = 'jobseeker@example.com'
);

-- Delete the mock users (keep your original accounts)
DELETE FROM users 
WHERE email IN ('employer@techcorp.com', 'jobseeker@example.com');

-- Keep notifications table clean
DELETE FROM notifications 
WHERE user_id NOT IN (SELECT id FROM users);

COMMIT;
