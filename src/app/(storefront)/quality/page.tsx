import React from 'react';
import { BadgeCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '6-Stage Quality Assurance & Metallurgy | Lash Tweezers Lounge',
  description: 'Learn about our 6-stage quality control routine, Rockwell hardness testing (HRC), and passivation inspection standards.',
};

export default function QualityControlPage() {
  const qcStages = [
    {
      stage: '01',
      title: 'Material Spectrometric Inspection',
      desc: 'Before forging, steel bars are analyzed using optical emission spectrometers to verify chemical composition, ensuring correct carbon (0.2% - 0.4%) and chromium (13% - 15%) parameters.'
    },
    {
      stage: '02',
      title: 'Dimensional & Jig Verification',
      desc: 'Forged patterns are checked against digital schematic blueprints. Dial calipers, micrometer gauges, and custom jigs verify shaft widths, lengths, and tip geometries.'
    },
    {
      stage: '03',
      title: 'Rockwell Hardness (HRC) Checks',
      desc: 'Heat-treatment processes are verified using Rockwell hardness testing machines. Cutting instruments (shears, cuticle nippers) are hardened to 58-62 HRC (for Japan 440C steel); precision tweezers to 42-46 HRC.'
    },
    {
      stage: '04',
      title: 'Boil & Copper-Sulfate Corrosion Checks',
      desc: 'Finished instruments undergo a 30-minute boiling water test and copper-sulfate drop tests. Any signs of rust or oxidation fail the batch, ensuring complete passive layer integrity.'
    },
    {
      stage: '05',
      title: 'Tip Alignment & Pivot Function Testing',
      desc: 'Every double-jointed instrument (barber shears, cuticle nippers) and tweezer is manually checked under magnification for smooth pivot action, tension balance, and perfect tip alignment.'
    },
    {
      stage: '06',
      title: 'Final Protective Packaging Audit',
      desc: 'Instruments are ultrasonic-cleaned, dried, and visually audited under magnification for surface scratches, then sealed in dust-proof blister cards or corporate pouches.'
    }
  ];

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Compliance & Assurance</span>
        <h1 className="text-4xl font-bold tracking-tight">Rigorous Quality Control Audits</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Lash Tweezers Lounge operates under strict quality control guidelines. We trace batch metallurgy from the raw metal forge to the professional salon, ensuring absolute reliability.
        </p>
      </div>

      {/* 2. Schematic visual */}
      <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Zero Tolerance Policy</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            Precision beauty instruments operate in high-frequency salon environments. Any minor misalignment, micro-gaps at the tip, or pivot stiffness can compromise lash placement or shear performance.
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            Because of this, Lash Tweezers Lounge enforces a zero-tolerance policy. If a single product from a batch fails the copper-sulfate test or Rockwell hardness brackets, the entire batch is rejected and recycled back to raw material melting.
          </p>
          <div className="pt-2">
            <Link href="/certificates" className="bg-[#C21875] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider">
              Review Compliance Certificates
            </Link>
          </div>
        </div>

        {/* Quality inspection schematic */}
        <div className="bg-[#171017] rounded-2xl p-8 border border-white/5 flex justify-center shadow-inner">
          <svg viewBox="0 0 100 100" className="w-64 h-64 stroke-[#D6B36A] stroke-[0.8] fill-none">
            <circle cx="50" cy="50" r="40" />
            <path d="M50 10 L50 90 M10 50 L90 50" strokeWidth="0.2" stroke="white" />
            {/* Calliper measurement schema */}
            <path d="M30 45 V35 H70 V45" strokeWidth="1.5" stroke="#C21875" />
            <line x1="30" y1="30" x2="70" y2="30" strokeWidth="1" strokeDasharray="2,2" />
            <text x="35" y="25" className="fill-[#D6B36A] text-[4px] font-mono font-bold">DIGITAL CALIPERS CALIBRATION</text>
          </svg>
        </div>
      </div>

      {/* 3. QC Process Steps */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold tracking-tight border-b border-white/5 pb-4 text-[#D6B36A]">6-stage Quality Inspection Routine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {qcStages.map((stage, idx) => (
            <div key={idx} className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl space-y-4 hover:border-[#C21875]/30 hover:scale-102 transition-all duration-300">
              <div className="flex justify-between items-center">
                <span className="font-mono text-2xl font-bold text-[#C21875]">{stage.stage}</span>
                <BadgeCheck size={18} className="text-[#D6B36A]" />
              </div>
              <h4 className="font-bold text-white text-sm">{stage.title}</h4>
              <p className="text-xs text-white/50 leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
