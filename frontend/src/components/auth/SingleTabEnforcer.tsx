'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

interface TabSyncMessage {
  type: 'NEW_TAB_OPENED';
  timestamp: number;
}

export default function SingleTabEnforcer(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('lms_tab_sync');

    // On component mount, broadcast a new tab open event
    const message: TabSyncMessage = {
      type: 'NEW_TAB_OPENED',
      timestamp: Date.now(),
    };
    channel.postMessage(message);

    // Listen for incoming sync messages
    const handleMessage = (event: MessageEvent<TabSyncMessage>) => {
      if (event.data && event.data.type === 'NEW_TAB_OPENED') {
        // If we receive this message, we are the OLDER active tab.
        // Self-destruct by signing out and redirecting to the login page with error state.
        signOut({ callbackUrl: '/login?error=multiple_tabs' });
      }
    };

    channel.addEventListener('message', handleMessage);

    // Cleanup the channel and listeners on unmount
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  return null;
}
