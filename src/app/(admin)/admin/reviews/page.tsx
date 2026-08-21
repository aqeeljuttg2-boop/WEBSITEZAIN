'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, Star, Trash2, Check, X, RefreshCcw, 
  Sparkles, Loader2, Edit, Send
} from 'lucide-react';
import Image from 'next/image';

interface ReviewItem {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment?: string | null;
  imageUrl?: string | null;
  isApproved: boolean;
  isFeatured: boolean;
  adminReply?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    productCode: string;
    images?: string | null;
  } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FEATURED'>('ALL');

  // Reply Modal
  const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, isApproved: !currentApproved })
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, isFeatured: !currentFeatured })
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await fetch(`/api/admin/reviews?reviewId=${id}`, { method: 'DELETE' });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;
    setIsSavingReply(true);

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: replyingReview.id,
          adminReply: replyText.trim() || null
        })
      });

      if (res.ok) {
        setReplyingReview(null);
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReply(false);
    }
  };

  const filtered = reviews.filter(r => {
    if (filter === 'PENDING') return !r.isApproved;
    if (filter === 'APPROVED') return r.isApproved;
    if (filter === 'FEATURED') return r.isFeatured;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Reviews Manager</h1>
          <p className="text-xs text-white/50 mt-1">
            Moderate customer testimonials, approve verified reviews for public display, feature best feedback, and reply.
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchReviews(); }}
          className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
        >
          <RefreshCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center space-x-2 bg-[#191019] p-3 rounded-2xl border border-white/5">
        <span className="text-xs font-mono text-white/40 uppercase font-bold mr-2">Filter:</span>
        {[
          { id: 'ALL', label: 'All Reviews' },
          { id: 'PENDING', label: 'Pending Approval' },
          { id: 'APPROVED', label: 'Approved Live' },
          { id: 'FEATURED', label: 'Featured Top' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase font-mono transition-colors ${
              filter === f.id
                ? 'bg-[#C21875] text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3. Reviews List */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No reviews found matching this filter.
            </div>
          ) : (
            filtered.map((rev) => (
              <div 
                key={rev.id}
                className="bg-[#191019] border border-white/5 rounded-2xl p-5 space-y-3 hover:border-white/10 transition-all shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-0.5 text-[#D6B36A]">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < rev.rating ? 'fill-[#D6B36A]' : 'text-white/20'} 
                        />
                      ))}
                    </div>
                    <span className="font-bold text-white text-xs">{rev.name}</span>
                    <span className="text-[10px] text-white/40 font-mono">({rev.email})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                      rev.isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {rev.isApproved ? 'APPROVED (PUBLIC)' : 'PENDING APPROVAL'}
                    </span>
                    {rev.isFeatured && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[#C21875]/20 text-[#C21875]">
                        FEATURED
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {rev.product && (
                  <p className="text-[11px] text-[#D6B36A] font-mono">
                    Product: <strong className="text-white font-sans">{rev.product.name}</strong> ({rev.product.productCode})
                  </p>
                )}

                <p className="text-xs text-white/80 leading-relaxed bg-[#140d14] p-3 rounded-xl border border-white/5">
                  "{rev.comment || 'No text review comment provided.'}"
                </p>

                {rev.adminReply && (
                  <div className="pl-4 border-l-2 border-[#C21875] text-xs text-white/70 py-1">
                    <strong className="text-[#C21875] block text-[10px] uppercase font-mono">Official Admin Reply:</strong>
                    {rev.adminReply}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2 text-xs">
                  <button
                    onClick={() => handleToggleApprove(rev.id, rev.isApproved)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      rev.isApproved ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {rev.isApproved ? 'Unapprove' : 'Approve Live'}
                  </button>

                  <button
                    onClick={() => handleToggleFeature(rev.id, rev.isFeatured)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      rev.isFeatured ? 'bg-white/10 text-white/60' : 'bg-[#C21875]/20 text-[#C21875] hover:bg-[#C21875]/30'
                    }`}
                  >
                    {rev.isFeatured ? 'Unfeature' : 'Feature on Home'}
                  </button>

                  <button
                    onClick={() => { setReplyingReview(rev); setReplyText(rev.adminReply || ''); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold"
                  >
                    Reply
                  </button>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    title="Delete review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. REPLY MODAL */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">Reply to Review from {replyingReview.name}</h3>
              <button onClick={() => setReplyingReview(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveReply} className="p-6 space-y-4">
              <div className="bg-[#140d14] p-3 rounded-xl border border-white/5 text-xs text-white/60">
                "{replyingReview.comment}"
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Official Response (Visible to customers)</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for your feedback! We are delighted that you enjoy our handcrafted precision..."
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setReplyingReview(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingReply} className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]">
                  {isSavingReply ? 'Saving...' : 'Post Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
