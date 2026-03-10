/*
  # Add Event Target Person Feature

  1. Changes
    - Add `event_for` column to `events` table to store who the event is for (e.g., "自分", "子供", "家族", "友人")
    - This helps users understand the relationship and context of each event

  2. Notes
    - Uses text field to allow flexible input
    - Common values: "自分", "子供", "長男", "長女", "家族", "友人", "親", "祖父母" etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_for'
  ) THEN
    ALTER TABLE events ADD COLUMN event_for text;
  END IF;
END $$;
