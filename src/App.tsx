import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { ClientPortal } from './components/client/ClientPortal';
import { Header } from './components/layout/Header';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || 'client');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('client');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} userRole={userRole} />
      {userRole === 'admin' ? (
        <Dashboard session={session} />
      ) : (
        <ClientPortal session={session} />
      )}
    </div>
  );
}

export default App;