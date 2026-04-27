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
    <section className="border border-[#f3f4f6] bg-white">
      <div className="border-b border-[#f3f4f6] px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#fff7ed] border border-[#fed7aa] text-[#f97316]">
            <KeyRound size={16} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[#111827]">Change Password</h2>
            <p className="mt-0.5 text-sm text-gray-500 font-light">Update the admin login password for this account.</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {disabled && disabledMessage && (
            <div className="border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-medium">
              {disabledMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Current Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 w-full border border-gray-200 bg-white px-4 pr-11 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((current) => !current)}
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition hover:text-[#111827]"
                >
                  {showCurrentPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                New Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 w-full border border-gray-200 bg-white px-4 pr-11 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition hover:text-[#111827]"
                >
                  {showNewPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Confirm
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full border border-gray-200 bg-white px-4 pr-11 text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#f97316] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition hover:text-[#111827]"
                >
                  {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-red-100 bg-red-50/60 px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#f3f4f6] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500 font-light">
              Minimum 8 characters. You will be signed out after updating.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || disabled}
              className="inline-flex items-center justify-center gap-2 bg-[#111827] px-5 py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
