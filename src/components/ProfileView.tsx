import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { useTheme } from '../context/ThemeContext';
import { 
  User, 
  Mail, 
  Briefcase, 
  Shield, 
  KeyRound, 
  Users, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Shuffle,
  Laptop
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { teams } = useTeam();
  const { theme, toggleTheme } = useTheme();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'Developer');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rolesList = [
    'Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'Fullstack Developer',
    'UI/UX Designer',
    'Product Manager',
    'DevOps Engineer',
    'QA Engineer',
    'Data Scientist',
    'Team Lead',
    'Engineering Manager'
  ];

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    // Use bottts style from dicebear
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    setAvatarUrl(newAvatar);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = {
        name,
        email,
        role,
        avatarUrl
      };

      if (password) {
        updateData.password = password;
      }

      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#070A0F] transition-colors duration-250">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">User Profile</h2>
          <p className="text-xs text-slate-450 mt-1">
            Manage your personal data, system role, and security preferences.
          </p>
        </div>

        {/* Quick Theme Switcher in header too for ease of access */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={toggleTheme}
            className="glass px-3.5 py-2 rounded-xl border border-slate-800/80 bg-slate-950/20 text-slate-300 hover:text-indigo-400 transition flex items-center gap-2 text-xs font-medium cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Theme: {theme.toUpperCase()}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Avatar Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl overflow-hidden relative">
            {/* Header Banner */}
            <div className="h-28 bg-gradient-indigo-purple relative">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/30 backdrop-blur-md border border-white/10 uppercase tracking-widest">
                {role}
              </div>
            </div>

            {/* Avatar positioning */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
              <div className="-mt-14 mb-4 relative group">
                <img 
                  src={avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Aether'} 
                  alt={name}
                  className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-[#070A0F] shadow-xl object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <button
                  type="button"
                  onClick={handleRandomizeAvatar}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500/30 transition shadow-md cursor-pointer"
                  title="Randomize Avatar"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
              </div>

              <h3 className="font-bold text-lg text-white font-display">{name || 'Your Name'}</h3>
              <p className="text-xs text-slate-450 mt-0.5">{email || 'your-email@aether.io'}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-900/60 w-full flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">System Role</span>
                  <span className="font-semibold text-slate-350 bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-850">{role}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Active Teams</span>
                  <span className="font-semibold text-slate-350 bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-850">{teams.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Teams list & user role on those teams */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Workspace Teams & Roles</span>
            </h3>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              Your member roles within each active team space. Team roles dictate task creation, milestone setup, and chat management rights.
            </p>

            <div className="space-y-2.5 pt-2">
              {teams.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/20 rounded-xl border border-slate-900">
                  You are not a member of any teams yet.
                </div>
              ) : (
                teams.map(team => {
                  const myMemberObj = team.members.find(m => m.user._id === user?.id);
                  const myRole = myMemberObj ? myMemberObj.role : 'member';
                  
                  return (
                    <div 
                      key={team._id} 
                      className="p-3 flex items-center justify-between rounded-xl bg-slate-900/30 hover:bg-slate-900/50 border border-slate-850/80 transition duration-150"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-xs text-slate-200 block truncate">{team.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate mt-0.5">{team.description || 'No description'}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          myRole === 'owner' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : myRole === 'admin' 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : 'bg-slate-500/10 text-slate-400 border border-slate-800'
                        }`}>
                          {myRole}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gradient-indigo-purple h-full"></div>
            
            <h3 className="font-bold text-base text-white font-display flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Personal Workspace Settings</span>
            </h3>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-xs flex items-center gap-2.5 mb-6">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-xs flex items-center gap-2.5 mb-6">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Details Group */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. alex@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>Workspace Title / Primary Role</span>
                    </label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-950/80 cursor-pointer"
                    >
                      {rolesList.map(r => (
                        <option key={r} value={r} className="bg-slate-950 text-slate-200">
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>Avatar URL</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                        placeholder="Dicebear URL or public image link"
                        className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs truncate"
                      />
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-350 transition flex items-center justify-center flex-shrink-0 cursor-pointer"
                        title="Generate Random"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="border-t border-slate-900/60 pt-6 space-y-4">
                <h4 className="font-bold text-xs text-white font-display flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Update Password (Optional)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-900/60">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-gradient-indigo-purple text-white font-semibold hover:opacity-95 text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/20 disabled:opacity-50 cursor-pointer transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Profile Settings'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
