import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { hasSupabaseConfig } from '../lib/env';
import { supabase } from '../supabase';

export const AdminResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!hasSupabaseConfig) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError('Could not validate reset session. Please request a new reset email.');
        return;
      }
      if (!data.session) {
        setError('Reset link is missing or expired. Please request a new reset email.');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nextPassword = password.trim();
    if (nextPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (nextPassword !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated. Please sign in again.');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/admin'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-admin min-h-screen bg-[#0c1326] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-white/8 bg-[#101933] p-3 shadow-[0_30px_120px_rgba(2,6,23,0.45)] sm:p-5">
          <div className="rounded-[24px] border border-white/6 bg-[#11192f] px-4 py-6 sm:px-6 sm:py-7">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#7b2638] bg-[#2a1830] text-[#ff4d4f] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Lock size={24} strokeWidth={2.1} />
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-[1.75rem] font-black tracking-tight text-white">Reset Password</h1>
              <p className="mt-1.5 text-sm text-[#6f86b0]">Set a new admin password.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.24em] text-[#6d7ea5]">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2.5 h-12 w-full rounded-[14px] border border-white/8 bg-[#dfe7f5] px-4 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-[#ff6b6d] focus:ring-4 focus:ring-[#ff4d4f]/10"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.24em] text-[#6d7ea5]">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2.5 h-12 w-full rounded-[14px] border border-white/8 bg-[#dfe7f5] px-4 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-[#ff6b6d] focus:ring-4 focus:ring-[#ff4d4f]/10"
                />
              </div>

              {error && (
                <div className="rounded-[18px] border border-[#ff4d4f]/25 bg-[#3a1d28] px-4 py-3 text-sm font-medium text-[#ffb7b8]">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-[18px] border border-emerald-200/20 bg-emerald-900/20 px-4 py-3 text-sm font-medium text-emerald-100">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || Boolean(error && error.includes('expired'))}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-[#202d45] text-lg font-black text-white transition hover:bg-[#25334f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
                <ArrowRight size={18} />
              </button>
            </form>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="mt-4 w-full text-center text-xs font-semibold text-[#8da0c5] transition hover:text-white"
            >
              Back to Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

