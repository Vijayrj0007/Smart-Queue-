'use client';

/**
 * Socket Context Provider
 * Manages Socket.io connection for real-time updates
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinQueue: (queueId: number) => void;
  leaveQueue: (queueId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinQueue: () => {},
  leaveQueue: () => {},
});

function resolveSocketUrl() {
  const envBase = process.env.NEXT_PUBLIC_SOCKET_URL;
  const fallback = 'http://localhost:5000';
  const baseFromEnv = envBase || fallback;

  if (typeof window === 'undefined') return baseFromEnv;

  const host = window.location.hostname;
  const isClientLocal =
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '0.0.0.0';

  const envLooksLikeLocalhost =
    !envBase ||
    baseFromEnv.includes('localhost:5000') ||
    baseFromEnv.includes('127.0.0.1:5000') ||
    baseFromEnv.includes('0.0.0.0:5000');

  if (!isClientLocal && envLooksLikeLocalhost) {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  return baseFromEnv;
}

const SOCKET_URL = resolveSocketUrl();

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    let didLogConnectError = false;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      // Prevent excessive retry loops from degrading the browser/CPU when the backend is unreachable.
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);

      // Join admin room if admin
      if (user?.role === 'admin') {
        newSocket.emit('join-admin', {});
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      if (!didLogConnectError) {
        didLogConnectError = true;
        // Keep logs short to avoid flooding devtools in failure scenarios.
        console.warn('Socket connection failed (will retry).');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, user?.role]);

  const joinQueue = (queueId: number) => {
    if (socket) {
      socket.emit('join-queue', { queueId });
    }
  };

  const leaveQueue = (queueId: number) => {
    if (socket) {
      socket.emit('leave-queue', { queueId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinQueue, leaveQueue }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
