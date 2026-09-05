import React, { useState } from 'react';
import { Shield, KeyRound, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface LoginPageProps {
  onNavigateSignup: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateSignup, onSuccess }) => {
  const { mockLogin } = useAuth();
  const [email, setEmail] = useState('remote.sensing@isro-partner.org');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both operator identification and access token.');
      return;
    }
    setError(null);
    mockLogin(email);
    onSuccess();
  };

  const handleGoogleAuth = () => {
    mockLogin('google.analyst@isro-partner.org');
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-7">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">SatQuery AI Console</h1>
            <p className="text-xs text-text-secondary">Earth Observation & Spectral Intelligence</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded bg-alert/10 border border-alert/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-alert shrink-0 mt-0.5" />
            <span className="text-xs text-alert">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-text-secondary mb-1.5">
              Operator Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
              placeholder="operator@organization.org"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs uppercase font-mono tracking-wider text-text-secondary">Passkey</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
              placeholder="Access token"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-signal text-base font-semibold py-2.5 px-4 rounded text-sm hover:opacity-95 transition-opacity"
          >
            Authenticate Session
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full bg-elevated border border-border hover:border-border-strong text-text-primary py-2 px-3 rounded text-xs flex items-center justify-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-signal" />
            Sign in with Institutional SSO (Google)
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-text-secondary">
          No active workstation key?{' '}
          <button onClick={onNavigateSignup} className="text-signal hover:underline">
            Request credentials
          </button>
        </div>
      </div>
    </div>
  );
};
