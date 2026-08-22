'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Mail, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'SUPERADMIN' || user.role === 'ADMIN' || user.role === 'STAFF') {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const role = result.user?.role;
        if (role === 'SUPERADMIN' || role === 'ADMIN' || role === 'STAFF') {
          router.push('/admin');
        } else {
          router.push('/account');
        }
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-24 max-w-md mx-auto px-4 text-white">
      <div className="bg-[#1c141c] border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Account Login</h2>
          <p className="text-xs text-white/50">Login to place orders, track shipments, or access the dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/35 text-red-400 p-3 rounded-lg text-xs flex items-center space-x-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-white/50 flex items-center space-x-1">
              <Mail size={12} className="text-[#C21875]" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 flex items-center space-x-1">
              <KeyRound size={12} className="text-[#C21875]" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-full transition-colors flex items-center justify-center space-x-1"
          >
            <span>{isSubmitting ? 'Logging in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-white/40 border-t border-white/5 pt-4 space-y-2">
          <p>Don't have an account yet?</p>
          <Link href="/register" className="text-[#D6B36A] hover:underline font-bold">
            Create Business Account
          </Link>
        </div>

      </div>
    </div>
  );
}
