import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Kanban } from './components/Kanban';
import { Roadmap } from './components/Roadmap';
import { Standups } from './components/Standups';
import { Chat } from './components/Chat';
import { ProfileView } from './components/ProfileView';
import { Sparkles, FolderKanban } from 'lucide-react';

const WorkspaceContainer: React.FC = () => {
  const { teams, createTeam } = useTeam();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createTeam(newTeamName, newTeamDesc);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize first team');
    } finally {
      setLoading(false);
    }
  };

  // 1. Teamless Onboarding Setup Screen
  if (teams.length === 0) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#05080E] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-slate-800/80 mb-2 bg-slate-950/40">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300 tracking-wider font-display">AETHER PRODUCT TEAM ONBOARDING</span>
          </div>

          <div className="glass-card p-8 rounded-2xl text-left space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-900/40 rounded-xl flex items-center justify-center mx-auto mb-2 text-indigo-400">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white font-display">Create Your First Team</h3>
              <p className="text-xs text-slate-450">
                To start managing tasks and roadmap milestones, initialize a product workspace first.
              </p>
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleInitialTeamSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Workspace / Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Web Platform"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Describe your product mission..."
                  value={newTeamDesc}
                  rows={3}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-gradient-indigo-purple hover:opacity-95 text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Initializing Workspace...' : 'Initialize Product Workspace'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Tab Router
  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'kanban':
        return <Kanban />;
      case 'roadmap':
        return <Roadmap />;
      case 'standups':
        return <Standups />;
      case 'chat':
        return <Chat />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F]">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  );
};

const InviteAcceptor: React.FC<{
  inviteToken: string;
  inviteDetails: any;
  onClearInvite: () => void;
  children: React.ReactNode;
}> = ({ inviteToken, inviteDetails, onClearInvite, children }) => {
  const { user, logout } = useAuth();
  const { fetchTeams, setActiveTeam } = useTeam();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const acceptInvitation = async () => {
      if (!user) return;
      if (user.email.toLowerCase() !== inviteDetails.email.toLowerCase()) {
        setError(`This invitation was sent to ${inviteDetails.email}, but you are logged in as ${user.email}.`);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const storedToken = localStorage.getItem('aether_token') || 'bypass_token';
        const response = await fetch(`${API_BASE_URL}/teams/invites/accept`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
          },
          body: JSON.stringify({ token: inviteToken }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to accept invitation');
        }

        // Refresh teams list
        await fetchTeams();
        
        // Select the new team as active
        if (data && data._id) {
          setActiveTeam(data);
        }

        setSuccess(true);
        // Clear token from query params and memory after 2 seconds
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('inviteToken');
          window.history.replaceState({}, '', url.toString());
          onClearInvite();
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Failed to accept invitation');
      } finally {
        setLoading(false);
      }
    };

    acceptInvitation();
  }, [inviteToken, inviteDetails, user, fetchTeams, setActiveTeam, onClearInvite]);

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#05080E]">
        <div className="w-full max-w-md glass-card p-8 rounded-2xl text-center space-y-6">
          <div className="text-red-400 font-bold text-lg font-display">Invitation Error</div>
          <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
          <div className="flex gap-4 pt-2">
            <button
              onClick={logout}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 text-xs transition cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('inviteToken');
                window.history.replaceState({}, '', url.toString());
                onClearInvite();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-350 bg-slate-800 hover:bg-slate-700 text-xs transition cursor-pointer"
            >
              Ignore & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#05080E] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium">Joining team {inviteDetails.teamName}...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen w-screen bg-[#05080E] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400 text-xl font-bold">✓</div>
          <p className="text-xs text-slate-300 font-medium font-display">Successfully joined {inviteDetails.teamName}!</p>
          <p className="text-[10px] text-slate-400">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  // Check URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('inviteToken');
    if (token) {
      setInviteToken(token);
      fetchInviteDetails(token);
    }
  }, []);

  const fetchInviteDetails = async (token: string) => {
    setInviteLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teams/invites/details/${token}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invite details');
      }
      setInviteDetails(data);
    } catch (err: any) {
      console.error(err.message || 'Invitation is invalid or expired.');
      setInviteToken(null);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleClearInvite = () => {
    setInviteToken(null);
    setInviteDetails(null);
  };

  if (loading || inviteLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#05080E] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium">
            {inviteLoading ? 'Fetching invitation details...' : 'Booting Aether Productivity Workspace...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen inviteDetails={inviteDetails} />;
  }

  if (inviteToken && inviteDetails) {
    return (
      <TeamProvider>
        <InviteAcceptor
          inviteToken={inviteToken}
          inviteDetails={inviteDetails}
          onClearInvite={handleClearInvite}
        >
          <WorkspaceContainer />
        </InviteAcceptor>
      </TeamProvider>
    );
  }

  return (
    <TeamProvider>
      <WorkspaceContainer />
    </TeamProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
