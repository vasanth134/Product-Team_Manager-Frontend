import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  inviteDetails?: {
    email: string;
    teamName: string;
    inviterName: string;
    teamDescription?: string;
  } | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ inviteDetails }) => {
  const { login, signup, loginWithGoogle, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(inviteDetails?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Google Mock States
  const [showMockGoogle, setShowMockGoogle] = useState(false);
  const [mockGoogleEmail, setMockGoogleEmail] = useState(inviteDetails?.email || '');
  const [mockGoogleName, setMockGoogleName] = useState('');
  const [devEmails, setDevEmails] = useState<any[]>([]);

  // Update email fields when invitation updates
  useEffect(() => {
    if (inviteDetails?.email) {
      setEmail(inviteDetails.email);
      setMockGoogleEmail(inviteDetails.email);
    }
  }, [inviteDetails]);

  // Load dev emails to simulate receiving email inbox
  const fetchDevEmails = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/dev/emails');
      if (res.ok) {
        const data = await res.json();
        setDevEmails(data);
      }
    } catch (err) {
      console.error('Failed to load dev emails:', err);
    }
  };

  useEffect(() => {
    // Poll dev emails in local environment for quick updates
    fetchDevEmails();
    const interval = setInterval(fetchDevEmails, 4000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically load Google OAuth GIS script if configured
  useEffect(() => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            setLoading(true);
            try {
              await loginWithGoogle(response.credential);
            } catch (err: any) {
              setLocalError(err.message || 'Google authentication failed');
            } finally {
              setLoading(false);
            }
          }
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [loginWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (!isLogin && !name) {
      setLocalError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockGoogleEmail) return;
    setLoading(true);
    setLocalError(null);
    clearError();
    try {
      const mockCredential = `mock_google_jwt_${Math.random().toString(36).substring(7)}`;
      await loginWithGoogle(mockCredential, mockGoogleName || 'Mock Google User', mockGoogleEmail);
    } catch (err: any) {
      setLocalError(err.message || 'Mock Google login failed');
    } finally {
      setLoading(false);
      setShowMockGoogle(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setLocalError(null);
    clearError();
    setName('');
    // Only clear email if there is no active invitation
    if (!inviteDetails) {
      setEmail('');
    }
    setPassword('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#05080E] overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-slate-800/80 mb-4 bg-slate-950/40">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300 tracking-wider font-display">AETHER PRODUCT SUITE</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight font-display text-white mb-2">
            Welcome to <span className="text-gradient font-black">Aether</span>
          </h1>
          <p className="text-sm text-slate-400">
            {isLogin 
              ? 'Align your product teams, track roadmaps, and sync asynchronously.' 
              : 'Setup your workspace and collaborate with your team for free.'}
          </p>
        </div>

        {/* Invitation Context Banner */}
        {inviteDetails && (
          <div className="mb-6 p-4 rounded-xl border border-indigo-900/40 bg-indigo-950/20 text-left space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 text-[9px] font-bold tracking-wide uppercase border border-indigo-500/20">Invitation Active</span>
            </div>
            <p className="text-xs text-slate-300">
              <strong>{inviteDetails.inviterName}</strong> has invited you to join the team "<strong>{inviteDetails.teamName}</strong>" on Aether.
            </p>
            {inviteDetails.teamDescription && (
              <p className="text-[11px] text-slate-400 italic">"{inviteDetails.teamDescription}"</p>
            )}
            <p className="text-[10px] text-indigo-400">
              Please register or sign in with <strong>{inviteDetails.email}</strong> to join this team.
            </p>
          </div>
        )}

        {/* Card Frame */}
        <div className="glass-card p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Display error logs */}
            {(localError || error) && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-950/30 border border-red-900/50 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!inviteDetails}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm disabled:opacity-80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-indigo-purple hover:opacity-95 active:scale-[0.99] transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm shadow-lg shadow-indigo-650/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google Authentication Button */}
          <div className="mt-4 space-y-4">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800/80"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest">or continue with</span>
              <div className="flex-grow border-t border-slate-800/80"></div>
            </div>

            <button
              type="button"
              onClick={() => {
                const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
                if (clientId && (window as any).google) {
                  try {
                    (window as any).google.accounts.id.prompt();
                  } catch (err) {
                    console.error('Google One Tap prompt failed:', err);
                    setShowMockGoogle(true);
                  }
                } else {
                  setShowMockGoogle(true);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-slate-700 text-slate-300 font-medium text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38C17,15.86,14.86,17,12,17c-3.15,0-5.7-2.55-5.7-5.7s2.55-5.7,5.7-5.7a5.57,5.57,0,0,1,3.87,1.53l2.07-2A8.61,8.61,0,0,0,12,2.3c-5,0-9,4-9,9s4,9,9,9c5,0,8.75-3.5,8.75-8.75A7.3,7.3,0,0,0,21.35,11.1Z" fill="#E2E8F0"></path>
                </g>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Toggle Button */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-xs text-slate-400 hover:text-indigo-400 transition"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>

          {/* Simulated Developer Email Box */}
          {devEmails.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Dev Mailbox (Simulated)</span>
                <span className="text-[9px] text-slate-500 font-mono">localhost testing</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {devEmails.map((emailItem) => (
                  <div key={emailItem.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-semibold text-slate-350">To: {emailItem.to}</span>
                      <span>{new Date(emailItem.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 font-mono text-[10px] truncate">{emailItem.subject}</p>
                    <a
                      href={emailItem.link}
                      className="inline-block mt-1 text-xs text-indigo-400 hover:text-indigo-350 underline font-medium"
                    >
                      Click here to simulate joining
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mock Google Login Modal */}
      {showMockGoogle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card p-6 rounded-2xl space-y-4 border border-slate-800">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white font-display">Sign In with Google (Mock Mode)</h3>
              <p className="text-[11px] text-slate-400">
                Google Client ID is not configured. Simulating OAuth 2.0 flow.
              </p>
            </div>
            <form onSubmit={handleGoogleMockSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Google User Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={mockGoogleName}
                  onChange={(e) => setMockGoogleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                />
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Google Email Address</label>
                <input
                  type="email"
                  required
                  readOnly={!!inviteDetails}
                  placeholder="name@gmail.com"
                  value={mockGoogleEmail}
                  onChange={(e) => setMockGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs disabled:opacity-85"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMockGoogle(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-800 text-slate-300 text-xs hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-medium text-xs transition cursor-pointer"
                >
                  Simulate OAuth
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
