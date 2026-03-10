/*
  # Add Task Assignment Feature

  1. Changes
    - Add `assigned_to` column to `tasks` table to store the name of the person assigned to the task
    - Add `assigned_to_guest_id` column to optionally link to a guest in the event

  2. Notes
    - Uses flexible text field for assigned_to to allow any name
    - Optional foreign key to guests table for better integration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_to_guest_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_to_guest_id uuid REFERENCES guests(id) ON DELETE SET NULL;
  END IF;
END $$;
