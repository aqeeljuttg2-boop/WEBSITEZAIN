'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, KeyRound, Globe, Phone, Landmark, AlertTriangle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await register({
        name,
        email,
        password,
        company,
        phone,
        whatsapp,
        country,
        address,
        city,
        zipCode,
      });

      if (result.success) {
        window.location.href = '/account';
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 max-w-xl mx-auto px-4 text-white">
      <div className="bg-[#1c141c] border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Create Business Account</h2>
          <p className="text-xs text-white/50">Register to open B2B wholesale access, check quantity breaks, and download PDF catalogues.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/35 text-red-400 p-3 rounded-lg text-xs flex items-center space-x-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <User size={12} className="text-[#C21875]" />
                <span>Full Name *</span>
              </label>
              <input
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <Mail size={12} className="text-[#C21875]" />
                <span>Email Address *</span>
              </label>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <KeyRound size={12} className="text-[#C21875]" />
                <span>Password *</span>
              </label>
              <input
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <Landmark size={12} className="text-[#C21875]" />
                <span>Company / Hospital Name</span>
              </label>
              <input
                type="text"
                value={company} onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                placeholder="e.g. Apex Hospital Group"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <Phone size={12} className="text-[#C21875]" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <Phone size={12} className="text-green-400" />
                <span>WhatsApp Number</span>
              </label>
              <input
                type="tel"
                value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                placeholder="with country code"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50">Street Address</label>
            <input
              type="text"
              value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50">City</label>
              <input
                type="text"
                value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50">ZIP Code</label>
              <input
                type="text"
                value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 flex items-center space-x-1">
                <Globe size={12} className="text-[#C21875]" />
                <span>Country *</span>
              </label>
              <input
                type="text" required
                value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#C21875] hover:bg-[#A31260] text-white font-bold text-xs uppercase tracking-wider py-4 rounded-full transition-colors flex items-center justify-center space-x-1 mt-6"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-white/40 border-t border-white/5 pt-4">
          <p>Already have an account? <Link href="/login" className="text-[#D6B36A] hover:underline font-bold">Sign In</Link></p>
        </div>

      </div>
    </div>
  );
}
