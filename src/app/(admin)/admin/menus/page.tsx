'use client';

import React, { useEffect, useState } from 'react';
import { 
  Menu as MenuIcon, Plus, Trash2, Edit, MoveUp, 
  MoveDown, ExternalLink, X, Loader2, Link2, Check
} from 'lucide-react';

interface MenuItem {
  id: string;
  title: string;
  url: string;
  menuType: string;
  parentId?: string | null;
  orderIndex: number;
  target: string;
  badge?: string | null;
  isEnabled: boolean;
  children?: MenuItem[];
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('MAIN');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [menuType, setMenuType] = useState('MAIN');
  const [target, setTarget] = useState('_self');
  const [badge, setBadge] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [orderIndex, setOrderIndex] = useState('0');

  const loadMenus = async () => {
    try {
      const res = await fetch(`/api/admin/menus?type=${selectedType}&all=true`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMenus(data.menus || []);
      }
    } catch (e) {
      console.error('Load menus error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, [selectedType]);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setUrl('');
    setMenuType(selectedType);
    setTarget('_self');
    setBadge('');
    setIsEnabled(true);
    setOrderIndex(menus.length.toString());
    setIsModalOpen(true);
  };

  const openEditModal = (m: MenuItem) => {
    setEditingItem(m);
    setTitle(m.title);
    setUrl(m.url);
    setMenuType(m.menuType);
    setTarget(m.target || '_self');
    setBadge(m.badge || '');
    setIsEnabled(m.isEnabled);
    setOrderIndex(m.orderIndex !== undefined ? m.orderIndex.toString() : '0');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const payload = {
      title: title.trim(),
      url: url.trim(),
      menuType,
      target,
      badge: badge.trim() || null,
      isEnabled,
      orderIndex: parseInt(orderIndex, 10) || 0
    };

    try {
      let res;
      if (editingItem) {
        res = await fetch(`/api/admin/menus/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        loadMenus();
      }
    } catch (e) {
      console.error('Save menu item error:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await fetch(`/api/admin/menus/${id}`, { method: 'DELETE' });
      loadMenus();
    } catch (e) {
      console.error('Delete menu item error:', e);
    }
  };

  const moveMenuItem = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === menus.length - 1)
    ) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...menus];
    const item = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = item;

    setMenus(copy);

    try {
      await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', items: copy })
      });
    } catch (e) {
      console.error('Reorder error:', e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Menu & Navigation Manager</h1>
          <p className="text-xs text-white/50 mt-1">
            Manage links for Header Main Navigation, Categories dropdown, and Footer link columns.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#C21875] hover:bg-[#A31260] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-[#C21875]/25 transition-all"
        >
          <Plus size={16} />
          <span>Add Menu Link</span>
        </button>
      </div>

      {/* 2. Menu Location Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-[#191019] p-3 rounded-2xl border border-white/5">
        <span className="text-xs font-mono text-white/40 uppercase font-bold mr-2">Location:</span>
        {[
          { id: 'MAIN', label: 'Main Header Nav' },
          { id: 'FOOTER_COMPANY', label: 'Footer: Company' },
          { id: 'FOOTER_INFO', label: 'Footer: Info & Links' },
          { id: 'HEADER_TOP', label: 'Top Bar Links' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedType(m.id)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl uppercase font-mono transition-colors ${
              selectedType === m.id
                ? 'bg-[#C21875] text-white shadow-sm'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 3. Menu Items List */}
      {loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-[#C21875]" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {menus.length === 0 ? (
            <div className="bg-[#191019] border border-white/5 p-12 text-center rounded-2xl text-white/40 italic">
              No menu items in this location. Click "Add Menu Link" to create one.
            </div>
          ) : (
            menus.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#191019] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <span className="w-8 h-8 rounded-xl bg-[#120a12] border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#D6B36A]">
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white">{item.title}</h4>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C21875]/20 text-[#C21875] font-bold font-mono">
                          {item.badge}
                        </span>
                      )}
                      {!item.isEnabled && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-bold font-mono">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40 font-mono mt-0.5 block">{item.url}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 mr-2">
                    <button
                      onClick={() => moveMenuItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white"
                      title="Move up"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      onClick={() => moveMenuItem(idx, 'down')}
                      disabled={idx === menus.length - 1}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-white"
                      title="Move down"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#191019] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#140d14]">
              <h3 className="text-sm font-bold text-white">{editingItem ? 'Edit Link' : 'Add Menu Link'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Link Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lash Tweezers"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70 block mb-1">Target URL *</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. /shop?category=eyelash-tweezers"
                  className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-[#C21875] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Location</label>
                  <select
                    value={menuType}
                    onChange={(e) => setMenuType(e.target.value)}
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C21875] focus:outline-none"
                  >
                    <option value="MAIN">Main Header Nav</option>
                    <option value="FOOTER_COMPANY">Footer: Company</option>
                    <option value="FOOTER_INFO">Footer: Info</option>
                    <option value="HEADER_TOP">Top Bar</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/70 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. HOT, SALE"
                    className="w-full bg-[#120a12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="menuEnabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded text-[#C21875]"
                />
                <label htmlFor="menuEnabled" className="text-xs text-white cursor-pointer">
                  Enabled (Visible in navigation)
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 bg-white/5">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#C21875] hover:bg-[#A31260]">
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
