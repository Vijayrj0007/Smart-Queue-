'use client';

/**
 * Live Queue Tracking Page
 * Real-time queue display with Socket.io updates
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { queueService } from '@/services/queue.service';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Users, Timer, CheckCircle2, Clock, Radio,
  AlertTriangle, Crown, RefreshCw
} from 'lucide-react';

export default function QueueTrackingPage() {
  const params = useParams();
  const { socket, joinQueue, leaveQueue } = useSocket();
  const { user } = useAuth();
  const [queue, setQueue] = useState<any>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queueId = Number(params.id);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await queueService.getById(queueId);
      setQueue(res.data.data.queue);
      setTokens(res.data.data.tokens);
      setStats(res.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setIsLoading(false);
    }
  }, [queueId]);

  useEffect(() => {
    fetchQueue();
    joinQueue(queueId);

    return () => {
      leaveQueue(queueId);
    };
  }, [fetchQueue, joinQueue, leaveQueue, queueId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => fetchQueue();
    socket.on('queue-update', handleUpdate);
    socket.on('token-called', handleUpdate);

    return () => {
      socket.off('queue-update', handleUpdate);
      socket.off('token-called', handleUpdate);
    };
  }, [socket, fetchQueue]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'serving': return 'bg-green-500 text-white';
      case 'called': return 'bg-blue-500 text-white animate-pulse';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="skeleton h-40 w-full mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Queue Not Found</h2>
          <Link href="/locations" className="btn-primary mt-4">Browse Locations</Link>
        </div>
      </div>
    );
  }

  const servingToken = tokens.find(t => t.status === 'serving');
  const calledToken = tokens.find(t => t.status === 'called');
  const waitingTokens = tokens.filter(t => t.status === 'waiting');

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link href="/locations" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Queue Header */}
        <div className="card-static mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--text-muted)]">{queue.location_name}</p>
              <h1 className="text-2xl font-bold text-[var(--secondary)]">{queue.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-600">Live</span>
              <button onClick={fetchQueue} className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <RefreshCw size={14} className="text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Now Serving Display */}
          <div className="bg-gradient-to-br from-[#4F6AF6] to-[#3B50D5] rounded-2xl p-6 text-center text-white mb-4">
            <p className="text-sm text-blue-200 font-medium mb-1">Now Serving</p>
            <p className="text-5xl font-bold mb-2">
              {servingToken?.token_number || calledToken?.token_number || '---'}
            </p>
            {(servingToken || calledToken) && (
              <p className="text-sm text-blue-200">{servingToken ? 'Being served' : 'Called to counter'}</p>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Users size={18} className="text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{stats?.waiting_count || 0}</p>
              <p className="text-xs text-blue-600">Waiting</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <CheckCircle2 size={18} className="text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{stats?.today_served || 0}</p>
              <p className="text-xs text-green-600">Served Today</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <Timer size={18} className="text-orange-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-orange-700">~{Math.round(stats?.avg_service_time || queue.avg_service_time)}m</p>
              <p className="text-xs text-orange-600">Avg. Time</p>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <h2 className="text-lg font-bold text-[var(--secondary)] mb-3 flex items-center gap-2">
          <Radio size={18} className="text-[var(--primary)]" />
          Queue ({tokens.length} tokens)
        </h2>

        <div className="space-y-2">
          {tokens.length === 0 ? (
            <div className="card-static text-center py-10">
              <p className="text-[var(--text-secondary)]">No tokens in this queue yet.</p>
            </div>
          ) : (
            tokens.map((token, index) => {
              const isCurrentUser = user && token.user_id === user.id;
              
              return (
                <div
                  key={token.id}
                  className={`card-static flex items-center justify-between !py-3 !px-4 ${
                    isCurrentUser ? 'ring-2 ring-[var(--primary)] ring-offset-2' : ''
                  } ${token.status === 'called' ? 'animate-pulse bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[var(--secondary)] w-16">{token.token_number}</span>
                    {token.is_priority && (
                      <Crown size={14} className="text-amber-500" />
                    )}
                    {isCurrentUser && (
                      <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary-50)] px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {token.status === 'waiting' && token.estimated_wait > 0 && (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock size={12} /> ~{token.estimated_wait}min
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(token.status)}`}>
                      {token.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
