'use client';

/**
 * User Dashboard
 * Shows active tokens, queue positions, and quick actions
 */
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ToastProvider';
import { tokenService } from '@/services/token.service';
import {
  Ticket, Clock, MapPin, Users, ArrowRight, RefreshCw,
  XCircle, CheckCircle2, AlertCircle, Timer, Building2
} from 'lucide-react';

interface ActiveToken {
  id: number;
  token_number: string;
  queue_name: string;
  location_name: string;
  location_type: string;
  status: string;
  position: number;
  people_ahead: number;
  estimated_wait: number;
  booked_at: string;
  is_priority: boolean;
  queue_id: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { socket, joinQueue } = useSocket();
  const { showToast } = useToast();
  const [activeTokens, setActiveTokens] = useState<ActiveToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await tokenService.getMyTokens();
      setActiveTokens(res.data.data);
      // Join queue rooms for real-time updates
      res.data.data.forEach((t: ActiveToken) => joinQueue(t.queue_id));
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setIsLoading(false);
    }
  }, [joinQueue]);

  useEffect(() => {
    if (isAuthenticated) fetchTokens();
  }, [isAuthenticated, fetchTokens]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = () => fetchTokens();
    const handleYourTurn = (data: any) => {
      showToast(`🎉 Your token ${data.tokenNumber} has been called! Please proceed.`, 'success');
      fetchTokens();
    };

    socket.on('queue-update', handleQueueUpdate);
    socket.on('token-called', handleQueueUpdate);
    socket.on('your-turn', handleYourTurn);

    return () => {
      socket.off('queue-update', handleQueueUpdate);
      socket.off('token-called', handleQueueUpdate);
      socket.off('your-turn', handleYourTurn);
    };
  }, [socket, fetchTokens, showToast]);

  const handleCancel = async (tokenId: number) => {
    if (!confirm('Are you sure you want to cancel this token?')) return;
    try {
      await tokenService.cancel(tokenId);
      showToast('Token cancelled successfully.', 'success');
      fetchTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to cancel token.', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'badge-waiting';
      case 'called': return 'badge-called';
      case 'serving': return 'badge-serving';
      default: return 'badge-waiting';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--secondary)]">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Here&apos;s your queue status overview.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchTokens} className="btn-secondary !py-2.5 !px-4 text-sm">
              <RefreshCw size={16} /> Refresh
            </button>
            <Link href="/locations" className="btn-primary !py-2.5 !px-5 text-sm">
              Book New Token
            </Link>
          </div>
        </div>

        {/* Active Tokens */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="card-static">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="skeleton h-16 w-full mb-4" />
                <div className="skeleton h-4 w-48 mb-2" />
                <div className="skeleton h-4 w-36" />
              </div>
            ))}
          </div>
        ) : activeTokens.length === 0 ? (
          <div className="card-static text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-[var(--primary-50)] flex items-center justify-center mx-auto mb-4">
              <Ticket size={36} className="text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--secondary)] mb-2">No Active Tokens</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              You don&apos;t have any active queue tokens. Book one to get started!
            </p>
            <Link href="/locations" className="btn-primary">
              Browse Locations <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTokens.map((token) => (
              <div key={token.id} className="card-static overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1.5 -mx-6 -mt-6 mb-4 ${
                  token.status === 'called' || token.status === 'serving' 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-[#4F6AF6] to-[#7B93FF]'
                }`} />
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-[var(--text-muted)]" />
                      <span className="text-sm text-[var(--text-secondary)]">{token.location_name}</span>
                    </div>
                    <h3 className="font-bold text-[var(--secondary)]">{token.queue_name}</h3>
                  </div>
                  <span className={`badge ${getStatusColor(token.status)}`}>
                    {token.status === 'called' && '🔔 '}{token.status}
                  </span>
                </div>

                {/* Token Number Display */}
                <div className="bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] rounded-2xl p-6 text-center mb-4">
                  <p className="text-sm text-[var(--primary)] font-medium mb-1">Your Token</p>
                  <p className="text-4xl font-bold text-[var(--primary)]">{token.token_number}</p>
                  {token.is_priority && (
                    <span className="badge badge-priority mt-2">⚡ Priority</span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Users size={16} className="text-[var(--primary)] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[var(--secondary)]">{token.people_ahead}</p>
                    <p className="text-xs text-[var(--text-muted)]">People Ahead</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Timer size={16} className="text-[var(--primary)] mx-auto mb-1" />
                    <p className="text-lg font-bold text-[var(--secondary)]">{token.estimated_wait} min</p>
                    <p className="text-xs text-[var(--text-muted)]">Est. Wait</p>
                  </div>
                </div>

                {/* Alert for called tokens */}
                {(token.status === 'called' || token.status === 'serving') && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-700">
                      {token.status === 'called' ? 'Your token has been called! Please proceed.' : 'You are currently being served.'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/queue/${token.queue_id}`} className="btn-secondary flex-1 text-sm !py-2.5 justify-center">
                    Track Live
                  </Link>
                  {token.status === 'waiting' && (
                    <button onClick={() => handleCancel(token.id)} className="btn-danger text-sm !py-2.5 !px-4">
                      <XCircle size={16} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Link href="/locations" className="card group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <MapPin size={22} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--secondary)]">Find Locations</h3>
              <p className="text-sm text-[var(--text-muted)]">Browse nearby services</p>
            </div>
            <ArrowRight size={18} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </Link>
          <Link href="/history" className="card group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Clock size={22} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--secondary)]">Booking History</h3>
              <p className="text-sm text-[var(--text-muted)]">View past bookings</p>
            </div>
            <ArrowRight size={18} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </Link>
          <Link href="/notifications" className="card group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <AlertCircle size={22} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--secondary)]">Notifications</h3>
              <p className="text-sm text-[var(--text-muted)]">View all alerts</p>
            </div>
            <ArrowRight size={18} className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
