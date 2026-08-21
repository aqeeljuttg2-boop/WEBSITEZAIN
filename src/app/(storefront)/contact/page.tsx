'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dynamic settings
  const [settings, setSettings] = useState({
    companyName: 'Lash Tweezers lounge',
    companyAddress: 'King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot.',
    companyPhone: '+92-334-8012580',
    whatsappNumber: '+923348012580',
    companyEmail: 'info@lashtweezerslounge.com',
    instagramUrl: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr'
  });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Submit as inquiry to backend
    try {
      await fetch('/api/admin/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: '',
          notes: `[Contact Form] Subject: ${subject}\nMessage: ${message}`,
          items: [{ productName: subject || 'General Contact Inquiry', quantity: 1 }]
        })
      });
    } catch (_) {}

    setIsSubmitting(false);
    setSuccess(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Get in Touch</span>
        <h1 className="text-4xl font-bold tracking-tight">Contact {settings.companyName}</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Whether you need bulk wholesale quotations, custom OEM laser branding, or sample eyelash tweezers sets, our factory sales team is ready to assist you.
        </p>
      </div>

      {/* 2. Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Columns: Info Cards */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl flex space-x-4">
            <div className="p-3.5 bg-[#261c26] text-[#C21875] rounded-xl shrink-0 h-fit">
              <MapPin size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Manufacturing Headquarters</h4>
              <p className="text-xs text-white/60 leading-relaxed mt-1">
                {settings.companyName}<br />
                {settings.companyAddress}
              </p>
            </div>
          </div>

          <div className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl flex space-x-4">
            <div className="p-3.5 bg-[#261c26] text-[#C21875] rounded-xl shrink-0 h-fit">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Phone Support</h4>
              <p className="text-xs text-white/60 mt-1">Phone: <a href={`tel:${settings.companyPhone}`} className="text-white hover:text-[#C21875] font-mono font-bold">{settings.companyPhone}</a></p>
              <p className="text-xs text-white/60">WhatsApp: <span className="text-white font-mono font-bold">{settings.whatsappNumber}</span></p>
            </div>
          </div>

          <div className="bg-[#1c141c] border border-white/5 p-6 rounded-2xl flex space-x-4">
            <div className="p-3.5 bg-[#261c26] text-[#D6B36A] rounded-xl shrink-0 h-fit">
              <Mail size={20} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Email Correspondence</h4>
              <p className="text-xs text-[#D6B36A] mt-1 font-mono">
                <a href={`mailto:${settings.companyEmail}`} className="hover:underline">{settings.companyEmail}</a>
              </p>
            </div>
          </div>

          {/* Official Instagram Card */}
          <div className="bg-gradient-to-br from-[#2a0b1e] via-[#1c141c] to-[#171017] border border-[#C21875]/40 p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 rounded-lg text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <h4 className="font-bold text-white text-sm">Official Instagram</h4>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Follow our daily product demos, live salon testing videos, and direct customer messages on Instagram.
            </p>
            <a 
              href={settings.instagramUrl}
              target="_blank" rel="noopener noreferrer"
              className="w-full text-center bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-full transition-all flex items-center justify-center space-x-1.5 shadow"
            >
              <span>Follow @lash_tweezers_lounge</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Direct WhatsApp Action */}
          <div className="bg-[#1c141c] border border-emerald-500/20 p-6 rounded-2xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <MessageSquare size={18} />
              <h4 className="font-bold text-white text-sm">WhatsApp Fast Desk</h4>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              Need immediate answers regarding shipping timelines or wholesale quantity rates?
            </p>
            <a 
              href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(settings.companyName)},%20I%20am%20inquiring%20about%20your%20instruments.`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full text-center bg-[#25D366] hover:bg-[#1EBE5D] text-black font-bold text-xs uppercase tracking-wider py-3 rounded-full transition-colors flex items-center justify-center space-x-1.5 shadow"
            >
              <span>Chat on WhatsApp</span>
            </a>
          </div>

        </div>

        {/* Right Form: Inquiries */}
        <div className="lg:col-span-2 bg-[#1c141c] border border-white/5 p-8 md:p-12 rounded-3xl space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-2xl font-bold">Send an Official Message</h2>
            <p className="text-xs text-white/50 mt-1">Our international sales representative will respond within 12-24 business hours.</p>
          </div>

          {success ? (
            <div className="p-8 bg-[#261c26] border border-[#C21875]/40 rounded-2xl text-center space-y-4">
              <CheckCircle2 size={48} className="text-[#C21875] mx-auto animate-bounce" />
              <h3 className="text-xl font-bold">Message Received</h3>
              <p className="text-xs text-white/60 max-w-md mx-auto">
                Thank you for contacting Lash Tweezers Lounge. An export officer has been assigned to your query and will contact you via email or WhatsApp shortly.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="text-xs text-[#D6B36A] underline pt-2 font-mono"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/70 block mb-1.5 font-bold uppercase tracking-wider">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C21875]"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1.5 font-bold uppercase tracking-wider">Your Official Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. elena@salonacademy.com"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C21875]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1.5 font-bold uppercase tracking-wider">Inquiry Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Volume Lash Tweezers B2B Quotation / Custom Laser Engraving"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C21875]"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1.5 font-bold uppercase tracking-wider">Detailed Message / Specs *</label>
                <textarea
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please specify item codes, quantity requirements, logo engraving preferences, and destination country..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl p-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#C21875] leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#C21875] hover:bg-[#A31260] disabled:opacity-40 text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-full transition-all flex items-center space-x-2"
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Sending Message...' : 'Submit Inquiry'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
