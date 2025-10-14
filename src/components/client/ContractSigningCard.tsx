import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PDFViewer } from '../pdf/PDFViewer';
import { PDFFormField } from '../../types/pdf';
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  PenTool, 
  Download,
  Eye,
  Clock
} from 'lucide-react';

interface ContractSigningCardProps {
  contract: any;
  onSigned: () => void;
  userId: string;
}

export function ContractSigningCard({ contract, onSigned, userId }: ContractSigningCardProps) {
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [formFields, setFormFields] = useState<PDFFormField[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchFormFields();
  }, [contract.id]);

  const fetchFormFields = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_form_fields')
        .select('field_data')
        .eq('contract_id', contract.id);

      if (error) throw error;
      
      const fields = data?.map(item => item.field_data as PDFFormField) || [];
      setFormFields(fields);
    } catch (error) {
      console.error('Error fetching form fields:', error);
    }
  };
  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date();

  const handleFieldUpdate = async (fieldId: string, value: any) => {
    // Update local state
    setFormFields(prev => prev.map(field => 
      field.id === fieldId 
        ? { ...field, value, completed: true }
        : field
    ));
  };

  const handleCompleteContract = async () => {
    setLoading(true);
    try {
      // Save all completed form fields
      const completedFields = formFields.filter(field => field.completed);
      
      for (const field of completedFields) {
        await supabase
          .from('contract_signatures')
          .upsert({
            contract_id: contract.id,
            signer_id: userId,
            field_id: field.id,
            signature_data: field.value,
            field_type: field.type,
            signed_at: new Date().toISOString()
          });
      }

      // Update contract status
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from('audit_logs').insert({
        contract_id: contract.id,
        user_id: userId,
        action: 'contract_signed',
        details: { 
          title: contract.title,
          fields_completed: completedFields.length
        }
      });

      onSigned();
      setShowPDFViewer(false);
    } catch (error) {
      console.error('Error signing contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const allRequiredFieldsCompleted = formFields
    .filter(field => field.required)
    .every(field => field.completed);

  const completedFieldsCount = formFields.filter(field => field.completed).length;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{contract.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {contract.description || 'Performance contract requiring your signature'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Sent {new Date(contract.created_at).toLocaleDateString()}
            </div>
            
            {contract.expires_at && (
              <div className={`flex items-center ${isExpired ? 'text-red-600' : ''}`}>
                <Clock className="h-4 w-4 mr-1" />
                {isExpired ? 'Expired' : 'Expires'} {new Date(contract.expires_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          contract.contract_type === 'performer' 
            ? 'bg-purple-100 text-purple-800'
            : contract.contract_type === 'management'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {contract.contract_type}
        </span>
      </div>

      {isExpired && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">
              This contract has expired. Please contact the producer for a new version.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {contract.file_url && (
            <button
              onClick={() => setShowPDFViewer(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PenTool className="h-4 w-4 mr-1" />
              {formFields.length > 0 ? `Sign Contract (${completedFieldsCount}/${formFields.length})` : 'Review & Sign'}
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {contract.file_url && (
            <button
              onClick={() => window.open(contract.file_url, '_blank')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          )}

          {!isExpired && formFields.length > 0 && allRequiredFieldsCompleted && (
            <button
              onClick={handleCompleteContract}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              {loading ? 'Completing...' : 'Complete Contract'}
            </button>
          )}
        </div>
      </div>

      {showPDFViewer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
                <p className="text-sm text-gray-600">
                  Complete all required fields to sign this contract
                </p>
              </div>
              <button
                onClick={() => setShowPDFViewer(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <PDFViewer
              fileUrl={contract.file_url}
              fields={formFields}
              onFieldUpdate={handleFieldUpdate}
              isEditable={true}
              showAnnotations={true}
            />
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Progress: {completedFieldsCount} of {formFields.length} fields completed
                {!allRequiredFieldsCompleted && (
                  <span className="text-red-600 ml-2">
                    (Complete all required fields to finish)
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPDFViewer(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
                
                {allRequiredFieldsCompleted && (
                  <button
                    onClick={handleCompleteContract}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Completing...' : 'Complete Contract'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}