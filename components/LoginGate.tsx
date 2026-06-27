import React, { useState } from 'react';
import { LogoIcon, LockClosedIcon } from './icons';

interface LoginGateProps {
  onLoginSuccess: (email: string, name: string) => void;
}

// Inline custom icons for completeness
const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const AUTHORIZED_EMAILS = [
  'aviv@espamsterdam.com',
  'bas@espamsterdam.com',
  'maggie@espamsterdam.com',
  'maggie.janisch@gmail.com',
  'avivlyweb@gmail.com'
];

// Helper to get name from email
const getNameFromEmail = (email: string): string => {
  const parts = email.split('@')[0];
  // split by dot or underscore if exists
  const nameParts = parts.split(/[\._\-]/);
  return nameParts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const cleanPasscode = passcode.trim();

    // 1. Check if email is in the authorized list
    if (!AUTHORIZED_EMAILS.includes(normalizedEmail)) {
      setTimeout(() => {
        setError('Access Denied: This email address is not authorized as an ESP Amsterdam reviewer.');
        setIsLoading(false);
      }, 500);
      return;
    }

    // 2. Validate passcode
    // The master passcode is EspReview2026! or can be configured via env
    const expectedPasscode = import.meta.env.VITE_REVIEWER_PASSCODE || 'EspReview2026!';
    if (cleanPasscode !== expectedPasscode) {
      setTimeout(() => {
        setError('Incorrect passcode. Please verify your credentials and try again.');
        setIsLoading(false);
      }, 500);
      return;
    }

    // Success!
    setTimeout(() => {
      const reviewerName = getNameFromEmail(normalizedEmail);
      onLoginSuccess(normalizedEmail, reviewerName);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600/10 rounded-2xl ring-1 ring-indigo-500/30">
            <LogoIcon className="h-12 w-12 text-indigo-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Reviewer Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure access for ESP Amsterdam Reviewers only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-lg bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="name@espamsterdam.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="passcode" className="block text-sm font-semibold text-slate-300">
                Reviewer Passcode
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="passcode"
                  name="passcode"
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-800 rounded-lg bg-slate-950/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <LockClosedIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-55 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <span className="text-xs text-slate-500 flex items-center justify-center">
              <LockClosedIcon className="h-3.5 w-3.5 mr-1" /> Protected Review Environment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
