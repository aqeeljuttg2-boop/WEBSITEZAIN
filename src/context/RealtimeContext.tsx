'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeEventType, RealtimeEventPayload } from '@/lib/realtime';
import { Bell, CheckCircle2, Info, ShoppingCart, Sparkles, X } from 'lucide-react';

interface RealtimeToast {
  id: string;
  title: string;
  message?: string;
  type: RealtimeEventType;
  timestamp: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEventPayload | null;
  eventsHistory: RealtimeEventPayload[];
  publishEvent: (type: RealtimeEventType, title: string, message?: string, data?: any) => void;
  subscribe: (eventTypes: RealtimeEventType[] | 'ALL', callback: (event: RealtimeEventPayload) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [eventsHistory, setEventsHistory] = useState<RealtimeEventPayload[]>([]);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);

  const listenersRef = useRef<Map<string, { types: RealtimeEventType[] | 'ALL'; callback: (event: RealtimeEventPayload) => void }>>(new Map());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());

  // Dispatch event to internal subscribers and update state
  const handleIncomingEvent = useCallback((event: RealtimeEventPayload, fromBroadcast: boolean = false) => {
    if (!event || !event.type) return;

    setLastEvent(event);
    setEventsHistory(prev => [event, ...prev.slice(0, 49)]);
    lastTimestampRef.current = Math.max(lastTimestampRef.current, event.timestamp || Date.now());

    // Show toast for key events
    const toastworthyEvents: RealtimeEventType[] = [
      'ORDER_CREATED',
      'RFQ_CREATED',
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'SETTINGS_UPDATED',
      'HOMEPAGE_UPDATED',
      'REVIEW_CREATED'
    ];

    if (toastworthyEvents.includes(event.type)) {
      const toastId = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts(prev => [
        {
          id: toastId,
          title: event.title || 'Realtime Update',
          message: event.message || '',
          type: event.type,
          timestamp: event.timestamp
        },
        ...prev.slice(0, 4) // max 5 toasts at a time
      ]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);
    }

    // Notify registered listeners
    listenersRef.current.forEach(({ types, callback }) => {
      if (types === 'ALL' || types.includes(event.type)) {
        try {
          callback(event);
        } catch (err) {
          console.error('Error in realtime listener callback:', err);
        }
      }
    });

    // Also dispatch a DOM window event for any standard JS components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ltl:realtime', { detail: event }));
      if (event.type === 'SETTINGS_UPDATED') {
        window.dispatchEvent(new CustomEvent('settings-updated', { detail: event.data }));
      }
      if (event.type === 'CATEGORY_UPDATED' || event.type === 'CATEGORY_REORDERED') {
        window.dispatchEvent(new CustomEvent('categories-updated', { detail: event.data }));
      }
      if (event.type === 'HOMEPAGE_UPDATED') {
        window.dispatchEvent(new CustomEvent('homepage-updated', { detail: event.data }));
      }
    }

    // Broadcast across tabs if not already from broadcast channel
    if (!fromBroadcast && broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(event);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }
  }, []);

  // Publish event from client
  const publishEvent = useCallback((type: RealtimeEventType, title: string, message?: string, data?: any) => {
    const event: RealtimeEventPayload = {
      id: `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      data,
      timestamp: Date.now(),
      source: 'admin'
    };

    handleIncomingEvent(event, false);
  }, [handleIncomingEvent]);

  // Subscribe function for hooks
  const subscribe = useCallback((eventTypes: RealtimeEventType[] | 'ALL', callback: (event: RealtimeEventPayload) => void) => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    listenersRef.current.set(id, { types: eventTypes, callback });
    return () => {
      listenersRef.current.delete(id);
    };
  }, []);

  // Initialize Native BroadcastChannel (Zero network overhead, 0ms latency cross-tab sync)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('ltl_realtime_channel');
        broadcastChannelRef.current = bc;
        bc.onmessage = (msgEvent) => {
          if (msgEvent.data && msgEvent.data.type) {
            handleIncomingEvent(msgEvent.data, true);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }
    }

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [handleIncomingEvent]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, eventsHistory, publishEvent, subscribe }}>
      {children}

      {/* Floating Live Real-Time Toast Alerts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm pointer-events-none">
          {toasts.map((toast) => {
            const isOrder = toast.type.includes('ORDER');
            const isRfq = toast.type.includes('RFQ');
            const isProduct = toast.type.includes('PRODUCT');

            return (
              <div
                key={toast.id}
                className="pointer-events-auto bg-[#170e17] text-white border border-[#C21875]/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-start space-x-3 group"
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isOrder 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isRfq 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : isProduct 
                    ? 'bg-sky-500/20 text-sky-400' 
                    : 'bg-[#C21875]/20 text-[#C21875]'
                }`}>
                  {isOrder ? <ShoppingCart size={18} /> : isRfq ? <Bell size={18} /> : <Sparkles size={18} />}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">Live Synced</span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight mt-0.5 truncate">{toast.title}</h4>
                  {toast.message && (
                    <p className="text-[11px] text-white/70 line-clamp-2 mt-0.5 leading-snug">{toast.message}</p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to consume the Realtime context
 */
export function useRealtimeContext() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
}

/**
 * Hook to subscribe to specific realtime events and trigger a callback
 * @param eventTypes Array of event types to listen for, or 'ALL'
 * @param callback Callback function executed when matching event occurs
 */
export function useRealtime(
  eventTypes: RealtimeEventType[] | RealtimeEventType | 'ALL',
  callback: (event: RealtimeEventPayload) => void
) {
  const { subscribe } = useRealtimeContext();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const types = Array.isArray(eventTypes) ? eventTypes : eventTypes === 'ALL' ? 'ALL' : [eventTypes];
    const unsubscribe = subscribe(types, (evt) => {
      callbackRef.current(evt);
    });
    return unsubscribe;
  }, [eventTypes, subscribe]);
}
