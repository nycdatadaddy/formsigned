import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Send, Calendar } from 'lucide-react';

interface SendContractModalProps {
  contract: any;
  onClose: () => void;
  onSent: () => void;
}

export function SendContractModal({ contract, onClose, onSent }: SendContractModalProps) {
  const [message, setMessage] = useState(`Please review and sign the attached contract: ${contract.title}`);
  const [expiryDays, setExpiryDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Update contract status and expiry
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'sent',
          expires_at: expiresAt.toISOString()
        })
        .eq('id', contract.id);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from('audit_logs').insert({
        contract_id: contract.id,
        user_id: contract.created_by,
        action: 'contract_sent',
        details: { 
          client_email: contract.client?.email,
          expires_at: expiresAt.toISOString(),
          message: message
        }
      });

      // In a real implementation, you would send an email here
      // For now, we'll simulate it
      console.log('Contract sent to:', contract.client?.email);
      console.log('Message:', message);

      onSent();
      onClose();
    } catch (error: any) {
      console.error('Send error:', error);
      setError(error.message || 'Failed to send contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Send Contract</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Sending to: <strong>{contract.client?.email}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Add a personal message..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Expires in (days)
            </label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contract will expire and require resending after this period
            </p>
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}