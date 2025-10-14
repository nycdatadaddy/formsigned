import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SendContractModal } from './SendContractModal';
import { Send, Download, Eye, MoreVertical, Trash2, CreditCard as Edit, Copy } from 'lucide-react';

interface ContractActionsProps {
  contract: any;
  onUpdate: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export function ContractActions({ contract, onUpdate, loading, setLoading }: ContractActionsProps) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contract?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        contract_id: contract.id,
        user_id: contract.created_by,
        action: 'contract_deleted',
        details: { title: contract.title }
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (contract.file_url) {
      window.open(contract.file_url, '_blank');
    }
  };

  const canSend = contract.status === 'draft' && contract.client_id;
  const canDownload = contract.file_url;

  return (
    <>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          {canSend && (
            <button
              onClick={() => setShowSendModal(true)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </button>
          )}

          {canDownload && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <MoreVertical className="h-3 w-3" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowActions(false);
                    // Handle edit
                  }}
                  className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Contract
                </button>
                
                <button
                  onClick={() => {
                    setShowActions(false);
                    // Handle duplicate
                  }}
                  className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Duplicate
                </button>
                
                {canDownload && (
                  <button
                    onClick={() => {
                      setShowActions(false);
                      handleDownload();
                    }}
                    className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download PDF
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowActions(false);
                    handleDelete();
                  }}
                  className="flex items-center px-4 py-2 text-xs text-red-700 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSendModal && (
        <SendContractModal
          contract={contract}
          onClose={() => setShowSendModal(false)}
          onSent={onUpdate}
        />
      )}
    </>
  );
}