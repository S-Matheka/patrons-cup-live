'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Eye, EyeOff, Shield, Settings } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'scorer'>('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(selectedRole, password);
      
      if (success) {
        router.push('/admin/dashboard');
      } else {
        setError('Invalid credentials. Please check your password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <img
              src="/patrons-cup-logo.png"
              alt="Patrons Cup Logo"
              className="h-16 w-16 object-contain"
              onError={(e) => {
                // Fallback to shield icon if logo fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            <div className="hidden h-10 w-10 text-green-800 items-center justify-center">
              <Shield className="h-10 w-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Tournament Official Access
          </h2>
          <p className="text-green-100 mb-2">
            4th Edition Patron's Cup 2025
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'admin'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Shield className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Administrator</div>
                  <div className="text-xs text-gray-500">Full Access</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('scorer')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRole === 'scorer'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Official Scorer</div>
                  <div className="text-xs text-gray-500">Scoring Only</div>
                </button>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                `Sign in as ${selectedRole === 'admin' ? 'Administrator' : 'Official Scorer'}`
              )}
            </button>
          </form>

          {/* Back to Public Site */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Tournament Dashboard
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-green-100 opacity-75">
          <p>🔒 This is a secure area for tournament officials only.</p>
          <p>Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}