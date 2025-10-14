import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  Shield, 
  User, 
  Calendar, 
  FileText, 
  Send, 
  PenTool,
  Trash2,
  Plus,
  Eye 
} from 'lucide-react';

export function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_profiles(full_name, email),
          contract:contracts(title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      contract_created: Plus,
      contract_sent: Send,
      contract_signed: PenTool,
      contract_viewed: Eye,
      contract_deleted: Trash2,
      contract_updated: FileText,
    };
    
    return icons[action] || FileText;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      contract_created: 'text-blue-600 bg-blue-100',
      contract_sent: 'text-purple-600 bg-purple-100',
      contract_signed: 'text-green-600 bg-green-100',
      contract_viewed: 'text-gray-600 bg-gray-100',
      contract_deleted: 'text-red-600 bg-red-100',
      contract_updated: 'text-amber-600 bg-amber-100',
    };
    
    return colors[action] || 'text-gray-600 bg-gray-100';
  };

  const getActionText = (action: string) => {
    const texts: Record<string, string> = {
      contract_created: 'Created contract',
      contract_sent: 'Sent contract',
      contract_signed: 'Signed contract',
      contract_viewed: 'Viewed contract',
      contract_deleted: 'Deleted contract',
      contract_updated: 'Updated contract',
    };
    
    return texts[action] || action.replace('_', ' ');
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.action === filter;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Audit Trail
        </h2>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {getActionText(action)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log, index) => {
              const ActionIcon = getActionIcon(log.action);
              const actionColor = getActionColor(log.action);
              
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${actionColor}`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {getActionText(log.action)}
                          </p>
                          {log.contract?.title && (
                            <span className="text-sm text-gray-600">
                              "{log.contract.title}"
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="mt-1 flex items-center space-x-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {log.user?.full_name || log.user?.email || 'Unknown User'}
                        </span>
                      </div>
                      
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <strong>Details:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs</h3>
            <p className="text-gray-600">Activity will appear here as contracts are managed</p>
          </div>
        )}
      </div>
    </div>
  );
}