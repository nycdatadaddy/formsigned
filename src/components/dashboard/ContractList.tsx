import React from 'react';
import { ContractCard } from './ContractCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ContractListProps {
  contracts: any[];
  loading: boolean;
  onRefresh: () => void;
}

export function ContractList({ contracts, loading, onRefresh }: ContractListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No contracts yet</div>
        <p className="text-gray-400">Upload your first contract to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contracts.map((contract) => (
        <ContractCard
          key={contract.id}
          contract={contract}
          onUpdate={onRefresh}
        />
      ))}
    </div>
  );
}