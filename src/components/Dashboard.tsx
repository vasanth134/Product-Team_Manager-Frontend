import React from 'react';
import { useTeam } from '../context/TeamContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FolderGit2, 
  Trello
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { analytics, activeTeam, loading } = useTeam();

  if (loading || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070A0F]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium">Aggregating workspace analytics...</p>
        </div>
      </div>
    );
  }

  const { summary, statusCounts, priorityCounts, workload, milestones, standupsToday } = analytics;

  // Custom status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog': return '#64748B'; // slate
      case 'todo': return '#3B82F6'; // blue
      case 'in_progress': return '#8B5CF6'; // purple
      case 'review': return '#F59E0B'; // amber
      case 'done': return '#10B981'; // emerald
      default: return '#6366F1';
    }
  };

  // Compute donut chart angles
  const statusValues = [
    { label: 'Backlog', value: statusCounts.backlog, color: getStatusColor('backlog') },
    { label: 'Todo', value: statusCounts.todo, color: getStatusColor('todo') },
    { label: 'In Progress', value: statusCounts.in_progress, color: getStatusColor('in_progress') },
    { label: 'Review', value: statusCounts.review, color: getStatusColor('review') },
    { label: 'Done', value: statusCounts.done, color: getStatusColor('done') },
  ].filter(item => item.value > 0);

  const totalStatusTasks = statusValues.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = 0;
  const donutSlices = statusValues.map(item => {
    const percentage = totalStatusTasks > 0 ? (item.value / totalStatusTasks) * 100 : 0;
    const angle = totalStatusTasks > 0 ? (item.value / totalStatusTasks) * 360 : 0;
    const slice = {
      ...item,
      percentage: Math.round(percentage),
      startAngle: currentAngle,
      angle,
    };
    currentAngle += angle;
    return slice;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#070A0F]">
      
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Workspace Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics for <span className="text-indigo-400 font-semibold">{activeTeam?.name}</span>
          </p>
        </div>
        
        {/* Dynamic standup summary */}
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-slate-800 bg-slate-950/20">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Daily Standups</span>
            <span className="block text-xs font-bold text-slate-200">
              {standupsToday.submitted}/{standupsToday.total} Submitted
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-550/15 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Card 1: Completion rate */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 font-display">{summary.completionRate}%</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-[10px]">
            <span className="font-semibold text-slate-200">{summary.completedTasks}</span> of {summary.totalTasks} tasks resolved
          </div>
        </div>

        {/* Card 2: Sprint Velocity */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint Story Points</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 font-display">{summary.pointsCompletionRate}%</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-900/40 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-[10px]">
            <span className="font-semibold text-slate-200">{summary.completedPoints}</span> of {summary.totalPoints} story points delivered
          </div>
        </div>

        {/* Card 3: Active Roadmaps */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roadmap Milestones</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 font-display">
                {milestones.filter(m => m.status === 'active').length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-900/40 flex items-center justify-center">
              <FolderGit2 className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-[10px]">
            Total roadmap goals: <span className="font-semibold text-slate-200">{milestones.length} milestones</span>
          </div>
        </div>

        {/* Card 4: High Priority Alert */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk / Blockers</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5 font-display">
                {priorityCounts.critical + priorityCounts.high}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-400 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 text-slate-400 text-[10px]">
            <span className="font-semibold text-slate-200">{priorityCounts.critical} critical</span> priority items require review
          </div>
        </div>

      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Donut Chart Container */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:col-span-1">
          <h4 className="font-bold text-sm text-slate-200 font-display mb-4">Task States</h4>
          
          {totalStatusTasks === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2.5">
              <Trello className="w-8 h-8 text-slate-650" />
              <span className="text-xs text-slate-450">No tasks in current workspace.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              
              {/* Custom SVG Donut Chart */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#131924" strokeWidth="8" />
                  {donutSlices.map((slice, idx) => {
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (slice.angle / 360) * circumference;
                    const strokeDasharray = `${circumference} ${circumference}`;
                    const rotation = slice.startAngle;
                    
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="8.5"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(${rotation} 50 50)`}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    );
                  })}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white font-display leading-none">{totalStatusTasks}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-1">TASKS</span>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full px-2">
                {donutSlices.map((slice, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-350">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                    <span className="text-[10px] font-medium truncate flex-1">{slice.label}</span>
                    <span className="text-[10px] font-bold text-slate-400">{slice.percentage}%</span>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Member Workload Bar Charts */}
        <div className="glass-card p-6 rounded-2xl md:col-span-2">
          <h4 className="font-bold text-sm text-slate-200 font-display mb-4">Teammate Workloads</h4>
          
          <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
            {workload.map(member => {
              const totalTasks = member.openTasks + member.completedTasks;
              const maxPossibleTasks = Math.max(...workload.map(w => w.openTasks + w.completedTasks), 1);
              const openWidth = (member.openTasks / maxPossibleTasks) * 100;
              const closedWidth = (member.completedTasks / maxPossibleTasks) * 100;

              return (
                <div key={member.userId} className="flex items-center gap-3">
                  {/* User Profile */}
                  <div className="w-28 flex items-center gap-2 flex-shrink-0">
                    <img 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      className="w-6 h-6 rounded-full bg-slate-900"
                    />
                    <span className="text-xs font-semibold text-slate-300 truncate" title={member.name}>
                      {member.name}
                    </span>
                  </div>

                  {/* Horizontal Stacked Bar */}
                  <div className="flex-1">
                    <div className="h-4.5 rounded-lg bg-slate-900/60 overflow-hidden flex relative border border-slate-950">
                      {/* Completed Tasks (Green) */}
                      {member.completedTasks > 0 && (
                        <div 
                          className="bg-emerald-600/70 border-r border-slate-950 flex items-center justify-center text-[8px] font-black text-emerald-100 transition-all duration-500"
                          style={{ width: `${closedWidth}%` }}
                          title={`${member.completedTasks} completed`}
                        >
                          {member.completedTasks}
                        </div>
                      )}
                      
                      {/* Open Tasks (Purple/Blue) */}
                      {member.openTasks > 0 && (
                        <div 
                          className="bg-indigo-600/70 flex items-center justify-center text-[8px] font-black text-indigo-100 transition-all duration-500"
                          style={{ width: `${openWidth}%` }}
                          title={`${member.openTasks} active`}
                        >
                          {member.openTasks}
                        </div>
                      )}

                      {totalTasks === 0 && (
                        <div className="w-full flex items-center pl-2.5 text-[8px] text-slate-600 font-medium">
                          No tasks assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points tally */}
                  <div className="w-12 text-right text-[10px] text-slate-400 font-bold flex-shrink-0">
                    {member.pointsAssigned} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Milestones Dashboard */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-5">
          <FolderGit2 className="w-4 h-4 text-violet-400" />
          <h4 className="font-bold text-sm text-slate-200 font-display">Milestone Progress</h4>
        </div>
        
        {milestones.length === 0 ? (
          <div className="text-center p-8 text-xs text-slate-450 border border-dashed border-slate-850 rounded-xl">
            No milestones configured. Set milestones on the Roadmap page to track progress.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {milestones.map(m => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-950/20 border border-slate-900/40 space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-xs text-slate-250 truncate" title={m.title}>{m.title}</h5>
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 inline-block">
                      Tasks: {m.completedTasks} / {m.totalTasks}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${m.status === 'completed' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/50' : m.status === 'active' ? 'bg-indigo-950/40 text-indigo-450 border border-indigo-900/50' : 'bg-slate-900/50 text-slate-400 border border-slate-800'}`}>
                    {m.status}
                  </span>
                </div>
                
                {/* Milestone Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${m.status === 'completed' ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-violet-500'}`}
                      style={{ width: `${m.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span className={m.status === 'completed' ? 'text-emerald-450' : 'text-slate-350'}>
                      {m.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
