'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface RoleGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  scorerOnly?: boolean;
}

export default function RoleGuard({ children, adminOnly = false, scorerOnly = false }: RoleGuardProps) {
  const { user, isAdmin, isScorer } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You must be logged in to access this page.</p>
          <div className="mt-6">
            <Link
              href="/admin/login"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Administrator Access Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page is only accessible to administrators. You are logged in as: <strong>{user.role}</strong>
          </p>
          <div className="mt-6">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (scorerOnly && !isScorer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Scorer Access Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            This page is only accessible to official scorers. You are logged in as: <strong>{user.role}</strong>
          </p>
          <div className="mt-6">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
