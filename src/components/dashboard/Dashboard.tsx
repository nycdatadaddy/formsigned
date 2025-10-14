import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { ContractList } from './ContractList';
import { ContractUpload } from './ContractUpload';
import { Analytics } from './Analytics';
import { AuditLog } from './AuditLog';
import { Plus, BarChart3, FileText, Shield } from 'lucide-react';

interface DashboardProps {
  session: Session;
}

export function Dashboard({ session }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'contracts' | 'analytics' | 'audit'>('contracts');
  const [showUpload, setShowUpload] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:user_profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Producer Dashboard</h1>
          <p className="text-gray-600">Manage contracts and track signatures</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Contract
        </button>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'contracts' && (
        <ContractList 
          contracts={contracts} 
          loading={loading} 
          onRefresh={fetchContracts}
        />
      )}
      
      {activeTab === 'analytics' && <Analytics contracts={contracts} />}
      
      {activeTab === 'audit' && <AuditLog />}

      {showUpload && (
        <ContractUpload
          onClose={() => setShowUpload(false)}
          onUpload={fetchContracts}
          userId={session.user.id}
        />
      )}
    </div>
  );
}