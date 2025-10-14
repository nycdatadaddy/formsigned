import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { ContractSigningCard } from './ContractSigningCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { FileText, Clock, CheckCircle } from 'lucide-react';

interface ClientPortalProps {
  session: Session;
}

export function ClientPortal({ session }: ClientPortalProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');

  useEffect(() => {
    fetchClientContracts();
  }, [session]);

  const fetchClientContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching client contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingContracts = contracts.filter(c => 
    c.status === 'sent' || c.status === 'pending'
  );
  
  const signedContracts = contracts.filter(c => 
    c.status === 'signed' || c.status === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Contracts</h1>
        <p className="text-gray-600">Review and sign your performance contracts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{contracts.length}</p>
              <p className="text-sm text-gray-600">Total Contracts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-amber-600 mr-2" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{pendingContracts.length}</p>
              <p className="text-sm text-gray-600">Awaiting Signature</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{signedContracts.length}</p>
              <p className="text-sm text-gray-600">Signed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } transition-colors`}
          >
            Pending Signatures ({pendingContracts.length})
          </button>
          <button
            onClick={() => setActiveTab('signed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'signed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } transition-colors`}
          >
            Signed Contracts ({signedContracts.length})
          </button>
        </nav>
      </div>

      {/* Contract Lists */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingContracts.length > 0 ? (
            pendingContracts.map((contract) => (
              <ContractSigningCard
                key={contract.id}
                contract={contract}
                onSigned={fetchClientContracts}
                userId={session.user.id}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending contracts</h3>
              <p className="text-gray-600">All contracts are up to date</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'signed' && (
        <div className="space-y-4">
          {signedContracts.length > 0 ? (
            signedContracts.map((contract) => (
              <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{contract.title}</h3>
                    <p className="text-sm text-gray-600">{contract.description}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Signed
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Signed on {new Date(contract.signed_at).toLocaleDateString()}</span>
                  {contract.file_url && (
                    <button
                      onClick={() => window.open(contract.file_url, '_blank')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signed contracts</h3>
              <p className="text-gray-600">Signed contracts will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}