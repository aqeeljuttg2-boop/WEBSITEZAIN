'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BadgeCheck, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [company, setCompany] = useState(user?.company || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [country, setCountry] = useState(user?.country || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Update states on reload/load
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || '');
      setCompany(user.company || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setZipCode(user.zipCode || '');
      setCountry(user.country || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          whatsapp,
          company,
          address,
          city,
          zipCode,
          country,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        await refreshUser(); // sync AuthContext state
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Profile Details</h2>
        <p className="text-xs text-white/40 mt-1">Manage your corporate credentials, billing contact points, and shipping address records.</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/35 text-green-400 p-3 rounded-lg text-xs flex items-center space-x-2">
          <BadgeCheck size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/35 text-red-400 p-3 rounded-lg text-xs flex items-center space-x-2">
          <ShieldAlert size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
        
        {/* Account Credentials */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A] border-b border-white/5 pb-2">Business Profile</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50">Full Name *</label>
              <input
                type="text" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50">Email Address (Cannot change)</label>
              <input
                type="email" disabled
                value={user?.email || ''}
                className="w-full bg-[#171017]/40 border border-white/5 text-white/30 px-3 py-2.5 rounded cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/50">Company Name (B2B)</label>
              <input
                type="text"
                value={company} onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50">Phone Number</label>
              <input
                type="tel"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50">WhatsApp Number</label>
              <input
                type="tel"
                value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#D6B36A] border-b border-white/5 pb-2">Default Address Records</h3>

          <div className="space-y-1.5">
            <label className="text-white/50">Street Address</label>
            <input
              type="text"
              value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              placeholder="e.g. 123 Main St"
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
              <label className="text-white/50">ZIP / Postal Code</label>
              <input
                type="text"
                value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50">Country</label>
              <input
                type="text"
                value={country} onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#C21875] hover:bg-[#A31260] disabled:bg-white/10 text-white font-bold text-xs uppercase tracking-wider px-8 py-3 rounded-full transition-colors flex items-center justify-center space-x-1"
        >
          <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
        </button>

      </form>
    </div>
  );
}
