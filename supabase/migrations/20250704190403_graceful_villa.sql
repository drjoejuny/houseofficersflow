/*
  # Create house officers table

  1. New Tables
    - `house_officers`
      - `id` (text, primary key) - Unique identifier for each house officer
      - `fullName` (text) - Full name of the house officer
      - `gender` (text) - Gender (Male/Female)
      - `dateSignedIn` (text) - Date when officer signed in (ISO format)
      - `unitAssigned` (text) - Medical unit assigned to
      - `clinicalPresentationTopic` (text, optional) - Topic for clinical presentation
      - `clinicalPresentationDate` (text, optional) - Date of clinical presentation
      - `expectedSignOutDate` (text) - Expected sign out date (calculated)
      - `createdAt` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `house_officers` table
    - Add policy for public access (since this is a departmental tool)
*/

CREATE TABLE IF NOT EXISTS house_officers (
  id text PRIMARY KEY,
  "fullName" text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  "dateSignedIn" text NOT NULL,
  "unitAssigned" text NOT NULL,
  "clinicalPresentationTopic" text DEFAULT '',
  "clinicalPresentationDate" text DEFAULT '',
  "expectedSignOutDate" text NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE house_officers ENABLE ROW LEVEL SECURITY;

-- Allow public access for departmental use
CREATE POLICY "Allow public access to house officers"
  ON house_officers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_house_officers_created_at ON house_officers("createdAt");
CREATE INDEX IF NOT EXISTS idx_house_officers_unit ON house_officers("unitAssigned");
CREATE INDEX IF NOT EXISTS idx_house_officers_sign_out ON house_officers("expectedSignOutDate");