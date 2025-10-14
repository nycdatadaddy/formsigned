/*
  # Contract Management System Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (enum: admin, client)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contracts`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `contract_type` (enum: performer, management, other)
      - `status` (enum: draft, sent, pending, signed, completed, expired)
      - `file_url` (text, nullable)
      - `client_id` (uuid, foreign key to user_profiles)
      - `created_by` (uuid, foreign key to user_profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `expires_at` (timestamp, nullable)
      - `signed_at` (timestamp, nullable)
    
    - `contract_signatures`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to contracts)
      - `signer_id` (uuid, foreign key to user_profiles)
      - `signature_data` (text, base64 encoded signature)
      - `signed_at` (timestamp)
      - `ip_address` (text, nullable)
    
    - `audit_logs`
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to contracts)
      - `user_id` (uuid, foreign key to user_profiles)
      - `action` (text, describing the action taken)
      - `details` (jsonb, additional action details)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Ensure users can only access their own data
    - Allow admins to manage all contracts
    
  3. Storage
    - Create contracts bucket for PDF storage
    - Set up proper access policies for file storage
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  contract_type text NOT NULL DEFAULT 'other' CHECK (contract_type IN ('performer', 'management', 'other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending', 'signed', 'completed', 'expired')),
  file_url text,
  client_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  signed_at timestamptz
);

-- Create contract signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  signature_data text NOT NULL,
  signed_at timestamptz DEFAULT now(),
  ip_address text,
  UNIQUE(contract_id, signer_id)
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Contracts Policies
CREATE POLICY "Admins can manage all contracts"
  ON contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Clients can read their contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Contract Signatures Policies
CREATE POLICY "Users can read own signatures"
  ON contract_signatures
  FOR SELECT
  TO authenticated
  USING (
    signer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own signatures"
  ON contract_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (signer_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for contracts (if not exists)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
EXCEPTION WHEN others THEN
  -- Bucket might already exist, ignore error
  NULL;
END $$;

-- Create storage policy for contracts bucket
CREATE POLICY "Authenticated users can upload contracts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Users can view contract files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'contracts');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_contract_id ON audit_logs(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);