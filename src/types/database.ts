export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'client';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'admin' | 'client';
        };
        Update: {
          full_name?: string | null;
          role?: 'admin' | 'client';
        };
      };
      contracts: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          contract_type: 'performer' | 'management' | 'other';
          status: 'draft' | 'sent' | 'pending' | 'signed' | 'completed' | 'expired';
          file_url: string | null;
          client_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          signed_at: string | null;
        };
        Insert: {
          title: string;
          description?: string | null;
          contract_type: 'performer' | 'management' | 'other';
          status?: 'draft' | 'sent' | 'pending' | 'signed' | 'completed' | 'expired';
          file_url?: string | null;
          client_id?: string | null;
          created_by: string;
          expires_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          contract_type?: 'performer' | 'management' | 'other';
          status?: 'draft' | 'sent' | 'pending' | 'signed' | 'completed' | 'expired';
          file_url?: string | null;
          client_id?: string | null;
          expires_at?: string | null;
          signed_at?: string | null;
        };
      };
      contract_signatures: {
        Row: {
          id: string;
          contract_id: string;
          signer_id: string;
          signature_data: string;
          signed_at: string;
          ip_address: string | null;
        };
        Insert: {
          contract_id: string;
          signer_id: string;
          signature_data: string;
          ip_address?: string | null;
        };
        Update: {
          signature_data?: string;
        };
      };
      contract_form_fields: {
        Row: {
          id: string;
          contract_id: string;
          field_type: 'signature' | 'initial' | 'checkbox' | 'date' | 'text';
          field_data: Record<string, any>;
          created_by: string;
          created_at: string;
        };
        Insert: {
          contract_id: string;
          field_type: 'signature' | 'initial' | 'checkbox' | 'date' | 'text';
          field_data: Record<string, any>;
          created_by: string;
        };
        Update: {
          field_data?: Record<string, any>;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          contract_id: string;
          user_id: string;
          action: string;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          contract_id: string;
          user_id: string;
          action: string;
          details?: Record<string, any> | null;
        };
        Update: never;
      };
    };
  };
}