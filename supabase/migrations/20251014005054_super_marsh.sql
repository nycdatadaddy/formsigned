/*
  # Add PDF Form Fields Support

  1. New Tables
    - `contract_form_fields`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key)
      - `field_type` (text)
      - `field_data` (jsonb)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Updates to existing tables
    - Update `contract_signatures` to support multiple field types
    - Add `field_id` and `field_type` columns

  3. Security
    - Enable RLS on new table
    - Add appropriate policies
*/

-- Create contract form fields table
CREATE TABLE IF NOT EXISTS contract_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  field_type text NOT NULL CHECK (field_type IN ('signature', 'initial', 'checkbox', 'date', 'text')),
  field_data jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_form_fields_contract_id ON contract_form_fields(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_form_fields_type ON contract_form_fields(field_type);

-- Enable RLS
ALTER TABLE contract_form_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_form_fields
CREATE POLICY "Admins can manage all form fields"
  ON contract_form_fields
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Clients can read form fields for their contracts"
  ON contract_form_fields
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts 
      WHERE contracts.id = contract_form_fields.contract_id 
      AND contracts.client_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Update contract_signatures table to support form fields
DO $$
BEGIN
  -- Add field_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contract_signatures' AND column_name = 'field_id'
  ) THEN
    ALTER TABLE contract_signatures ADD COLUMN field_id text;
  END IF;

  -- Add field_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contract_signatures' AND column_name = 'field_type'
  ) THEN
    ALTER TABLE contract_signatures ADD COLUMN field_type text CHECK (field_type IN ('signature', 'initial', 'checkbox', 'date', 'text'));
  END IF;
END $$;

-- Update the unique constraint to allow multiple signatures per contract (for different fields)
DO $$
BEGIN
  -- Drop the old unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contract_signatures_contract_id_signer_id_key'
  ) THEN
    ALTER TABLE contract_signatures DROP CONSTRAINT contract_signatures_contract_id_signer_id_key;
  END IF;

  -- Add new unique constraint that includes field_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contract_signatures_contract_signer_field_key'
  ) THEN
    ALTER TABLE contract_signatures ADD CONSTRAINT contract_signatures_contract_signer_field_key 
    UNIQUE (contract_id, signer_id, field_id);
  END IF;
END $$;

-- Add index for field lookups
CREATE INDEX IF NOT EXISTS idx_contract_signatures_field_id ON contract_signatures(field_id);