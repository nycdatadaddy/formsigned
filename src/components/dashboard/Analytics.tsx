import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users 
} from 'lucide-react';

interface AnalyticsProps {
  contracts: any[];
}

export function Analytics({ contracts }: AnalyticsProps) {
  const getAnalytics = () => {
    const total = contracts.length;
    const signed = contracts.filter(c => c.status === 'signed' || c.status === 'completed').length;
    const pending = contracts.filter(c => c.status === 'pending' || c.status === 'sent').length;
    const expired = contracts.filter(c => c.status === 'expired').length;
    const draft = contracts.filter(c => c.status === 'draft').length;

    const signatureRate = total > 0 ? Math.round((signed / total) * 100) : 0;
    
    const typeBreakdown = {
      performer: contracts.filter(c => c.contract_type === 'performer').length,
      management: contracts.filter(c => c.contract_type === 'management').length,
      other: contracts.filter(c => c.contract_type === 'other').length,
    };

    const recentActivity = contracts
      .filter(c => c.signed_at)
      .sort((a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime())
      .slice(0, 5);

    return {
      total,
      signed,
      pending,
      expired,
      draft,
      signatureRate,
      typeBreakdown,
      recentActivity
    };
  };

  const analytics = getAnalytics();

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Contracts"
          value={analytics.total}
          icon={BarChart3}
          color="text-blue-600"
        />
        <StatCard
          title="Signed Contracts"
          value={analytics.signed}
          icon={CheckCircle}
          color="text-green-600"
          subtitle={`${analytics.signatureRate}% completion rate`}
        />
        <StatCard
          title="Pending Signatures"
          value={analytics.pending}
          icon={Clock}
          color="text-amber-600"
        />
        <StatCard
          title="Expired Contracts"
          value={analytics.expired}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Contract Types
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Performer Contracts</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${analytics.total > 0 ? (analytics.typeBreakdown.performer / analytics.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">{analytics.typeBreakdown.performer}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Management Contracts</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics.total > 0 ? (analytics.typeBreakdown.management / analytics.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">{analytics.typeBreakdown.management}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Other Contracts</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full" 
                    style={{ width: `${analytics.total > 0 ? (analytics.typeBreakdown.other / analytics.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">{analytics.typeBreakdown.other}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Signatures */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Signatures
          </h3>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((contract, index) => (
                <div key={contract.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{contract.title}</p>
                    <p className="text-xs text-gray-500">
                      {contract.client?.full_name || contract.client?.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(contract.signed_at).toLocaleDateString()}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Signed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No signatures yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.signatureRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.signed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{analytics.pending}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{analytics.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
        </div>
      </div>
    </div>
  );
}