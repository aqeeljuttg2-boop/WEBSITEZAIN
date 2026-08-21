import { addRealtimeClient, removeRealtimeClient } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  let clientController: ReadableStreamDefaultController | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientController = controller;
      addRealtimeClient(controller);

      // Send initial connection acknowledgment
      const handshake = `data: ${JSON.stringify({
        type: 'CONNECTED',
        timestamp: Date.now(),
        title: 'Real-Time Stream Connected',
        message: 'Live real-time sync channel active'
      })}\n\n`;
      controller.enqueue(encoder.encode(handshake));

      // Keep-alive heartbeat every 20 seconds to prevent timeout
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          if (clientController) removeRealtimeClient(clientController);
        }
      }, 20000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (clientController) removeRealtimeClient(clientController);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
