export const formatDateForInput = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

export interface MemberUser {
  _id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface MemberLike {
  user: MemberUser;
}

export const resolveAssignee = (
  assignee: any,
  members?: MemberLike[]
): MemberUser | null => {
  if (!assignee) return null;
  if (typeof assignee === 'object' && assignee._id) {
    return assignee as MemberUser;
  }
  if (typeof assignee === 'string') {
    if (members && Array.isArray(members)) {
      const found = members.find(m => m.user && m.user._id === assignee);
      if (found) return found.user;
    }
    return { _id: assignee, name: 'Assigned User', email: '', avatarUrl: '' };
  }
  return null;
};
