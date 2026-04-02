'use client';

/**
 * Admin Queue Control Page
 * Select a queue and manage tokens: call next, skip, priority, complete
 */
import React, { useState, useEffect, useCallback } from 'react';
import { locationService } from '@/services/location.service';
import { tokenService } from '@/services/token.service';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/components/ToastProvider';
import {
  ChevronRight, Play, SkipForward, AlertTriangle,
  CheckCircle2, Users, Phone, Crown, RefreshCw, Radio
} from 'lucide-react';

export default function AdminQueuesPage() {
  const { socket, joinQueue } = useSocket();
  const { showToast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<number | null>(null);
  const [queueTokens, setQueueTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await locationService.getAll({ limit: 50 } as any);
        setLocations(res.data.data.locations);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const fetchQueueTokens = useCallback(async () => {
    if (!selectedQueue) return;
    try {
      const res = await tokenService.getQueueTokens(selectedQueue);
      setQueueTokens(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    }
  }, [selectedQueue]);

  useEffect(() => {
    if (selectedQueue) {
      fetchQueueTokens();
      joinQueue(selectedQueue);
    }
  }, [selectedQueue, fetchQueueTokens, joinQueue]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchQueueTokens();
    socket.on('queue-update', handleUpdate);
    socket.on('token-called', handleUpdate);
    return () => {
      socket.off('queue-update', handleUpdate);
      socket.off('token-called', handleUpdate);
    };
  }, [socket, fetchQueueTokens]);

  const handleCallNext = async () => {
    if (!selectedQueue) return;
    setIsActionLoading(true);
    try {
      const res = await tokenService.callNext(selectedQueue);
      showToast(`🔔 ${res.data.message}`, 'success');
      fetchQueueTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to call next token.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSkip = async (tokenId: number) => {
    try {
      await tokenService.skipToken(tokenId);
      showToast('Token skipped.', 'info');
      fetchQueueTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to skip token.', 'error');
    }
  };

  const handleComplete = async (tokenId: number) => {
    try {
      await tokenService.completeToken(tokenId);
      showToast('Token completed.', 'success');
      fetchQueueTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to complete token.', 'error');
    }
  };

  const handlePriority = async (tokenId: number) => {
    try {
      await tokenService.setPriority(tokenId, { is_priority: true, priority_reason: 'Emergency' });
      showToast('⚡ Priority set for token.', 'warning');
      fetchQueueTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to set priority.', 'error');
    }
  };

  const handleCallSpecific = async (tokenId: number) => {
    try {
      await tokenService.callToken(tokenId);
      showToast('Token called.', 'success');
      fetchQueueTokens();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to call token.', 'error');
    }
  };

  // Categorize tokens
  const servingTokens = queueTokens.filter(t => t.status === 'serving' || t.status === 'called');
  const waitingTokens = queueTokens.filter(t => t.status === 'waiting');

  // Get all queues across locations
  const [allQueues, setAllQueues] = useState<any[]>([]);
  useEffect(() => {
    const fetchAllQueues = async () => {
      const queuesList: any[] = [];
      for (const loc of locations) {
        try {
          const res = await locationService.getById(loc.id);
          res.data.data.queues.forEach((q: any) => {
            queuesList.push({ ...q, location_name: loc.name });
          });
        } catch (e) { /* skip */ }
      }
      setAllQueues(queuesList);
    };
    if (locations.length > 0) fetchAllQueues();
  }, [locations]);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--secondary)]">Queue Control</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage tokens in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Selection */}
        <div className="lg:col-span-1">
          <div className="card-static">
            <h2 className="font-bold text-[var(--secondary)] mb-3">Select Queue</h2>
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)
              ) : allQueues.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No queues found</p>
              ) : (
                allQueues.map((queue) => (
                  <button
                    key={queue.id}
                    onClick={() => setSelectedQueue(queue.id)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedQueue === queue.id
                        ? 'border-[var(--primary)] bg-[var(--primary-50)]'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-[var(--secondary)]">{queue.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{queue.location_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${queue.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <ChevronRight size={14} className="text-[var(--text-muted)]" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Queue Control Panel */}
        <div className="lg:col-span-2">
          {!selectedQueue ? (
            <div className="card-static text-center py-20">
              <Radio size={48} className="text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[var(--secondary)] mb-2">Select a Queue</h3>
              <p className="text-sm text-[var(--text-secondary)]">Choose a queue from the left panel to manage tokens.</p>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="card-static mb-4">
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleCallNext} disabled={isActionLoading} className="btn-primary text-sm !py-2.5 disabled:opacity-50">
                    <Play size={16} /> Call Next Token
                  </button>
                  <button onClick={fetchQueueTokens} className="btn-secondary text-sm !py-2.5">
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
              </div>

              {/* Currently Serving */}
              {servingTokens.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[var(--secondary)] mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Now Serving / Called
                  </h3>
                  <div className="space-y-2">
                    {servingTokens.map(token => (
                      <div key={token.id} className="card-static flex items-center justify-between !py-3 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-green-700">{token.token_number}</span>
                          <div>
                            <p className="text-sm font-medium text-[var(--secondary)]">{token.user_name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{token.user_phone || token.user_email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleComplete(token.id)} className="btn-success text-xs !py-1.5 !px-3">
                            <CheckCircle2 size={14} /> Complete
                          </button>
                          <button onClick={() => handleSkip(token.id)} className="btn-secondary text-xs !py-1.5 !px-3">
                            <SkipForward size={14} /> Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waiting Queue */}
              <h3 className="text-sm font-bold text-[var(--secondary)] mb-2 flex items-center gap-2">
                <Users size={16} className="text-[var(--primary)]" />
                Waiting ({waitingTokens.length})
              </h3>
              <div className="space-y-2">
                {waitingTokens.length === 0 ? (
                  <div className="card-static text-center py-8">
                    <p className="text-sm text-[var(--text-muted)]">🎉 No more tokens waiting!</p>
                  </div>
                ) : (
                  waitingTokens.map((token, index) => (
                    <div key={token.id} className={`card-static flex items-center justify-between !py-3 ${token.is_priority ? 'bg-amber-50 border-amber-200' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-[var(--text-muted)] w-6">#{index + 1}</span>
                        <span className="text-lg font-bold text-[var(--secondary)]">{token.token_number}</span>
                        {token.is_priority && <Crown size={14} className="text-amber-500" />}
                        <div className="hidden sm:block">
                          <p className="text-sm font-medium text-[var(--secondary)]">{token.user_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{token.user_phone || token.user_email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleCallSpecific(token.id)} title="Call" className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Phone size={14} />
                        </button>
                        <button onClick={() => handlePriority(token.id)} title="Set Priority" className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors">
                          <AlertTriangle size={14} />
                        </button>
                        <button onClick={() => handleSkip(token.id)} title="Skip" className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <SkipForward size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
