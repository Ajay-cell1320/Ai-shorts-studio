import React, { useState } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`https://magicshorts.onrender.com/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('studio_token', data.token);
      localStorage.setItem('studio_user', JSON.stringify(data.user));
      onSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1429] border border-slate-800 rounded-3xl p-6 max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-1">
          {mode === 'register' ? 'Create Studio Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">3 Free AI Video Credits included on signup</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="flex items-center bg-[#060814] border border-slate-800 rounded-xl px-3 py-2.5">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent text-sm text-white w-full focus:outline-none" required />
            </div>
          )}
          <div className="flex items-center bg-[#060814] border border-slate-800 rounded-xl px-3 py-2.5">
            <Mail className="w-4 h-4 text-slate-400 mr-2" />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-transparent text-sm text-white w-full focus:outline-none" required />
          </div>
          <div className="flex items-center bg-[#060814] border border-slate-800 rounded-xl px-3 py-2.5">
            <Lock className="w-4 h-4 text-slate-400 mr-2" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-transparent text-sm text-white w-full focus:outline-none" required />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            {loading ? 'Please wait...' : mode === 'register' ? 'Sign Up Free' : 'Sign In'}
          </button>
        </form>

        <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="mt-4 w-full text-center text-xs text-purple-400">
          {mode === 'register' ? 'Already have an account? Sign In' : 'Need an account? Sign Up Free'}
        </button>
      </div>
    </div>
  );
}
