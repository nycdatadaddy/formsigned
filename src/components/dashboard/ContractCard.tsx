import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ContractActions } from './ContractActions';
import { 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  FileText 
} from 'lucide-react';

interface ContractCardProps {
  contract: any;
  onUpdate: () => void;
}

export function ContractCard({ contract, onUpdate }: ContractCardProps) {
  const [loading, setLoading] = useState(false);

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: FileText, 
        text: 'Draft' 
      },
      sent: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Clock, 
        text: 'Sent' 
      },
      pending: { 
        color: 'bg-amber-100 text-amber-800', 
        icon: AlertCircle, 
        text: 'Pending' 
      },
      signed: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        text: 'Signed' 
      },
      completed: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        text: 'Completed' 
      },
      expired: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle, 
        text: 'Expired' 
      }
    };
    
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const statusConfig = getStatusConfig(contract.status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    const colors = {
      performer: 'bg-purple-100 text-purple-800',
      management: 'bg-blue-100 text-blue-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
            {contract.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {contract.description || 'No description provided'}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.text}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(contract.contract_type)}`}>
            {contract.contract_type}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="truncate">
            {contract.client?.full_name || contract.client?.email || 'No client assigned'}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Created {formatDate(contract.created_at)}</span>
        </div>

        {contract.expires_at && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Expires {formatDate(contract.expires_at)}</span>
          </div>
        )}

        {contract.signed_at && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Signed {formatDate(contract.signed_at)}</span>
          </div>
        )}
      </div>

      <ContractActions
        contract={contract}
        onUpdate={onUpdate}
        loading={loading}
        setLoading={setLoading}
      />
    </div>
  );
}