import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, API_BASE_URL } from './AuthContext';

export interface Member {
  user: {
    _id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  role: 'owner' | 'admin' | 'member';
}

export interface TeamType {
  _id: string;
  name: string;
  description: string;
  owner: string;
  members: Member[];
  createdAt: string;
}

export interface TaskType {
  _id: string;
  teamId: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl: string;
  } | null;
  milestoneId?: {
    _id: string;
    title: string;
    status: string;
  } | null;
  storyPoints: number;
  dueDate?: string | null;
  updatedAt: string;
}

export interface MilestoneType {
  _id: string;
  teamId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
}

export interface StandupType {
  _id: string;
  teamId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl: string;
  };
  yesterday: string;
  today: string;
  blockers: string;
  date: string;
  createdAt: string;
}

export interface AnalyticsType {
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    totalPoints: number;
    completedPoints: number;
    pointsCompletionRate: number;
  };
  statusCounts: {
    backlog: number;
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  priorityCounts: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  workload: {
    userId: string;
    name: string;
    avatarUrl: string;
    openTasks: number;
    completedTasks: number;
    pointsAssigned: number;
  }[];
  milestones: {
    id: string;
    title: string;
    status: string;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  }[];
  standupsToday: {
    submitted: number;
    total: number;
    percentage: number;
  };
}

interface TeamContextType {
  teams: TeamType[];
  activeTeam: TeamType | null;
  tasks: TaskType[];
  milestones: MilestoneType[];
  standups: StandupType[];
  analytics: AnalyticsType | null;
  loading: boolean;
  selectedDate: string;
  setActiveTeam: (team: TeamType) => void;
  setSelectedDate: (date: string) => void;
  fetchTeams: () => Promise<void>;
  createTeam: (name: string, description: string) => Promise<TeamType>;
  inviteMember: (email: string) => Promise<any>;
  deleteTeam: (teamId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  fetchPendingInvites: () => Promise<any[]>;
  revokeInvite: (inviteId: string) => Promise<void>;
  createTask: (task: any) => Promise<void>;
  updateTask: (taskId: string, updates: any) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createMilestone: (milestone: any) => Promise<void>;
  updateMilestone: (id: string, updates: any) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  submitStandup: (yesterday: string, today: string, blockers: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [activeTeam, setActiveTeamState] = useState<TeamType | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [milestones, setMilestones] = useState<MilestoneType[]>([]);
  const [standups, setStandups] = useState<StandupType[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Use a ref so headers() is always stable — never causes dependency chain re-renders
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokenRef.current}`,
  }), []); // stable — reads from ref, no token dependency

  const fetchTeams = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      const res = await fetch(`${API_BASE_URL}/teams`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0) {
          // Restore saved active team or default to first
          const savedId = localStorage.getItem('aether_active_team_id');
          const match = savedId ? data.find((t: TeamType) => t._id === savedId) : null;
          setActiveTeamState(match || data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }, [token]); // only depend on token — not activeTeam

  // Handle active team selection & sync with storage
  const setActiveTeam = (team: TeamType) => {
    setActiveTeamState(team);
    localStorage.setItem('aether_active_team_id', team._id);
  };

  const createTeam = async (name: string, description: string): Promise<TeamType> => {
    const res = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create team');
    
    setTeams(prev => [...prev, data]);
    setActiveTeam(data);
    return data;
  };

  const inviteMember = async (email: string) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/teams/${activeTeam._id}/invite`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to invite member');
    
    // Update active team in UI state
    setTeams(prev => prev.map(t => t._id === activeTeam._id ? data.team : t));
    setActiveTeamState(data.team);
    return data;
  };

  const deleteTeam = async (teamId: string) => {
    const res = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete team');

    // Remove from teams list
    setTeams(prev => prev.filter(t => t._id !== teamId));
    if (activeTeam?._id === teamId) {
      const remaining = teams.filter(t => t._id !== teamId);
      setActiveTeamState(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const updateMemberRole = async (userId: string, role: 'admin' | 'member') => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/teams/${activeTeam._id}/members/${userId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update member role');

    setTeams(prev => prev.map(t => t._id === activeTeam._id ? data : t));
    setActiveTeamState(data);
  };

  const removeMember = async (userId: string) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/teams/${activeTeam._id}/members/${userId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member');

    setTeams(prev => prev.map(t => t._id === activeTeam._id ? data : t));
    setActiveTeamState(data);
  };

  const fetchPendingInvites = async () => {
    if (!activeTeam) return [];
    const res = await fetch(`${API_BASE_URL}/teams/${activeTeam._id}/invites`, {
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to fetch invites');
    }
    return res.json();
  };

  const revokeInvite = async (inviteId: string) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/teams/${activeTeam._id}/invites/${inviteId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke invite');
  };

  const fetchTasks = useCallback(async () => {
    if (!activeTeam || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tasks?teamId=${activeTeam._id}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [activeTeam, token]); // removed headers — stable ref-based function

  const createTask = async (taskData: any) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ...taskData, teamId: activeTeam._id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create task');
    
    setTasks(prev => [data, ...prev]);
    // Refresh analytics in background
    fetchAnalytics();
  };

  const updateTask = async (taskId: string, updates: any) => {
    if (!activeTeam) return;
    
    // Optimistic update for fluid UI response across all field edits
    const originalTasks = [...tasks];
    const optimisticUpdates = { ...updates };

    if (updates.assignee !== undefined) {
      if (typeof updates.assignee === 'string') {
        const member = activeTeam.members.find(m => m.user && m.user._id === updates.assignee);
        optimisticUpdates.assignee = member ? member.user : { _id: updates.assignee, name: 'Assigned User', email: '', avatarUrl: '' };
      }
    }

    if (updates.milestoneId !== undefined) {
      if (updates.milestoneId === null) {
        optimisticUpdates.milestoneId = null;
      } else if (typeof updates.milestoneId === 'string') {
        const milestone = milestones.find(m => m._id === updates.milestoneId);
        optimisticUpdates.milestoneId = milestone ? { _id: milestone._id, title: milestone.title, status: milestone.status } : null;
      }
    }

    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...optimisticUpdates } : t));

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      
      setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      fetchAnalytics();
    } catch (err) {
      // Revert on error
      setTasks(originalTasks);
      throw err;
    }
  };

  const deleteTask = async (taskId: string) => {
    const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete task');
    }
    setTasks(prev => prev.filter(t => t._id !== taskId));
    fetchAnalytics();
  };

  const fetchMilestones = useCallback(async () => {
    if (!activeTeam || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/milestones?teamId=${activeTeam._id}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setMilestones(data);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    }
  }, [activeTeam, token]); // removed headers

  const createMilestone = async (milestoneData: any) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/milestones`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ ...milestoneData, teamId: activeTeam._id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create milestone');
    
    setMilestones(prev => [...prev, data].sort((a, b) => a.startDate.localeCompare(b.startDate)));
    fetchAnalytics();
  };

  const updateMilestone = async (id: string, updates: any) => {
    const res = await fetch(`${API_BASE_URL}/milestones/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update milestone');
    
    setMilestones(prev => prev.map(m => m._id === id ? data : m).sort((a, b) => a.startDate.localeCompare(b.startDate)));
    fetchAnalytics();
  };

  const deleteMilestone = async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/milestones/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete milestone');
    }
    setMilestones(prev => prev.filter(m => m._id !== id));
    fetchAnalytics();
  };

  const fetchStandups = useCallback(async (dateStr: string) => {
    if (!activeTeam || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/standups?teamId=${activeTeam._id}&date=${dateStr}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setStandups(data);
      }
    } catch (err) {
      console.error('Error fetching standups:', err);
    }
  }, [activeTeam, token]); // removed headers

  const submitStandup = async (yesterday: string, today: string, blockers: string) => {
    if (!activeTeam) return;
    const res = await fetch(`${API_BASE_URL}/standups`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        teamId: activeTeam._id,
        yesterday,
        today,
        blockers,
        date: selectedDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit standup');
    
    setStandups(prev => {
      const index = prev.findIndex(s => s.userId._id === user?.id);
      if (index !== -1) {
        return prev.map(s => s.userId._id === user?.id ? data : s);
      }
      return [data, ...prev];
    });
    fetchAnalytics();
  };

  const fetchAnalytics = useCallback(async () => {
    if (!activeTeam || !token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/analytics?teamId=${activeTeam._id}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [activeTeam, token]); // removed headers

  const refreshAllData = useCallback(async () => {
    if (!activeTeam) return;
    setLoading(true);
    await Promise.all([
      fetchTasks(),
      fetchMilestones(),
      fetchStandups(selectedDate),
      fetchAnalytics(),
    ]);
    setLoading(false);
  }, [activeTeam, selectedDate, fetchTasks, fetchMilestones, fetchStandups, fetchAnalytics]);

  // Fetch teams once on mount / token change
  useEffect(() => {
    if (token) {
      fetchTeams();
    } else {
      setTeams([]);
      setActiveTeamState(null);
      setTasks([]);
      setMilestones([]);
      setStandups([]);
      setAnalytics(null);
    }
  }, [token, fetchTeams]);

  // Load all team data whenever the ACTIVE TEAM ID or DATE changes.
  // Depend only on primitive values (string IDs) — never on object refs or callbacks
  // to prevent infinite re-render loops.
  const activeTeamId = activeTeam?._id;
  useEffect(() => {
    if (!activeTeamId || !tokenRef.current) return;

    let cancelled = false;
    // Only show the full loading spinner on the very first load (no analytics yet)
    const isFirstLoad = !analytics;
    if (isFirstLoad) setLoading(true);

    const hdrs = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenRef.current}`,
    };

    Promise.all([
      fetch(`${API_BASE_URL}/tasks?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/milestones?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/standups?teamId=${activeTeamId}&date=${selectedDate}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/analytics?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : null),
    ])
      .then(([tasksData, milestonesData, standupsData, analyticsData]) => {
        if (cancelled) return;
        setTasks(tasksData);
        setMilestones(milestonesData);
        setStandups(standupsData);
        if (analyticsData) setAnalytics(analyticsData);
      })
      .catch(err => console.error('Data load error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId, selectedDate]); // ONLY primitive deps — no callbacks, no objects

  // Periodic background polling for real-time updates without page refresh
  useEffect(() => {
    if (!activeTeamId || !tokenRef.current) return;

    const interval = setInterval(() => {
      const hdrs = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenRef.current}`,
      };

      Promise.all([
        fetch(`${API_BASE_URL}/tasks?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE_URL}/milestones?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE_URL}/standups?teamId=${activeTeamId}&date=${selectedDate}`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
        fetch(`${API_BASE_URL}/analytics?teamId=${activeTeamId}`, { headers: hdrs }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE_URL}/teams`, { headers: hdrs }).then(r => r.ok ? r.json() : []),
      ])
        .then(([tasksData, milestonesData, standupsData, analyticsData, teamsData]) => {
          setTasks(prev => JSON.stringify(prev) !== JSON.stringify(tasksData) ? tasksData : prev);
          setMilestones(prev => JSON.stringify(prev) !== JSON.stringify(milestonesData) ? milestonesData : prev);
          setStandups(prev => JSON.stringify(prev) !== JSON.stringify(standupsData) ? standupsData : prev);
          if (analyticsData) {
            setAnalytics(prev => JSON.stringify(prev) !== JSON.stringify(analyticsData) ? analyticsData : prev);
          }
          if (Array.isArray(teamsData) && teamsData.length > 0) {
            setTeams(prev => JSON.stringify(prev) !== JSON.stringify(teamsData) ? teamsData : prev);
            const updatedActive = teamsData.find((t: TeamType) => t._id === activeTeamId);
            if (updatedActive) {
              setActiveTeamState(prev => JSON.stringify(prev) !== JSON.stringify(updatedActive) ? updatedActive : prev);
            }
          }
        })
        .catch(err => console.error('Background refresh error:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTeamId, selectedDate]);

  return (
    <TeamContext.Provider
      value={{
        teams,
        activeTeam,
        tasks,
        milestones,
        standups,
        analytics,
        loading,
        selectedDate,
        setActiveTeam,
        setSelectedDate,
        fetchTeams,
        createTeam,
        inviteMember,
        deleteTeam,
        updateMemberRole,
        removeMember,
        fetchPendingInvites,
        revokeInvite,
        createTask,
        updateTask,
        deleteTask,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        submitStandup,
        refreshAllData,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
