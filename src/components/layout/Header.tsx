import React from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { FileText, LogOut, User } from 'lucide-react';

interface HeaderProps {
  session?: Session | null;
  userRole?: 'admin' | 'client' | null;
}

export function Header({ session, userRole }: HeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-2">
              <h1 className="text-xl font-bold text-gray-900">ContractStage</h1>
              <p className="text-xs text-gray-600">Digital Contract Management</p>
            </div>
          </div>
          
          {session && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{session.user.email}</span>
                {userRole && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userRole === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userRole === 'admin' ? 'Producer' : 'Client'}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}