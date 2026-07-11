import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, UserPlus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Register({
  onToggle,
  onClose,
}: {
  onToggle: () => void;
  onClose?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await register(email.trim(), password);
      setSuccess(true);
      window.setTimeout(() => onClose?.(), 700);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-rise rounded-xl border border-border bg-card p-7 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-accent/10 p-3 text-accent">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-sm text-muted-foreground">Start saving audits, reports, and plan usage.</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close signup modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Email</span>
          <span className="relative block">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-foreground transition-all placeholder:text-muted-foreground focus:border-accent"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">Password</span>
          <span className="relative block">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-foreground transition-all placeholder:text-muted-foreground focus:border-accent"
              placeholder="Create a secure password"
              autoComplete="new-password"
              required
            />
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Account created. Loading your dashboard...
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <button type="button" onClick={onToggle} className="font-semibold text-accent hover:text-accent/80">
          Sign in
        </button>
      </div>
    </div>
  );
}
