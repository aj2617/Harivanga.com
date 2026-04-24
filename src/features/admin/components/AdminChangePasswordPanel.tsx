import React from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { supabase } from '../../../supabase';
import { hasSupabaseConfig } from '../../../lib/env';

type AdminChangePasswordPanelProps = {
  email?: string | null;
  disabled?: boolean;
  disabledMessage?: string;
  onAfterSuccess?: () => void;
};

export const AdminChangePasswordPanel: React.FC<AdminChangePasswordPanelProps> = ({
  email,
  disabled = false,
  disabledMessage,
  onAfterSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (disabled) {
      setError(disabledMessage || 'Password change is currently unavailable.');
      return;
    }

    if (!hasSupabaseConfig) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const trimmedCurrent = currentPassword.trim();
    const trimmedNext = newPassword.trim();
    if (trimmedNext.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (trimmedNext !== confirmPassword.trim()) {
      setError('New passwords do not match.');
      return;
    }
    if (!trimmedCurrent) {
      setError('Enter your current password to confirm this change.');
      return;
    }

    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Could not determine your admin email. Please sign out and sign in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: trimmedCurrent,
      });
      if (reauthError) {
        throw new Error('Current password is incorrect.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: trimmedNext });
      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated. Please sign in again.');
      resetForm();
      await supabase.auth.signOut();
      onAfterSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mango-orange/10 text-mango-orange">
            <KeyRound size={18} />
          </div>
          <div>
            <h2 className="text-xl font-black text-mango-dark">Change Password</h2>
            <p className="text-sm text-gray-500">Update the admin login password for this account.</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {disabled && disabledMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {disabledMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
                Current Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm font-semibold text-mango-dark outline-none transition focus:border-mango-orange focus:ring-4 focus:ring-mango-orange/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((current) => !current)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-mango-dark/60 transition hover:bg-mango-dark/5 hover:text-mango-dark"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
                New Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm font-semibold text-mango-dark outline-none transition focus:border-mango-orange focus:ring-4 focus:ring-mango-orange/10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-mango-dark/60 transition hover:bg-mango-dark/5 hover:text-mango-dark"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
                Confirm
              </label>
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm font-semibold text-mango-dark outline-none transition focus:border-mango-orange focus:ring-4 focus:ring-mango-orange/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-mango-dark/60 transition hover:bg-mango-dark/5 hover:text-mango-dark"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-gray-500">
              Minimum 8 characters. You will be signed out after updating.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || disabled}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-mango-dark px-6 text-sm font-black text-white shadow-xl shadow-mango-dark/10 transition hover:bg-mango-dark/95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
