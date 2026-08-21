/**
 * Real-Time Event Bus & Server-Sent Events (SSE) Engine
 * Manages active SSE connections, event history buffer, and event broadcasting.
 */

export type RealtimeEventType = 
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_DELETED'
  | 'RFQ_CREATED'
  | 'RFQ_UPDATED'
  | 'RFQ_DELETED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRODUCT_BULK_UPDATED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  | 'CATEGORY_REORDERED'
  | 'SETTINGS_UPDATED'
  | 'HOMEPAGE_UPDATED'
  | 'BANNER_UPDATED'
  | 'REVIEW_CREATED'
  | 'REVIEW_UPDATED'
  | 'REVIEW_DELETED'
  | 'COUPON_UPDATED'
  | 'BRAND_UPDATED'
  | 'PAGE_UPDATED'
  | 'MENU_UPDATED'
  | 'SEO_UPDATED'
  | 'MEDIA_UPLOADED'
  | 'CART_SYNC';

export interface RealtimeEventPayload {
  id: string;
  type: RealtimeEventType;
  timestamp: number;
  title: string;
  message?: string;
  data?: any;
  source?: 'admin' | 'storefront' | 'system';
}

// In-memory global state across hot-reloads and API invocations
declare global {
  var __realtimeClients: Set<ReadableStreamDefaultController> | undefined;
  var __realtimeHistory: RealtimeEventPayload[] | undefined;
}

const clients = global.__realtimeClients || new Set<ReadableStreamDefaultController>();
global.__realtimeClients = clients;

const MAX_HISTORY = 100;
const history = global.__realtimeHistory || [];
global.__realtimeHistory = history;

/**
 * Register a new SSE streaming client controller
 */
export function addRealtimeClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

/**
 * Remove an SSE client controller on disconnect
 */
export function removeRealtimeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}

/**
 * Broadcast an event to all connected SSE clients and save in history ring buffer
 */
export function broadcastRealtimeEvent(event: Omit<RealtimeEventPayload, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
  const fullEvent: RealtimeEventPayload = {
    id: event.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: event.timestamp || Date.now(),
    type: event.type,
    title: event.title,
    message: event.message,
    data: event.data,
    source: event.source || 'system'
  };

  // Add to ring buffer
  history.push(fullEvent);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  // Format as SSE message data
  const data = `data: ${JSON.stringify(fullEvent)}\n\n`;
  const encoded = new TextEncoder().encode(data);

  // Send to all active SSE subscribers
  const deadClients: ReadableStreamDefaultController[] = [];
  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (err) {
      deadClients.push(controller);
    }
  });

  // Clean up any closed or faulted controllers
  deadClients.forEach(c => clients.delete(c));

  return fullEvent;
}

/**
 * Get recent events after a specific timestamp
 */
export function getEventsSince(sinceTimestamp: number): RealtimeEventPayload[] {
  if (!sinceTimestamp || isNaN(sinceTimestamp)) {
    return history.slice(-20);
  }
  return history.filter(evt => evt.timestamp > sinceTimestamp);
}

/**
 * Get all recent event history
 */
export function getRecentEventHistory(limit: number = 30): RealtimeEventPayload[] {
  return history.slice(-limit);
}
