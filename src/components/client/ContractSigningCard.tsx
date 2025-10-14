import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SignatureCanvas } from './SignatureCanvas';
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
  const [showSignature, setShowSignature] = useState(false);
  const [loading, setLoading] = useState(false);

  const isExpired = contract.expires_at && new Date(contract.expires_at) < new Date();

  const handleSign = async (signatureData: string) => {
    setLoading(true);
    try {
      // Create signature record
      const { error: sigError } = await supabase
        .from('contract_signatures')
        .insert({
          contract_id: contract.id,
          signer_id: userId,
          signature_data: signatureData,
          ip_address: null // In a real implementation, you'd capture the IP
        });

      if (sigError) throw sigError;

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
          signature_method: 'digital'
        }
      });

      onSigned();
      setShowSignature(false);
    } catch (error) {
      console.error('Error signing contract:', error);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => window.open(contract.file_url, '_blank')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Eye className="h-4 w-4 mr-1" />
              Review Contract
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

          {!isExpired && (
            <button
              onClick={() => setShowSignature(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <PenTool className="h-4 w-4 mr-1" />
              Sign Contract
            </button>
          )}
        </div>
      </div>

      {showSignature && (
        <SignatureCanvas
          onSave={handleSign}
          onCancel={() => setShowSignature(false)}
          loading={loading}
          contractTitle={contract.title}
        />
      )}
    </div>
  );
}