'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormError from '@/components/FormError';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ClientActionsProps {
  clientId: string;
  isActive: boolean;
}

export default function ClientActions({ clientId, isActive }: ClientActionsProps) {
  const router = useRouter();
  const [resetLoading, setResetLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  async function handleResetPassword() {
    setError(null);
    setSuccess(null);
    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to reset password');
      } else {
        setSuccess('Password reset email sent.');
        router.refresh();
      }
    } catch {
      setError('Unexpected error.');
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDeactivate() {
    setShowDeactivateConfirm(false);
    setError(null);
    setSuccess(null);
    setDeactivateLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/deactivate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to deactivate account');
      } else {
        setSuccess('Account deactivated.');
        router.refresh();
      }
    } catch {
      setError('Unexpected error.');
    } finally {
      setDeactivateLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError message={error} />
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleResetPassword}
          disabled={resetLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors"
        >
          {resetLoading && <LoadingSpinner size="sm" />}
          Reset Password
        </button>

        {isActive && (
          <button
            onClick={() => setShowDeactivateConfirm(true)}
            disabled={deactivateLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors"
          >
            {deactivateLoading && <LoadingSpinner size="sm" />}
            Deactivate Account
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title="Deactivate Account"
        message="Are you sure you want to deactivate this client account? They will no longer be able to log in."
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateConfirm(false)}
      />
    </div>
  );
}
