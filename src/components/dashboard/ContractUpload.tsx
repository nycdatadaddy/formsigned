import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { PDFFormBuilder } from '../pdf/PDFFormBuilder';
import { PDFFormField } from '../../types/pdf';
import { Upload, X, FileText, User } from 'lucide-react';

interface ContractUploadProps {
  onClose: () => void;
  onUpload: () => void;
  userId: string;
}

export function ContractUpload({ onClose, onUpload, userId }: ContractUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState<'performer' | 'management' | 'other'>('performer');
  const [clientEmail, setClientEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [formFields, setFormFields] = useState<PDFFormField[]>([]);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        // Create temporary URL for PDF preview
        const tempUrl = URL.createObjectURL(selectedFile);
        setFileUrl(tempUrl);
        setError('');
      } else {
        setError('Please select a PDF file');
        setFile(null);
        setFileUrl('');
      }
    }
  };

  const handleFormFieldsSave = (fields: PDFFormField[]) => {
    setFormFields(fields);
    setShowFormBuilder(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setLoading(true);
    setError('');

    try {
      let clientId = null;

      // If client email is provided, find or create client
      if (clientEmail.trim()) {
        // First check if user exists
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', clientEmail.trim())
          .single();

        if (existingUser) {
          clientId = existingUser.id;
        } else {
          // Create a new user profile (they'll need to sign up to access)
          const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
            clientEmail.trim()
          );

          if (authError) {
            // If invite fails, we can still create the contract without a client
            console.warn('Could not invite user:', authError);
          } else if (authData.user) {
            clientId = authData.user.id;
            
            // Create profile
            await supabase.from('user_profiles').insert({
              id: authData.user.id,
              email: clientEmail.trim(),
              role: 'client'
            });
          }
        }
      }

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      // Create contract record
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          contract_type: contractType,
          file_url: urlData.publicUrl,
          client_id: clientId,
          created_by: userId,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Save form fields if any
      if (formFields.length > 0) {
        const { error: fieldsError } = await supabase
          .from('contract_form_fields')
          .insert(
            formFields.map(field => ({
              contract_id: data.id,
              field_type: field.type,
              field_data: field,
              created_by: userId
            }))
          );

        if (fieldsError) {
          console.error('Error saving form fields:', fieldsError);
        }
      }
      // Log the action
      await supabase.from('audit_logs').insert({
        contract_id: data.id,
        user_id: userId,
        action: 'contract_created',
        details: { 
          title: title.trim(),
          type: contractType,
          client_email: clientEmail.trim() || null
        }
      });

      onUpload();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setLoading(false);
      // Clean up temporary URL
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload New Contract</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter contract title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Type
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="performer">Performer Contract</option>
              <option value="management">Management Contract</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Email (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="client@example.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to assign later
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF Contract File *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <div className="text-center">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload PDF</span>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              required
            />
            
            {file && (
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFormBuilder(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add Form Fields ({formFields.length})
                </button>
                {formFields.length > 0 && (
                  <span className="text-xs text-green-600">
                    {formFields.length} field{formFields.length !== 1 ? 's' : ''} configured
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file || !title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {loading ? 'Uploading...' : 'Upload Contract'}
            </button>
          </div>
        </form>
      </div>
      
      {showFormBuilder && fileUrl && (
        <PDFFormBuilder
          fileUrl={fileUrl}
          initialFields={formFields}
          onSave={handleFormFieldsSave}
          onCancel={() => setShowFormBuilder(false)}
        />
      )}
    </div>
  );
}