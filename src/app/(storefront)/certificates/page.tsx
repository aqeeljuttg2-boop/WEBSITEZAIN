import React from 'react';
import { Award, ShieldAlert, CheckCircle2, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quality & Regulatory Certificates | Lash Tweezers Lounge',
  description: 'Review our ISO 9001:2015, CE declarations of conformity, and cGMP quality certifications for beauty and surgical grooming tools.',
};

export default function CertificatesPage() {
  const complianceCertificates = [
    {
      title: 'ISO 9001:2015 Certification',
      subtitle: 'Quality Management Systems',
      description: 'Specifies requirements for a quality management system to demonstrate consistent manufacturing standards, raw material traceability, and continuous process optimization across all forging lines.',
      number: 'ISO-PK-8930211',
      validUntil: 'December 2028',
      issuer: 'TUV SUD Certification Body'
    },
    {
      title: 'EU Safety Directive Compliance',
      subtitle: 'General Product Safety Guidelines',
      description: 'Affirms that our beauty tweezers and shears conform to general safety guidelines, raw material non-toxicity, and standard corrosion resistance benchmarks.',
      number: 'CE-EU-9481230',
      validUntil: 'June 2029',
      issuer: 'EU Compliance Standards'
    },
    {
      title: 'Hygienic Steel Certification',
      subtitle: 'Autoclave & Sanitization Certification',
      description: 'Certifies that our Japan 440C Cobalt and AISI 410/420 steel formulations are corrosion-proof and fully compatible with high-temperature autoclave sterilizations and industrial beauty salon disinfectants.',
      number: 'MTR-REG-3008920',
      validUntil: 'Annual Renewal - Active',
      issuer: 'Sialkot Material Testing Laboratories'
    }
  ];

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-16">
      
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Regulatory dossiers</span>
        <h1 className="text-4xl font-bold tracking-tight">ISO, CE & Material Certificates</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Lash Tweezers Lounge operates under complete quality management supervision. We provide full chemical composition certificates, heat-treatment logs, and regulatory registration documents for international shipping customs clearance.
        </p>
      </div>

      {/* 2. Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {complianceCertificates.map((cert, idx) => (
          <div key={idx} className="bg-[#1c141c] border border-white/5 p-8 rounded-2xl flex flex-col justify-between hover:border-[#C21875]/35 transition-all duration-300 h-96">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#261c26] text-[#D6B36A] rounded-xl">
                  <Award size={24} />
                </div>
                <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase font-semibold">
                  Certified Active
                </span>
              </div>
              <h3 className="font-bold text-sm text-white">{cert.title}</h3>
              <p className="text-xs text-[#C21875] font-semibold">{cert.subtitle}</p>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-4">{cert.description}</p>
            </div>
            
            <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] text-white/40">
              <p>Certificate Ref: <span className="font-mono text-white/70">{cert.number}</span></p>
              <p>Valid Until: <span className="font-mono text-white/70">{cert.validUntil}</span></p>
              <p>Audit Authority: <span className="font-mono text-[#D6B36A] font-bold">{cert.issuer}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Regulatory request call */}
      <div className="bg-[#1c141c] border border-white/5 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6">
        <h3 className="text-xl font-bold text-white">Need Compliance Dossier PDF Downloads?</h3>
        <p className="text-xs text-white/60 leading-relaxed max-w-xl mx-auto">
          Distributors requiring formal ISO copies, declarations of conformity, chemical analysis batch sheets, or sterilization documentation can request files directly from our compliance office.
        </p>
        <div className="pt-2 flex justify-center space-x-4">
          <Link 
            href="/contact"
            className="bg-[#C21875] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full hover:bg-[#A31260]"
          >
            Request Compliance Dossiers
          </Link>
          <a 
            href="mailto:info@lashtweezerslounge.com?subject=Compliance%20Dossier%20Request"
            className="bg-transparent border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full"
          >
            Email Compliance Officer
          </a>
        </div>
      </div>

    </div>
  );
}
