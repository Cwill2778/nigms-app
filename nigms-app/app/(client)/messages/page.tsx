import ClientMessagingPanel from '@/components/ClientMessagingPanel';

/**
 * Client messages page — full-page messaging interface.
 * Uses ClientMessagingPanel which provides real-time messaging,
 * photo upload, and admin notification on send.
 *
 * Requirements: 7.7
 */
export default function ClientMessagesPage() {
  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-4"
      style={{ height: 'calc(100vh - 8rem)' }}
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Messages</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send a message or photo to the Nailed It team. We typically respond within one business day.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--color-steel-dim, #2a3a52)',
          background: 'var(--color-bg-surface, #0f1e30)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '400px',
        }}
      >
        <ClientMessagingPanel />
      </div>
    </div>
  );
}
