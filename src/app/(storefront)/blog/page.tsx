import React from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metallurgy & Craftsmanship Journal | Lash Tweezers Lounge',
  description: 'Expert guides on fiber-tip volume lash tweezers sweet spots, Japanese 440C barber shears maintenance, and salon autoclave sterilization.',
};

export default function BlogPage() {
  const posts = [
    {
      title: 'The Science of Hand-Aligned Lash Tweezer Sweet Spots: Why Fiber Tips Matter',
      excerpt: 'Learn how calibrated tip pressure, hand-ground alignment, and fiber micro-grip coating ensure zero slipping when creating 0.03mm mega volume lash fans.',
      date: 'August 14, 2026',
      author: 'Master Craftsman Asif (Head of Tweezer QC)',
      readTime: '5 min read',
      tag: 'Lash Science'
    },
    {
      title: 'Japanese 440C vs German Stainless: Selecting Precision Barber Shears',
      excerpt: 'An in-depth metallurgical comparison of convex razor edges, hardness ratings (59-61 HRC), and ball-bearing screw tensioners in salon styling shears.',
      date: 'July 28, 2026',
      author: 'Hamza Malik (Master Bladesmith)',
      readTime: '7 min read',
      tag: 'Barber Shears'
    },
    {
      title: 'Autoclave & Barbicide Sterilization Best Practices for Beauty Salons',
      excerpt: 'Essential hygiene, ultrasonic cleaning protocols, and dry heat sterilization methods to maintain titanium and plasma finishes on professional tweezers.',
      date: 'June 15, 2026',
      author: 'Fatima Noor (Salon QA Specialist)',
      readTime: '6 min read',
      tag: 'Sanitation'
    }
  ];

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 text-white space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-[#C21875] text-xs font-bold uppercase tracking-widest block font-mono">Lash Tweezers Lounge Insights</span>
        <h1 className="text-4xl font-bold tracking-tight">Craftsmanship & Metallurgy Journal</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          Explore our expert guides on lash extension tweezers, scissor blade maintenance, and professional salon sterilization.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, idx) => (
          <div key={idx} className="bg-[#1c141c] border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-[#C21875]/35 transition-all duration-300">
            
            {/* Header image/placeholder */}
            <div className="bg-[#261c26] h-48 border-b border-white/5 flex items-center justify-center p-6 text-[#C21875]/25">
              <BookOpen size={64} className="stroke-[0.8]" />
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider bg-[#C21875]/15 text-[#C21875] px-2 py-0.5 rounded-full font-bold">
                  {post.tag}
                </span>
                <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug">{post.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{post.excerpt}</p>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
                  <span className="flex items-center space-x-1">
                    <Calendar size={11} />
                    <span>{post.date}</span>
                  </span>
                  <span>{post.readTime}</span>
                </div>
                <p className="text-[10px] text-white/40 italic">By {post.author}</p>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
