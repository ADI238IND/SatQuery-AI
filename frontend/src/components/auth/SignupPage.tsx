import React, { useState } from 'react';
import { Radio, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface SignupPageProps {
  onNavigateLogin: () => void;
  onSuccess: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigateLogin, onSuccess }) => {
  const { mockLogin } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('All fields are required to register an analyst profile.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Provided passwords do not match.');
      return;
    }
    mockLogin(email);
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-base p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-7">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="w-8 h-8 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary">Provision Node Access</h1>
            <p className="text-xs text-text-secondary">Create Remote Sensing Analyst Account</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded bg-alert/10 border border-alert/30 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-alert shrink-0 mt-0.5" />
            <span className="text-xs text-alert">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-text-secondary mb-1">
              Analyst Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
              placeholder="Dr. Rajesh Varma"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-text-secondary mb-1">
              Organization Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
              placeholder="r.varma@nrsc.gov.in"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
              placeholder="Minimum 12 characters"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono tracking-wider text-text-secondary mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-elevated border border-border focus:border-signal text-text-primary px-3 py-2 text-sm rounded outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-signal text-base font-semibold py-2.5 px-4 rounded text-sm hover:opacity-95 transition-opacity mt-2"
          >
            Create Operator Account
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-text-secondary border-t border-border pt-4">
          Already registered on this node?{' '}
          <button onClick={onNavigateLogin} className="text-signal hover:underline">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};