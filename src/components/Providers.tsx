'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SocketManager from '@/lib/socket';

function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      const socketManager = SocketManager.getInstance();
      const socket = socketManager.connect(session.user.id);
      
      socket.emit('authenticate', session.user.id);

      return () => {
        socketManager.disconnect();
      };
    }
  }, [session]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </SessionProvider>
  );
}
