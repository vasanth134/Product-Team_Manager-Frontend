import React, { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Users, 
  UserMinus, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  UserCheck, 
  RefreshCw,
  Shield
} from 'lucide-react';

export const TeamSettings: React.FC = () => {
  const { user } = useAuth();
  const { 
    activeTeam, 
    deleteTeam, 
    updateMemberRole, 
    removeMember, 
    fetchPendingInvites, 
    revokeInvite 
  } = useTeam();

  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // tracks user/invite id being processed
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Role validation helpers
  const myRecord = activeTeam?.members.find(m => m.user._id === user?.id);
  const isOwner = myRecord?.role === 'owner';
  const isAdmin = myRecord?.role === 'owner' || myRecord?.role === 'admin';

  const loadInvites = async () => {
    if (!activeTeam || !isAdmin) return;
    setLoadingInvites(true);
    try {
      const data = await fetchPendingInvites();
      setInvites(data);
    } catch (err: any) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [activeTeam]);

  const handleDeleteTeamClick = async () => {
    if (!activeTeam) return;
    const confirmName = window.prompt(
      `WARNING: This action is irreversible. All tasks, milestones, standup logs, and messages will be permanently deleted.\n\nPlease type "${activeTeam.name}" to confirm deletion:`
    );

    if (confirmName !== activeTeam.name) {
      alert('Verification team name did not match. Aborting.');
      return;
    }

    try {
      setErrorMessage(null);
      await deleteTeam(activeTeam._id);
      alert('Workspace successfully deleted.');
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete workspace');
    }
  };

  const handleRoleChange = async (targetUserId: string, currentRole: string) => {
    if (!activeTeam) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    setActionLoading(targetUserId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMemberRole(targetUserId, newRole);
      setSuccessMessage('Member role updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update member role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!activeTeam) return;
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the workspace?`)) return;

    setActionLoading(targetUserId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await removeMember(targetUserId);
      setSuccessMessage(`${targetName} removed from workspace`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    if (!activeTeam) return;
    if (!window.confirm(`Revoke invitation sent to ${email}?`)) return;

    setActionLoading(inviteId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await revokeInvite(inviteId);
      setInvites(prev => prev.filter(inv => inv._id !== inviteId));
      setSuccessMessage('Invitation revoked successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revoke invite');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLink = (inviteId: string, token: string) => {
    const clientUrl = window.location.origin;
    const inviteLink = `${clientUrl}/?inviteToken=${token}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInviteId(inviteId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  if (!activeTeam) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
        Please select or create a team first.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-app relative">
      {/* Background glow overlay */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-app pb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Workspace Settings</h2>
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-250 text-xs font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-450 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* TEAM MEMBER MANAGEMENT SECTION */}
      <section className="glass-card p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-900/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-display">Teammate Management</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Control roles and access levels of active members</p>
            </div>
          </div>
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px] tracking-wider pb-2">
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950/50">
              {activeTeam.members.map(member => {
                const targetUser = member.user;
                const isTargetOwner = member.role === 'owner';
                const isTargetSelf = targetUser._id === user?.id;

                // Authorization flags
                const canChangeRole = isAdmin && !isTargetOwner && !isTargetSelf && (isOwner || member.role !== 'admin');
                const canRemove = isAdmin && !isTargetOwner && !isTargetSelf && (isOwner || member.role !== 'admin');

                return (
                  <tr key={targetUser._id} className="hover:bg-slate-950/20 transition-colors">
                    {/* User profile */}
                    <td className="py-3 px-3 flex items-center gap-2.5">
                      <img 
                        src={targetUser.avatarUrl} 
                        alt={targetUser.name} 
                        className="w-7 h-7 rounded-xl object-cover border border-app bg-slate-900"
                      />
                      <div>
                        <span className="font-bold text-slate-200 block">{targetUser.name}</span>
                        {isTargetSelf && (
                          <span className="text-[8px] bg-slate-900 text-slate-450 border border-slate-800 rounded px-1.5 py-0.5 mt-0.5 inline-block font-semibold">You</span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{targetUser.email}</td>

                    {/* Role badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
                        member.role === 'owner' 
                          ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' 
                          : member.role === 'admin' 
                            ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40' 
                            : 'bg-slate-900/40 text-slate-400 border-slate-800/80'
                      }`}>
                        {member.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canChangeRole && (
                          <button
                            onClick={() => handleRoleChange(targetUser._id, member.role)}
                            disabled={actionLoading === targetUser._id}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-855 hover:border-slate-700 bg-slate-900/20 text-slate-355 hover:text-white transition text-[10px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <Shield className="w-3 h-3 text-indigo-455" />
                            <span>{member.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}</span>
                          </button>
                        )}
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(targetUser._id, targetUser.name)}
                            disabled={actionLoading === targetUser._id}
                            className="p-1.5 rounded-lg border border-slate-855 hover:border-red-900 text-slate-500 hover:text-red-400 bg-slate-900/10 transition cursor-pointer disabled:opacity-50"
                            title="Remove Member"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!canChangeRole && !canRemove && (
                          <span className="text-[10px] text-slate-600 font-semibold tracking-wide flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-700" /> Managed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Cards Layout */}
        <div className="md:hidden space-y-4">
          {activeTeam.members.map(member => {
            const targetUser = member.user;
            const isTargetOwner = member.role === 'owner';
            const isTargetSelf = targetUser._id === user?.id;

            // Authorization flags
            const canChangeRole = isAdmin && !isTargetOwner && !isTargetSelf && (isOwner || member.role !== 'admin');
            const canRemove = isAdmin && !isTargetOwner && !isTargetSelf && (isOwner || member.role !== 'admin');

            return (
              <div key={targetUser._id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-3 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img 
                      src={targetUser.avatarUrl} 
                      alt={targetUser.name} 
                      className="w-9 h-9 rounded-xl object-cover border border-app bg-slate-900 flex-shrink-0"
                    />
                    <div className="truncate min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200 text-sm truncate">{targetUser.name}</span>
                        {isTargetSelf && (
                          <span className="text-[8px] bg-slate-900 text-slate-450 border border-slate-800 rounded px-1.5 py-0.5 font-semibold flex-shrink-0">You</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{targetUser.email}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border block ${
                      member.role === 'owner' 
                        ? 'bg-amber-950/30 text-amber-400 border-amber-900/40' 
                        : member.role === 'admin' 
                          ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40' 
                          : 'bg-slate-900/40 text-slate-400 border-slate-800/80'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>

                {(canChangeRole || canRemove) && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900/30">
                    {canChangeRole && (
                      <button
                        onClick={() => handleRoleChange(targetUser._id, member.role)}
                        disabled={actionLoading === targetUser._id}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/20 text-slate-350 hover:text-white transition text-[10px] font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3 text-indigo-450" />
                        <span>{member.role === 'admin' ? 'Demote' : 'Promote to Admin'}</span>
                      </button>
                    )}
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(targetUser._id, targetUser.name)}
                        disabled={actionLoading === targetUser._id}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-red-900 text-slate-500 hover:text-red-400 bg-slate-900/10 transition cursor-pointer disabled:opacity-50"
                        title="Remove Member"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                {!canChangeRole && !canRemove && (
                  <div className="flex items-center justify-end pt-2 border-t border-slate-900/30 text-[9px] text-slate-500 font-semibold tracking-wide gap-1">
                    <Lock className="w-3 h-3 text-slate-650" /> Workspace Managed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* PENDING INVITATIONS SECTION */}
      {isAdmin && (
        <section className="glass-card p-6 rounded-xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <RefreshCw className={`w-4 h-4 ${loadingInvites ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white font-display">Pending Invitations</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Invites sent that haven't been accepted yet</p>
              </div>
            </div>
          </div>

          {loadingInvites ? (
            <div className="text-center py-6 text-slate-500 text-xs">Loading invitation logs...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-855 rounded-2xl">
              No pending invitations for this team.
            </div>
          ) : (
            <>
              {/* Desktop View: Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase text-[9px] tracking-wider pb-2">
                      <th className="py-2.5 px-3">Invited Email</th>
                      <th className="py-2.5 px-3">Assigned Role</th>
                      <th className="py-2.5 px-3">Invited By</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950/50">
                    {invites.map(invite => (
                      <tr key={invite._id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="py-3 px-3 text-slate-350 font-bold font-mono text-[11px]">{invite.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
                            invite.role === 'admin' 
                              ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40' 
                              : 'bg-slate-900/40 text-slate-400 border-slate-800/80'
                          }`}>
                            {invite.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-450">{invite.invitedBy?.name || 'Unknown'}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleCopyLink(invite._id, invite.token)}
                              className="p-1.5 rounded-lg border border-slate-855 hover:border-indigo-900 text-slate-500 hover:text-indigo-400 bg-slate-900/10 transition cursor-pointer"
                              title="Copy Invitation Link"
                            >
                              {copiedInviteId === invite._id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-450" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRevokeInvite(invite._id, invite.email)}
                              disabled={actionLoading === invite._id}
                              className="p-1.5 rounded-lg border border-slate-855 hover:border-red-900 text-slate-500 hover:text-red-400 bg-slate-900/10 transition cursor-pointer disabled:opacity-50"
                              title="Revoke Invitation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards Layout */}
              <div className="md:hidden space-y-4">
                {invites.map(invite => (
                  <div key={invite._id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-3 shadow-inner">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-200 block truncate">{invite.email}</span>
                        <span className="text-[10px] text-slate-550 block mt-0.5">Invited by: {invite.invitedBy?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border block ${
                          invite.role === 'admin' 
                            ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900/40' 
                            : 'bg-slate-900/40 text-slate-400 border-slate-800/80'
                        }`}>
                          {invite.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900/30">
                      <button
                        onClick={() => handleCopyLink(invite._id, invite.token)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-indigo-900 text-slate-400 hover:text-indigo-400 bg-slate-900/10 transition cursor-pointer"
                        title="Copy Invitation Link"
                      >
                        {copiedInviteId === invite._id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-450" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRevokeInvite(invite._id, invite.email)}
                        disabled={actionLoading === invite._id}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-red-900 text-slate-500 hover:text-red-400 bg-slate-900/10 transition cursor-pointer disabled:opacity-50"
                        title="Revoke Invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* DANGER ZONE (DELETE TEAM) */}
      {isOwner && (
        <section className="glass-card p-6 rounded-xl border border-red-900/20 bg-red-950/5 space-y-6">
          <div className="flex justify-between items-center border-b border-red-900/15 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-400 font-display">Danger Zone</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Destructive operations for the workspace owner</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/30 p-4 rounded-2xl border border-red-900/10">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200 block">Delete This Workspace</span>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xl">
                This deletes the team workspace record permanently, including all tasks, messages, roadmaps, and daily logs. All members will be disconnected instantly.
              </p>
            </div>
            <button
              onClick={handleDeleteTeamClick}
              className="px-4.5 py-2.5 rounded-xl bg-red-655 hover:bg-red-655/90 text-white font-bold text-xs transition duration-150 cursor-pointer shadow-lg shadow-red-955/20 flex items-center gap-1.5 self-start md:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Workspace</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
