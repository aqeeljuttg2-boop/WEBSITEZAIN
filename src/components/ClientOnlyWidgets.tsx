'use client';

import dynamic from 'next/dynamic';

// Lazy-load heavy UI widgets — deferred until after hydration
// ssr:false is allowed here because this is a Client Component
const Chatbot = dynamic(() => import('@/components/Chatbot'), { ssr: false });
const MobileBottomNav = dynamic(() => import('@/components/MobileBottomNav'), { ssr: false });

export default function ClientOnlyWidgets() {
  return (
    <>
      <Chatbot />
      <MobileBottomNav />
    </>
  );
}
