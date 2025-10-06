-- Update applications status check constraint to include 'waitlisted'
DO $$
BEGIN
  -- Drop existing constraint if it exists (name may vary in some DBs)
  BEGIN
    ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
  EXCEPTION WHEN undefined_object THEN
    -- ignore if constraint missing
    NULL;
  END;

  -- Recreate with waitlisted allowed
  ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('applied', 'accepted', 'rejected', 'waitlisted'));
END $$;



