/**
 * Queue-related Socket.io handlers and server-side emits to queue rooms
 */

/**
 * Register queue room join/leave handlers on a connected socket
 * @param {import('socket.io').Socket} socket
 */
function registerQueueSocketHandlers(socket) {
  socket.on('join-queue', (data) => {
    const { queueId } = data || {};
    if (queueId) {
      socket.join(`queue-${queueId}`);
      socket.emit('joined-queue', {
        queueId,
        message: `Connected to queue ${queueId} updates`,
      });
    }
  });

  socket.on('leave-queue', (data) => {
    const { queueId } = data || {};
    if (queueId) {
      socket.leave(`queue-${queueId}`);
    }
  });
}

/**
 * Emit generic queue room update (new token, cancelled, completed, etc.)
 * @param {import('socket.io').Server | null} io
 * @param {number|string} queueId
 * @param {object} payload — spread as event body (type, queueId, token, …)
 */
function emitQueueUpdate(io, queueId, payload) {
  if (!io) return;
  io.to(`queue-${queueId}`).emit('queue-update', payload);
}

/**
 * Emit token-called to queue subscribers
 * @param {import('socket.io').Server | null} io
 */
function emitTokenCalledToQueue(io, queueId, tokenPayload) {
  if (!io) return;
  io.to(`queue-${queueId}`).emit('token-called', {
    queueId: typeof queueId === 'string' ? parseInt(queueId, 10) : queueId,
    token: tokenPayload,
  });
}

module.exports = {
  registerQueueSocketHandlers,
  emitQueueUpdate,
  emitTokenCalledToQueue,
};
