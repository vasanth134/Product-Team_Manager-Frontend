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
  Moon
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
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

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', name: 'Kanban Board', icon: Trello },
    { id: 'roadmap', name: 'Product Roadmap', icon: Milestone },
    { id: 'standups', name: 'Daily Standups', icon: CalendarDays },
    { id: 'chat', name: 'Team Chat', icon: MessageSquare },
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
    try {
      await inviteMember(inviteEmail);
      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
      }, 1500);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <aside className="w-64 glass-panel flex flex-col h-screen flex-shrink-0 z-20">
        
        {/* Brand Logo */}
        <div className="p-6 flex items-center gap-2 border-b border-slate-900">
          <div className="w-8 h-8 rounded-lg bg-gradient-indigo-purple flex items-center justify-center shadow-lg shadow-indigo-650/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight font-display text-white">Aether</span>
            <span className="text-[10px] block text-violet-400 font-bold -mt-1 tracking-widest">PRODUCTIVITY</span>
          </div>
        </div>

        {/* Team Switcher Dropdown */}
        <div className="p-4 border-b border-slate-900 relative">
          <button 
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 transition duration-150 text-left"
          >
            <div className="truncate">
              <span className="text-[10px] font-bold text-slate-500 block tracking-wider uppercase">Active Product Team</span>
              <span className="font-semibold text-sm text-slate-200 truncate block">
                {activeTeam ? activeTeam.name : 'No Teams Found'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${showTeamDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTeamDropdown && (
            <div className="absolute left-4 right-4 mt-2 py-1.5 rounded-xl bg-slate-950 border border-slate-850 shadow-2xl z-30">
              <div className="max-h-40 overflow-y-auto">
                {teams.map(t => (
                  <button
                    key={t._id}
                    onClick={() => {
                      setActiveTeam(t);
                      setShowTeamDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-indigo-950/40 transition duration-150 block truncate ${activeTeam?._id === t._id ? 'text-indigo-400 bg-indigo-950/20' : 'text-slate-300'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-900 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowTeamDropdown(false);
                    setShowCreateTeamModal(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-indigo-400 font-semibold hover:bg-indigo-950/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Team</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-150 ${isActive ? 'bg-indigo-650/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Team Directory Link */}
        {activeTeam && (
          <div className="px-4 py-3 border-t border-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1">
                <Users2 className="w-3 h-3 text-slate-650" />
                <span>Teammates ({activeTeam.members.length})</span>
              </span>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 transition"
                title="Invite Member"
              >
                <UserPlus className="w-3 h-3" />
              </button>
            </div>
            
            {/* Display first 4 members */}
            <div className="flex -space-x-2 overflow-hidden py-1">
              {activeTeam.members.slice(0, 5).map(m => (
                <img
                  key={m.user._id}
                  className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-slate-950"
                  src={m.user.avatarUrl}
                  alt={m.user.name}
                  title={`${m.user.name} (${m.role})`}
                />
              ))}
              {activeTeam.members.length > 5 && (
                <div className="inline-flex items-center justify-center h-6.5 w-6.5 rounded-full ring-2 ring-slate-950 bg-slate-900 text-[8px] font-bold text-slate-400">
                  +{activeTeam.members.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-900 flex items-center justify-between bg-slate-950/20">
          <div 
            onClick={() => setCurrentTab('profile')}
            className={`flex items-center gap-2 truncate cursor-pointer p-1.5 rounded-xl transition duration-150 flex-1 mr-1.5 ${currentTab === 'profile' ? 'bg-indigo-650/15 border border-indigo-500/20 text-indigo-400' : 'hover:bg-slate-900/30'}`}
            title="View Profile"
          >
            <img 
              src={user?.avatarUrl} 
              alt={user?.name} 
              className="w-8 h-8 rounded-lg bg-slate-900 object-cover flex-shrink-0"
            />
            <div className="truncate">
              <span className="font-semibold text-xs text-slate-200 block truncate leading-tight">{user?.name}</span>
              <span className="text-[9px] text-slate-550 block truncate leading-none mt-0.5">{user?.role || 'Developer'}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/15 transition duration-150 cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button 
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/15 transition duration-150 cursor-pointer"
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
          <div className="glass-card w-full max-w-md p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Create a New Product Team</h3>
              <button onClick={() => setShowCreateTeamModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {createTeamError && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-3">
                {createTeamError}
              </div>
            )}
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Nova App Core"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="What is this product team building?"
                  value={newTeamDesc}
                  rows={3}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-indigo-purple text-white font-medium hover:opacity-95 text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  {createTeamLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {inviteError && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-3">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-xs mb-3">
                Teammate invited successfully!
              </div>
            )}
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">User Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
                />
                <span className="text-[10px] text-slate-500 block leading-tight pt-1">
                  Note: An email with a login link will be sent to the user to join the team.
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || inviteSuccess}
                  className="px-4 py-2 rounded-xl bg-gradient-indigo-purple text-white font-medium hover:opacity-95 text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
