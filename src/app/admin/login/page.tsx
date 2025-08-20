'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      
      if (success) {
        router.push('/admin/dashboard');
      } else {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Tournament Director', username: 'tournament-director', password: 'PatronsCup2025!' },
    { role: 'Head Official', username: 'head-official', password: 'Muthaiga2025@' },
    { role: 'Scoring Official', username: 'scoring-official', password: 'LiveScore#2025' },
    { role: 'Course Marshal', username: 'course-marshal', password: 'GolfCourse$2025' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-yellow-400 rounded-full flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-green-800" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Tournament Official Access
          </h2>
          <p className="text-green-100">
            Secure login for tournament officials only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Official Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your official username"
                />
              </div>
            </div>

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
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowCredentials(!showCredentials)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              {showCredentials ? 'Hide' : 'Show'} Demo Credentials
            </button>
            
            {showCredentials && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-900">Demo Official Accounts</h4>
                </div>
                <div className="space-y-2">
                  {demoCredentials.map((cred, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="font-medium text-gray-900">{cred.role}</div>
                      <div className="text-gray-600">Username: <code className="bg-gray-100 px-1 rounded">{cred.username}</code></div>
                      <div className="text-gray-600">Password: <code className="bg-gray-100 px-1 rounded">{cred.password}</code></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
