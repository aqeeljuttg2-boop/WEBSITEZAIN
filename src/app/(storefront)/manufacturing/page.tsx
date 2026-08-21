'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Send, CheckCircle2, Phone, Sparkles, Settings2, Scissors } from 'lucide-react';
import Link from 'next/link';

export default function OEMManufacturingPage() {
  const { user } = useAuth();
  const { addToQuote } = useCart();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [company, setCompany] = useState(user?.company || '');
  const [country, setCountry] = useState(user?.country || '');
  const [instrumentType, setInstrumentType] = useState('Volume Lash Tweezers');
  const [quantity, setQuantity] = useState('100');
  const [steelGrade, setSteelGrade] = useState('Japan 440C Cobalt Steel');
  const [customSpecs, setCustomSpecs] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNumber, setSuccessNumber] = useState('');

  const handleSubmitOem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const items = [
        {
          productCode: 'CUSTOM-OEM',
          productName: `Custom OEM ${instrumentType}`,
          quantity: parseInt(quantity, 10) || 100,
          requiredSize: 'Custom size details',
          material: steelGrade,
          finish: 'Satin or Mirror Custom',
          additionalRequirements: customSpecs,
        }
      ];

      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          whatsapp,
          company,
          country,
          notes: `OEM inquiry submitted for ${instrumentType}. Steel: ${steelGrade}. Custom specifications: ${customSpecs}`,
          items
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessNumber(data.rfqNumber);
      } else {
        alert(data.error || 'Failed to submit OEM request.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Custom Forging & Branding</span>
        <h1 className="text-4xl font-bold tracking-tight">OEM & Custom Manufacturing</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          In addition to our catalog items, we offer full contract manufacturing (OEM/ODM) to forge bespoke beauty and grooming instrument patterns. Submit technical drawings or mock specifications below to receive engineering feedback.
        </p>
      </div>

      {successNumber ? (
        <div className="bg-[#1c141c] border border-[#C21875]/35 p-12 rounded-3xl text-center max-w-2xl mx-auto space-y-6">
          <CheckCircle2 size={64} className="mx-auto text-green-400" />
          <h2 className="text-2xl font-bold">OEM Blueprint Registered</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Thank you. Your custom OEM manufacturing request has been logged. Our engineering and metallurgical division is assessing the parameters. Reference inquiry number:
          </p>
          <p className="text-xl font-bold font-mono text-[#D6B36A] bg-[#171017] py-3 px-6 rounded-lg border border-white/5 inline-block">
            {successNumber}
          </p>
          <p className="text-xs text-white/40">
            A staff metallurgist will contact you via email or WhatsApp to review AutoCAD files, structural diagrams, or physical samples.
          </p>
          <div className="pt-4">
            <Link href="/" className="bg-[#C21875] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider">
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: OEM Capabilities Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-[#C21875] font-mono text-xs uppercase block">Manufacturing Scope</span>
              <h2 className="text-2xl font-bold">Bespoke Forging Capabilities</h2>
              <p className="text-xs text-white/50 leading-relaxed">
                Our Sialkot-based manufacturing plant houses hot-die forging hammers, chemical passivation baths, CNC milling machines, and manual alignment benches. We manage the entire lifecycle of custom orders.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: <Scissors size={18} className="text-[#D6B36A]" />,
                  title: 'Bespoke Patterns & Custom Sizing',
                  desc: 'Adjust shaft lengths, handle curvature, or tip alignment configurations for tweezers, shears, or cuticle nippers.'
                },
                {
                  icon: <Settings2 size={18} className="text-[#C21875]" />,
                  title: 'Laser Marking & Private Labeling',
                  desc: 'Customize instrument markings. Laser etch brand names, catalog codes, lot numbers, and barcode symbols directly on the steel.'
                },
                {
                  icon: <Sparkles size={18} className="text-[#D6B36A]" />,
                  title: 'Custom Packaging & Pouches',
                  desc: 'Develop custom leather tool pouches, magnetic boxes, and printed paperboard blister boxes for professional beauty kits.'
                }
              ].map((cap, idx) => (
                <div key={idx} className="flex space-x-4">
                  <div className="p-3 bg-[#1c141c] border border-white/5 rounded-xl shrink-0 h-fit">{cap.icon}</div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{cap.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed mt-1">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct WhatsApp Call */}
            <div className="bg-[#1c141c] border border-[#C21875]/20 p-6 rounded-2xl space-y-4 text-xs">
              <h4 className="font-bold text-white">Need immediate technical consulting?</h4>
              <p className="text-white/60 leading-relaxed">
                Connect directly with our chief production metallurgist on WhatsApp to share blueprints, design specs, or material certificates.
              </p>
              <a 
                href="https://wa.me/923348012580?text=Hi,%20I%27m%20interested%20in%20custom%20beauty%20instrument%20forging%20and%20design%20consultation."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 bg-[#C21875] text-white px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-[10px]"
              >
                <Phone size={12} />
                <span>WhatsApp Consultation</span>
              </a>
            </div>
          </div>

          {/* Right Column: OEM Request Form */}
          <div className="bg-[#1c141c] border border-white/5 p-8 rounded-3xl">
            <form onSubmit={handleSubmitOem} className="space-y-4 text-xs">
              <h3 className="font-bold text-sm uppercase tracking-wider border-b border-white/5 pb-3">OEM Project Request</h3>
              
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
                  <label className="text-white/50">Email Address *</label>
                  <input
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/50">Company / Brand Name</label>
                  <input
                    type="text"
                    value={company} onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50">Destination Country *</label>
                  <input
                    type="text" required
                    value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50">WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                  placeholder="with country code"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/50">Instrument Classification *</label>
                  <select
                    value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875] text-white"
                  >
                    <option value="Volume Lash Tweezers" className="bg-[#1c141c] text-white">Volume Lash Tweezers</option>
                    <option value="Isolation Eyelash Tweezers" className="bg-[#1c141c] text-white">Isolation Eyelash Tweezers</option>
                    <option value="Professional Barber Shears" className="bg-[#1c141c] text-white">Professional Barber Shears</option>
                    <option value="Thinning Grooming Scissors" className="bg-[#1c141c] text-white">Thinning Grooming Scissors</option>
                    <option value="Cuticle Nippers & Scissors" className="bg-[#1c141c] text-white">Cuticle Nippers & Scissors</option>
                    <option value="Safety Razors & Shaving Sets" className="bg-[#1c141c] text-white">Safety Razors & Shaving Sets</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/50">Required Production Volume *</label>
                  <input
                    type="number" required
                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875] text-white"
                    placeholder="Min 100 pcs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50">Preferred Steel Formulation</label>
                <select
                  value={steelGrade} onChange={(e) => setSteelGrade(e.target.value)}
                  className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875] text-white"
                >
                  <option value="Japan 440C Cobalt Steel" className="bg-[#1c141c] text-white">Japan 440C Cobalt Steel</option>
                  <option value="Japanese Cobalt Alloy Steel" className="bg-[#1c141c] text-white">Japanese Cobalt Alloy Steel</option>
                  <option value="Surgical Stainless Steel (AISI 420)" className="bg-[#1c141c] text-white">Surgical Stainless Steel (AISI 420)</option>
                  <option value="Medical Grade Stainless Steel (AISI 410)" className="bg-[#1c141c] text-white">Medical Grade Stainless Steel (AISI 410)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50">Autocad Drawing Upload (Mocked)</label>
                <input 
                  type="file" 
                  className="w-full bg-[#171017] border border-white/10 text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#C21875] file:text-white hover:file:bg-[#A31260]"
                />
                <p className="text-[10px] text-white/30 italic">Upload AutoCAD DWG, PDF blueprints, or design sketch image files.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50">Custom Specifications & Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={customSpecs} onChange={(e) => setCustomSpecs(e.target.value)}
                  className="w-full bg-[#171017] border border-white/10 px-3 py-2.5 rounded focus:outline-none focus:border-[#C21875]"
                  placeholder="Detail exact dimensions, handle styles, special passivating boil tests, or custom branding requirements..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#C21875] hover:bg-[#A31260] disabled:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-full flex items-center justify-center space-x-1.5 shadow-lg mt-6"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Registering specifications...' : 'Submit OEM Specs'}</span>
              </button>

            </form>
          </div>

        </div>
      )}
    </div>
  );
}
