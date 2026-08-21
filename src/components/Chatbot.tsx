'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Phone, FileText, ShoppingBag, 
  Truck, ChevronRight, RotateCcw, Volume2, VolumeX, 
  Sparkles, CheckCircle2, Search, ArrowRight, ExternalLink,
  ShieldCheck, Award, Heart, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ActionLink {
  label: string;
  url: string;
  isExternal?: boolean;
  icon?: 'shop' | 'quote' | 'whatsapp' | 'track' | 'catalog';
  highlight?: boolean;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  categoryTag?: string;
  links?: ActionLink[];
  productCard?: {
    title: string;
    category: string;
    image: string;
    price: string;
    url: string;
    moq: string;
  };
  timestamp: string;
}

const FAQ_DATABASE = [
  {
    keywords: ['tweezer', 'tweezers', 'lash', 'isolation', 'volume', 'fiber', 'diamond', 'sweet spot', 'boot', '90', '45', 'chameleon', 'plasma'],
    tag: 'Lash Extension Tools',
    answer: 'We craft professional eyelash extension tweezers using Japanese Cobalt stainless steel. Every tweezer is hand-aligned under 10x magnification to guarantee a 100% airtight sweet spot for 0.02mm–0.07mm volume fan creation.\n\nAvailable types:\n• 90° Boot Mega Volume & Fiber Tip\n• 45° Curved & Semi-Curved Classics\n• Slim Straight Isolation Clamps\n• Chameleon Plasma & Matte Satin finishes',
    productCard: {
      title: 'Fiber Tip Mega Volume Tweezer 90°',
      category: 'Tweezers & Lash Care',
      image: '/catagori/WhatsApp Image 2026-08-18 at 12.28.05 AM (1).jpeg',
      price: 'Rs. 450 (Wholesale from $3.20)',
      moq: '5 pcs MOQ',
      url: '/shop?category=eyelash-tweezers'
    },
    links: [
      { label: 'Explore Lash Tweezers', url: '/shop?category=eyelash-tweezers', icon: 'shop' as const, highlight: true },
      { label: 'Request B2B Wholesale Pricing', url: '/quote', icon: 'quote' as const }
    ]
  },
  {
    keywords: ['shear', 'shears', 'scissor', 'scissors', 'barber', 'hair', 'cutting', 'thinning', '440c', 'cobalt', 'razor'],
    tag: 'Barber & Styling Shears',
    answer: 'Our professional hair scissors are forged from genuine Japanese 440C Cobalt Alloy Steel (59–61 HRC hardness). They feature hand-honed convex razor edges for buttery-smooth slicing and ball-bearing tension dial assemblies.\n\nAvailable sizes: 5.5", 6.0", 6.5", 7.0" with matching texturizing thinning shears.',
    productCard: {
      title: 'Convex Razor Edge Barber Shears (Japan 440C)',
      category: 'Hair Styling Shears',
      image: '/catagori/WhatsApp Image 2026-08-18 at 12.28.11 AM.jpeg',
      price: 'Rs. 1,450 (Wholesale from $14.50)',
      moq: '2 pcs MOQ',
      url: '/shop?category=barber-shears'
    },
    links: [
      { label: 'View Barber Shears', url: '/shop?category=barber-shears', icon: 'shop' as const, highlight: true },
      { label: 'Download Shears PDF', url: '/catalog', icon: 'catalog' as const }
    ]
  },
  {
    keywords: ['moq', 'wholesale', 'bulk', 'b2b', 'quantity', 'discount', 'tier', 'pricing', 'price', 'rate', 'cost'],
    tag: 'Wholesale & B2B Pricing',
    answer: 'We provide tiered volume factory pricing for beauty academies, lash salons, and distributors:\n\n• Catalog Items MOQ: 5–10 pieces per code\n• Tier 1 (1–9 pcs): Standard Retail PKR\n• Tier 2 (10–49 pcs): 20% Volume Discount\n• Tier 3 (50+ pcs): Full Wholesale Factory Export Rate\n• Custom OEM Forging MOQ: 100 pcs per pattern',
    links: [
      { label: 'Submit Wholesale RFQ Quote', url: '/quote', icon: 'quote' as const, highlight: true },
      { label: 'Wholesale Supply Guide', url: '/wholesale', icon: 'shop' as const }
    ]
  },
  {
    keywords: ['oem', 'custom', 'logo', 'brand', 'private label', 'engrave', 'laser', 'drawing', 'autocad', 'blueprint'],
    tag: 'OEM & Custom Branding',
    answer: 'We offer full OEM & Private Label branding:\n• High-precision fiber laser engraving of your logo and item codes.\n• Custom autoclave storage boxes, magnetic velvet cases, or leather holsters.\n• Direct forging from customer AutoCAD technical blueprints.',
    links: [
      { label: 'OEM Custom Manufacturing', url: '/manufacturing', icon: 'shop' as const, highlight: true },
      { label: 'Discuss OEM on WhatsApp', url: 'https://wa.me/923348012580?text=Hi,%20I%20want%20to%20discuss%20custom%20OEM%20branding.', isExternal: true, icon: 'whatsapp' as const }
    ]
  },
  {
    keywords: ['track', 'tracking', 'order', 'status', 'where is my order', 'dispatch', 'shipment', 'ord-'],
    tag: 'Order Logistics Tracking',
    answer: 'You can track any active order in real-time by entering your order reference number (e.g. ORD-2026-10001) in our live tracking system.',
    links: [
      { label: 'Open Shipment Tracker', url: '/tracking', icon: 'track' as const, highlight: true },
      { label: 'My Order History', url: '/account/orders', icon: 'shop' as const }
    ]
  },
  {
    keywords: ['ship', 'shipping', 'delivery', 'courier', 'dhl', 'freight', 'cargo', 'time', 'how long', 'days'],
    tag: 'Shipping & Delivery',
    answer: 'Logistics Overview:\n• Pakistan Express Courier: 2–4 business days (Flat Rs. 150, Free over Rs. 2,500).\n• International DHL Express: 3–6 business days worldwide.\n• B2B Bulk Export: Air Cargo or Ocean Freight (FOB / CIF Sialkot terms with full customs dossiers).',
    links: [
      { label: 'Review Shipping Policy', url: '/shipping', icon: 'shop' as const }
    ]
  },
  {
    keywords: ['contact', 'whatsapp', 'phone', 'call', 'number', 'address', 'location', 'email', 'factory', 'where are you', 'sialkot'],
    tag: 'Direct Factory Contact',
    answer: 'Lash Tweezers Lounge Headquarters:\n• Address: King99 Street Block No.99 Wajid Town, Dhattal Stop, Sialkot, Pakistan\n• Phone / WhatsApp: +92-334-8012580\n• Official Email: info@lashtweezerslounge.com\n• Instagram: @lash_tweezers_lounge',
    links: [
      { label: 'WhatsApp Instant Chat', url: 'https://wa.me/923348012580', isExternal: true, icon: 'whatsapp' as const, highlight: true },
      { label: 'Official Contact Form', url: '/contact', icon: 'shop' as const },
      { label: 'Follow on Instagram', url: 'https://www.instagram.com/lash_tweezers_lounge?igsi=dGl5cWUweXp0MDdj&utm_source=qr', isExternal: true }
    ]
  },
  {
    keywords: ['nail', 'cuticle', 'nipper', 'pusher', 'manicure', 'pedicure', 'shaving', 'razor', 'holster', 'kit'],
    tag: 'Nail & Shaving Instruments',
    answer: 'We manufacture surgical cuticle nippers with double-spring joints, sapphire nail files, double-edge safety razors, and handcrafted leather barber holsters and manicure kits.',
    links: [
      { label: 'Nail & Cuticle Care', url: '/shop?category=nail-cuticle-care', icon: 'shop' as const, highlight: true },
      { label: 'Kits & Holsters', url: '/shop?category=beauty-kits-bags', icon: 'shop' as const }
    ]
  }
];

const SUGGESTIONS = [
  { text: 'Lash Tweezers Sweet Spots', icon: '👁️' },
  { text: 'Barber Shears 440C', icon: '✂️' },
  { text: 'Wholesale MOQ & Pricing', icon: '💼' },
  { text: 'Track My Shipment', icon: '📦' },
  { text: 'Direct WhatsApp Chat', icon: '💬' }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState('');
  const [whatsappNum, setWhatsappNum] = useState('+92 334 8012580');

  const loadChatSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.whatsappNumber) {
          setWhatsappNum(data.settings.whatsappNumber);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadChatSettings();
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'How can we assist you today with precision lash tweezers, Japanese 440C barber shears, wholesale B2B pricing, or order tracking?',
      categoryTag: 'LTL Client Desk',
      links: [
        { label: 'Explore Lash Tweezers', url: '/shop?category=eyelash-tweezers', icon: 'shop', highlight: true },
        { label: 'Wholesale B2B RFQ', url: '/quote', icon: 'quote' },
        { label: 'Track Order', url: '/tracking', icon: 'track' }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Listen for open event from mobile bottom nav
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ltl-chat', handleOpen);
    return () => window.removeEventListener('open-ltl-chat', handleOpen);
  }, []);

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Chat cleared. How can we assist you with our handcrafted instruments or wholesale supply?',
        categoryTag: 'LTL Client Desk',
        links: [
          { label: 'Browse Products', url: '/shop', icon: 'shop', highlight: true },
          { label: 'Request Wholesale Quote', url: '/quote', icon: 'quote' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      const matched = FAQ_DATABASE.find(item => 
        item.keywords.some(k => lower.includes(k))
      );

      let botAnswer: string;
      let botTag = 'Lash Tweezers Lounge';
      let botLinks: ActionLink[] = [];
      let productCard = matched?.productCard;

      if (matched) {
        botAnswer = matched.answer;
        botTag = matched.tag;
        botLinks = matched.links || [];
      } else {
        botAnswer = `Thank you for your inquiry regarding "${query}". Our engineering and sales coordinators are ready to help with exact specifications, custom sample kits, and wholesale orders.`;
        botLinks = [
          { label: 'Chat Directly on WhatsApp', url: 'https://wa.me/923348012580', isExternal: true, icon: 'whatsapp', highlight: true },
          { label: 'Submit Wholesale Quote', url: '/quote', icon: 'quote' },
          { label: 'Explore Products Catalog', url: '/shop', icon: 'shop' }
        ];
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botAnswer,
        categoryTag: botTag,
        links: botLinks,
        productCard,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <>
      {/* 1. Floating Luxury Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex items-center group">
          {/* Tooltip on hover */}
          <div className="hidden lg:flex items-center space-x-2 mr-3 px-3.5 py-1.5 bg-[#1c141c] text-white text-xs font-semibold rounded-full border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chat with Lash Specialist</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-tr from-[#A31260] via-[#C21875] to-[#E91E63] text-white p-3.5 md:p-4 rounded-full shadow-[0_8px_30px_rgba(194,24,117,0.45)] hover:shadow-[0_12px_40px_rgba(194,24,117,0.65)] hover:scale-110 transition-all duration-300 border border-white/30 cursor-pointer"
            aria-label="Open Lash Tweezers Lounge Concierge Desk"
          >
            <MessageSquare size={22} className="group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D6B36A] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#D6B36A] border-2 border-[#171017]" />
            </span>
          </button>
        </div>
      )}

      {/* 2. Glassmorphic Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-2 sm:right-6 z-50 w-[95vw] sm:w-[410px] md:w-[440px] max-h-[82vh] md:max-h-[620px] bg-[#171017]/95 backdrop-blur-xl border border-white/15 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-[#2a0b1e] via-[#1f0d1a] to-[#171017] px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C21875] to-[#D6B36A] p-[1.5px] shadow-lg">
                  <div className="w-full h-full bg-[#171017] rounded-2xl flex items-center justify-center font-bold text-xs text-[#D6B36A] font-mono">
                    LTL
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#171017]" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center space-x-1.5 leading-none">
                  <span>Lash Tweezers Lounge</span>
                  <CheckCircle2 size={13} className="text-[#D6B36A]" />
                </h3>
                <p className="text-[10px] text-white/50 font-mono mt-1">
                  Active • Avg reply &lt; 1 min
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleResetChat}
                className="text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                title="Restart conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Quick interactive suggestions carousel */}
          <div className="bg-[#1c141c]/90 border-b border-white/5 px-3 py-2 overflow-x-auto flex space-x-1.5 scrollbar-none">
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.text)}
                className="bg-white/5 hover:bg-[#C21875]/25 hover:border-[#C21875]/60 border border-white/10 text-white/80 hover:text-white px-3 py-1 rounded-full whitespace-nowrap transition-all text-[10px] font-semibold flex items-center space-x-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px] bg-[#120a12]/80 text-xs scrollbar-none">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Category tag for bot responses */}
                {msg.sender === 'bot' && msg.categoryTag && (
                  <span className="text-[9px] uppercase font-mono tracking-widest text-[#D6B36A] px-1 font-bold">
                    {msg.categoryTag}
                  </span>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] p-4 rounded-2xl leading-relaxed whitespace-pre-line text-xs shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#A31260] to-[#C21875] text-white rounded-br-sm font-medium'
                      : 'bg-[#1c141c] text-white/90 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Optional Featured Product Card */}
                  {msg.productCard && (
                    <div className="mt-3 bg-[#171017] border border-white/10 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden relative shrink-0">
                        <Image 
                          src={msg.productCard.image} 
                          alt={msg.productCard.title} 
                          fill 
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-[#D6B36A] font-mono block truncate">{msg.productCard.category}</span>
                        <p className="font-bold text-white text-[11px] truncate">{msg.productCard.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">{msg.productCard.price}</span>
                          <span className="text-[9px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded font-mono">{msg.productCard.moq}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Link Buttons */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.links.map((link, idx) => (
                        link.isExternal ? (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                              link.highlight
                                ? 'bg-[#25D366] text-black hover:bg-[#1EBE5D] shadow'
                                : 'bg-[#261c26] text-[#D6B36A] hover:bg-[#D6B36A] hover:text-black border border-[#D6B36A]/30'
                            }`}
                          >
                            <span>{link.label}</span>
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <Link
                            key={idx}
                            href={link.url}
                            onClick={() => setIsOpen(false)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                              link.highlight
                                ? 'bg-[#C21875] text-white hover:bg-[#A31260] shadow'
                                : 'bg-[#261c26] text-white/90 hover:bg-[#C21875] hover:text-white border border-white/10'
                            }`}
                          >
                            <span>{link.label}</span>
                            <ChevronRight size={11} />
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-white/30 px-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-1.5 p-3.5 bg-[#1c141c] border border-white/10 rounded-2xl rounded-bl-sm w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C21875] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6B36A] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Direct WhatsApp Quick Contact Strip */}
          <div className="bg-[#191018] px-4 py-2 border-t border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-white/50 flex items-center space-x-1">
              <Phone size={11} className="text-[#D6B36A]" />
              <span>+92-334-8012580</span>
            </span>
            <a
              href="https://wa.me/923348012580?text=Hello%20Lash%20Tweezers%20Lounge,%20I'm%20inquiring%20about%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline font-bold font-mono flex items-center space-x-1"
            >
              <span>1-Tap WhatsApp</span>
              <ArrowRight size={10} />
            </a>
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3.5 bg-[#1c141c] border-t border-white/10 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about tweezers, barber shears, wholesale..."
              className="flex-1 bg-[#171017] border border-white/10 text-xs px-4 py-2.5 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-[#C21875] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-gradient-to-r from-[#A31260] to-[#C21875] hover:from-[#C21875] hover:to-[#E91E63] disabled:opacity-30 text-white p-2.5 rounded-full transition-all duration-300 shadow-md cursor-pointer shrink-0"
              aria-label="Send Message"
            >
              <Send size={15} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
