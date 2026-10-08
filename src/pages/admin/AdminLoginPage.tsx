import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useRafiki } from '../../context/RafikiContext';
import { apiFetch, setAdminToken } from '../../lib/supabase/client';

export const AdminLoginPage: React.FC = () => {
  const { navigate } = useRafiki();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{
        token: string;
        admin: { email: string; name: string };
      }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAdminToken(res.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5C5F58] hover:text-[#1A1D1B] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to public website</span>
        </a>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#2C4C3E]">
            MIS Stays · Hospitality Management
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1D1B]">
            Admin Sign In
          </h1>
          <p className="text-sm text-[#4A4E48]">
            Protected portal for managing properties, booking requests, and guest communications.
          </p>
        </div>

        <div className="rounded-xl bg-[#F2EFE9] border border-[#1A1D1B]/12 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-medium text-[#4A4E48] mb-1.5"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#4A4E48] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#FBF9F5] border border-[#1A1D1B]/15 text-sm text-[#1A1D1B] focus:border-[#2C4C3E] focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-xs text-[#991B1B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 px-5 rounded-lg bg-[#2C4C3E] hover:bg-[#223B30] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          <p className="pt-4 border-t border-[#1A1D1B]/10 text-xs text-[#5C5F58]">
            Sign in with an administrator account created in your Supabase project.
          </p>
        </div>
      </div>
    </div>
  );
};
