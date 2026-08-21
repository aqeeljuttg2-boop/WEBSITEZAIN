'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Sparkles, Upload, Search, Trash2, Copy, Check, 
  Eye, X, Loader2, Image as ImageIcon, FileText, CheckCircle
} from 'lucide-react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string | null;
  altText?: string | null;
  createdAt: string;
}

export default function AdminMediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Preview / Detail Modal
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    try {
      const res = await fetch('/api/admin/media?limit=500', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media || []);
      }
    } catch (e) {
      console.error('Load media error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const urls: string[] = data.urls || [data.url];
        
        // Save to Media DB
        for (const u of urls) {
          const name = u.split('/').pop() || 'uploaded_asset';
          await fetch('/api/admin/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: name,
              fileUrl: u,
              fileType: 'image',
              altText: name
            })
          });
        }

        loadMedia();
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    try {
      await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      if (selectedMedia?.id === id) setSelectedMedia(null);
      loadMedia();
    } catch (e) {
      console.error('Delete media error:', e);
    }
  };

  const handleSaveAltText = async () => {
    if (!selectedMedia) return;
    setSavingAlt(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: editAltText })
      });
      if (res.ok) {
        setSelectedMedia({ ...selectedMedia, altText: editAltText });
        loadMedia();
      }
    } catch (e) {
      console.error('Save alt text error:', e);
    } finally {
      setSavingAlt(false);
    }
  };

  const filtered = media.filter(m => 
    !search || 
    m.fileName.toLowerCase().includes(search.toLowerCase()) || 
    (m.altText && m.altText.toLowerCase().includes(search.toLowerCase())) ||
    m.fileUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-xs text-white/50 mt-1">
            Central repository for product images, category banners, logos, and marketing visuals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 cursor-pointer transition-all">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleUploadFiles} 
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* 2. Search & Stats */}
      <div className="bg-[#191019] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media by filename or alt text..."
            className="w-full bg-[#120a12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#C21875]"
          />
        </div>

        <span className="text-xs text-white/50 font-mono">
          {filtered.length} Media Assets Indexed
        </span>
      </div>

      {/* 3. Media Grid */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No media files found. Upload images to populate your library.
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id}
                onClick={() => { setSelectedMedia(item); setEditAltText(item.altText || ''); }}
                className="group bg-[#191019] border border-white/5 rounded-2xl overflow-hidden hover:border-[#C21875]/60 transition-all cursor-pointer flex flex-col shadow-md relative"
              >
                <div className="aspect-square bg-[#120a12] relative overflow-hidden flex items-center justify-center">
                  <Image 
                    src={item.fileUrl} 
                    alt={item.altText || item.fileName} 
                    fill 
                    sizes="200px" 
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleCopy(item.fileUrl); }}
                      title="Copy URL"
                      className="p-2 rounded-lg bg-white/20 hover:bg-[#C21875] text-white transition-colors"
                    >
                      {copiedUrl === item.fileUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      title="Delete asset"
                      className="p-2 rounded-lg bg-white/20 hover:bg-red-600 text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-[#140d14]">
                  <p className="text-[11px] font-bold text-white truncate">{item.fileName}</p>
                  <p className="text-[9px] text-white/40 font-mono mt-0.5">
                    {item.fileSize > 0 ? `${(item.fileSize / 1024).toFixed(0)} KB` : 'Local Asset'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. DETAIL / PREVIEW MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">Media Asset Details</h3>
              <button onClick={() => setSelectedMedia(null)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Preview Box */}
              <div className="aspect-square rounded-2xl bg-[#120a12] border border-white/10 overflow-hidden relative flex items-center justify-center">
                <Image src={selectedMedia.fileUrl} alt={selectedMedia.altText || ''} fill sizes="300px" className="object-contain p-2" />
              </div>

              {/* Asset Info & Controls */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40 font-bold block">File Name</label>
                    <p className="text-xs font-bold text-white break-all">{selectedMedia.fileName}</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40 font-bold block">File URL</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={selectedMedia.fileUrl}
                        className="flex-1 bg-[#120a12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleCopy(selectedMedia.fileUrl)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-[#C21875] text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        {copiedUrl === selectedMedia.fileUrl ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-white/40 font-bold block">Alt Text (SEO)</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={editAltText}
                        onChange={(e) => setEditAltText(e.target.value)}
                        placeholder="Descriptive alt text for Google"
                        className="flex-1 bg-[#120a12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={handleSaveAltText}
                        disabled={savingAlt}
                        className="px-3 py-1 bg-[#C21875] text-white rounded-lg text-xs font-bold"
                      >
                        {savingAlt ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center space-x-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete File</span>
                  </button>

                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white/60 bg-white/5 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
