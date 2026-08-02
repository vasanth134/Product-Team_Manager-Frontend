import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Trello, 
  Milestone, 
  CalendarDays, 
  Plus, 
  UserPlus, 
  LogOut, 
  ChevronDown, 
  Users2,
  Sparkles,
  X,
  MessageSquare,
  Sun,
  Moon,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpenOnMobile, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { teams, activeTeam, setActiveTeam, createTeam, inviteMember } = useTeam();
  const { theme, toggleTheme } = useTheme();
  
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Create Team states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [createTeamLoading, setCreateTeamLoading] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const userMemberRecord = activeTeam?.members.find(m => m.user._id === user?.id);
  const isTeamAdmin = userMemberRecord?.role === 'owner' || userMemberRecord?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', name: 'Workspace Dashboard', icon: LayoutDashboard },
    { id: 'kanban', name: 'Kanban Board', icon: Trello },
    { id: 'roadmap', name: 'Product Roadmap', icon: Milestone },
    { id: 'standups', name: 'Daily Standups', icon: CalendarDays },
    { id: 'chat', name: 'Team Rooms', icon: MessageSquare },
    ...(isTeamAdmin ? [{ id: 'settings', name: 'Workspace Settings', icon: Settings }] : []),
  ];

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreateTeamLoading(true);
    setCreateTeamError(null);
    try {
      await createTeam(newTeamName, newTeamDesc);
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateTeamModal(false);
    } catch (err: any) {
      setCreateTeamError(err.message || 'Failed to create team');
    } finally {
      setCreateTeamLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    setGeneratedInviteLink(null);
    try {
      const data = await inviteMember(inviteEmail);
      setInviteEmail('');
      setInviteSuccess(true);
      if (data && data.inviteLink) {
        setGeneratedInviteLink(data.inviteLink);
      } else {
        setTimeout(() => {
          setInviteSuccess(false);
          setShowInviteModal(false);
        }, 1500);
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <aside className={`w-64 glass-panel flex flex-col h-screen flex-shrink-0 z-50 border-r border-slate-900/50 fixed md:relative transition-transform duration-300 ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand Logo with dynamic glow */}
        <div className="p-6 flex items-center justify-between border-b border-slate-900/50 relative overflow-hidden group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-indigo-purple flex items-center justify-center shadow-lg shadow-indigo-650/20 group-hover:rotate-6 transition duration-300">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight font-display text-white">Aether</span>
              <span className="text-[9px] block text-indigo-400 font-extrabold tracking-widest uppercase">WORKSPACE</span>
            </div>
          </div>
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-xl bg-slate-950/50 border border-slate-900 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Team Switcher Dropdown - Upgraded visual details */}
        <div className="p-4 border-b border-slate-900/50 relative">
          <button 
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/45 hover:bg-slate-900/50 border border-slate-900 transition duration-150 text-left cursor-pointer"
          >
            <div className="truncate pr-2">
              <span className="text-[8px] font-black text-slate-500 block tracking-widest uppercase mb-0.5">Active Product Team</span>
              <span className="font-semibold text-xs text-slate-200 truncate block">
                {activeTeam ? activeTeam.name : 'No Teams Found'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-250 ${showTeamDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTeamDropdown && (
            <div className="absolute left-4 right-4 mt-2 py-1.5 rounded-xl bg-app-card border border-slate-900 shadow-2xl z-30 backdrop-blur-xl">
              <div className="max-h-40 overflow-y-auto">
                {teams.map(t => (
                  <button
                    key={t._id}
                    onClick={() => {
                      setActiveTeam(t);
                      setShowTeamDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-indigo-950/20 transition duration-150 block truncate ${activeTeam?._id === t._id ? 'text-indigo-400 bg-indigo-950/15' : 'text-slate-350'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-900/80 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowTeamDropdown(false);
                    setShowCreateTeamModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-400 font-bold hover:bg-indigo-950/15 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Navigation - With subtle vertical indicator */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="w-[3px] h-3.5 rounded-full bg-indigo-500/90 absolute right-0"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Team Directory Link - Enforced squircle avatars */}
        {activeTeam && (
          <div className="px-4 py-4 border-t border-slate-900/50 bg-slate-950/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-slate-650" />
                <span>Teammates ({activeTeam.members.length})</span>
              </span>
              <button 
                onClick={() => {
                  setGeneratedInviteLink(null);
                  setInviteSuccess(false);
                  setInviteError(null);
                  setShowInviteModal(true);
                }}
                className="p-1 rounded-lg bg-slate-950 border border-slate-900 text-indigo-450 hover:text-indigo-400 transition cursor-pointer"
                title="Invite Member"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Squircles instead of standard circles */}
            <div className="flex -space-x-1.5 overflow-hidden py-1">
              {activeTeam.members.slice(0, 5).map(m => (
                <img
                  key={m.user._id}
                  className="inline-block h-6.5 w-6.5 rounded-lg ring-2 ring-[#05070B] object-cover bg-slate-800"
                  src={m.user.avatarUrl}
                  alt={m.user.name}
                  title={`${m.user.name} (${m.role})`}
                />
              ))}
              {activeTeam.members.length > 5 && (
                <div className="inline-flex items-center justify-center h-6.5 w-6.5 rounded-lg ring-2 ring-[#05070B] bg-slate-950 border border-slate-900 text-[8px] font-black text-slate-500">
                  +{activeTeam.members.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Card & Logout controls */}
        <div className="p-4 border-t border-slate-900/50 flex items-center justify-between bg-slate-950/15">
          <div 
            onClick={() => setCurrentTab('profile')}
            className={`flex items-center gap-2.5 truncate cursor-pointer p-1.5 rounded-xl transition duration-150 flex-1 mr-1.5 ${
              currentTab === 'profile' 
                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' 
                : 'hover:bg-slate-900/30'
            }`}
            title="View Profile"
          >
            <img 
              src={user?.avatarUrl} 
              alt={user?.name} 
              className="w-7.5 h-7.5 rounded-xl bg-slate-900 border border-white/5 object-cover flex-shrink-0"
            />
            <div className="truncate">
              <span className="font-bold text-xs text-slate-200 block truncate leading-tight">{user?.name}</span>
              <span className="text-[9px] text-slate-550 block truncate leading-none mt-0.5 uppercase tracking-wider font-semibold">
                {user?.role || 'Developer'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition duration-150 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-450 hover:bg-red-500/10 transition duration-150 cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900">
              <h3 className="font-bold text-base text-white font-display">Create Workspace</h3>
              <button onClick={() => setShowCreateTeamModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {createTeamError && (
              <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-3 font-semibold">
                {createTeamError}
              </div>
            )}
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Nova App Core"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Mission Description</label>
                <textarea
                  placeholder="What is this product team building?"
                  value={newTeamDesc}
                  rows={3}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-900/50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 text-xs cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {createTeamLoading ? 'Creating...' : 'Initialize Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900">
              <h3 className="font-bold text-base text-white font-display">Invite Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {inviteError && (
              <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-3 font-semibold">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-250 text-xs mb-3 font-semibold animate-pulse">
                Teammate invited successfully!
              </div>
            )}
            {generatedInviteLink ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-indigo-200 text-xs">
                  <p className="font-bold mb-1">Invitation Link Created:</p>
                  <p className="text-slate-400 break-all select-all font-mono p-2 bg-slate-950/80 rounded border border-slate-900 mt-2">{generatedInviteLink}</p>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-900/50">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      alert('Invitation link copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs cursor-pointer"
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedInviteLink(null);
                      setInviteSuccess(false);
                      setShowInviteModal(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 text-xs cursor-pointer font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">User Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                  <span className="text-[9px] text-slate-500 block leading-relaxed pt-1.5 font-medium">
                    An invitation message with a secure link will be sent to the user to join the workspace.
                  </span>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-900/50 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 text-xs cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
