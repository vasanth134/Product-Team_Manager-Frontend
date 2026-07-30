import React from 'react';
import { useTeam } from '../context/TeamContext';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FolderGit2, 
  Trello,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { analytics, activeTeam, loading } = useTeam();

  if (loading || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="text-center space-y-4 z-10">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-550 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Aggregating workspace analytics...</p>
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-10 bg-app relative">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Header section with high-end typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Workspace Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            Real-time delivery progress and workload metrics for the <span className="text-indigo-400 font-semibold">{activeTeam?.name}</span> workspace.
          </p>
        </div>
        
        {/* Dynamic standup summary */}
        <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-950/30 border border-app backdrop-blur-md">
          <div className="w-7.5 h-7.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Daily Standups</span>
            <span className="text-xs font-bold text-slate-200">
              {standupsToday.submitted} of {standupsToday.total} Synced
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - Refined with left accent lines, squircle icons, and tracking-tight numbers */}
      <div className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0">
        
        {/* Card 1: Completion rate */}
        <div className="glass-card p-4 sm:p-5 rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out flex-shrink-0 w-[260px] snap-start sm:w-auto">
          <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-500/80"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block">Completion Rate</span>
              <h3 className="text-2xl font-black text-white font-display tracking-tight tabular-nums sm:text-3xl">{summary.completionRate}%</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:rotate-6 transition duration-300 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4 text-slate-400 text-[10px] flex justify-between items-center">
            <span>Tasks Resolved</span>
            <span className="font-bold text-slate-200">{summary.completedTasks} / {summary.totalTasks}</span>
          </div>
        </div>

        {/* Card 2: Sprint Velocity */}
        <div className="glass-card p-4 sm:p-5 rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out flex-shrink-0 w-[260px] snap-start sm:w-auto">
          <div className="absolute top-0 left-0 w-[3px] h-full bg-indigo-500/80"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-550/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block">Delivered Points</span>
              <h3 className="text-2xl font-black text-white font-display tracking-tight tabular-nums sm:text-3xl">{summary.pointsCompletionRate}%</h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-550/20 flex items-center justify-center text-indigo-400 group-hover:rotate-6 transition duration-300 flex-shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4 text-slate-400 text-[10px] flex justify-between items-center">
            <span>Sprint Points</span>
            <span className="font-bold text-slate-200">{summary.completedPoints} / {summary.totalPoints}</span>
          </div>
        </div>

        {/* Card 3: Active Roadmaps */}
        <div className="glass-card p-4 sm:p-5 rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out flex-shrink-0 w-[260px] snap-start sm:w-auto">
          <div className="absolute top-0 left-0 w-[3px] h-full bg-amber-500/80"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-550/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block">Active Milestones</span>
              <h3 className="text-2xl font-black text-white font-display tracking-tight tabular-nums sm:text-3xl">
                {milestones.filter(m => m.status === 'active').length}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-550/20 flex items-center justify-center text-amber-400 group-hover:rotate-6 transition duration-300 flex-shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4 text-slate-400 text-[10px] flex justify-between items-center">
            <span>Total Milestones</span>
            <span className="font-bold text-slate-200">{milestones.length} configured</span>
          </div>
        </div>

        {/* Card 4: High Priority Alert */}
        <div className="glass-card p-4 sm:p-5 rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 ease-out flex-shrink-0 w-[260px] snap-start sm:w-auto">
          <div className="absolute top-0 left-0 w-[3px] h-full bg-red-500/80"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-550/10 transition duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest block">Blocked Risk Items</span>
              <h3 className="text-2xl font-black text-white font-display tracking-tight tabular-nums sm:text-3xl">
                {priorityCounts.critical + priorityCounts.high}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-550/25 flex items-center justify-center text-red-400 group-hover:rotate-6 transition duration-300 flex-shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4 text-slate-400 text-[10px] flex justify-between items-center">
            <span>Critical Priority</span>
            <span className="font-bold text-slate-200">{priorityCounts.critical} item{priorityCounts.critical !== 1 ? 's' : ''}</span>
          </div>
        </div>

      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Task States - Circular Graph */}
        <div className="glass-card p-5 sm:p-6 rounded-xl flex flex-col justify-between min-h-[360px]">
          <div>
            <h4 className="font-bold text-sm text-white font-display tracking-wide">Task States</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Status breakdown of current sprints</p>
          </div>
          
          {totalStatusTasks === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3.5">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex items-center justify-center text-slate-600">
                <Trello className="w-6 h-6" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-bold text-slate-350">Workspace is empty</span>
                <p className="text-[9px] text-slate-500 max-w-[180px] leading-relaxed mx-auto">
                  Create sprint tasks on the Kanban Board or Task Database to populate analytics.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-4">
              {/* Custom SVG Donut Chart */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="7" />
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
                        strokeWidth="7.5"
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
                  <span className="text-2xl font-black text-white font-display leading-none tracking-tight tabular-nums">{totalStatusTasks}</span>
                  <span className="text-[8px] text-slate-550 font-bold uppercase tracking-wider mt-1">Total Tasks</span>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full px-2">
                {donutSlices.map((slice, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-350">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></span>
                    <span className="text-[9px] font-medium truncate flex-1">{slice.label}</span>
                    <span className="text-[9px] font-bold text-slate-450 tabular-nums">{slice.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Member Workload - Redesigned with squircle avatars, grid texture, and premium progress bars */}
        <div className="glass-card p-5 sm:p-6 rounded-xl lg:col-span-2 flex flex-col justify-between min-h-[360px]">
          <div>
            <h4 className="font-bold text-sm text-white font-display tracking-wide">Teammate Workloads</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Assigned tasks and story point balance per developer</p>
          </div>
          
          <div className="space-y-5 max-h-[250px] overflow-y-auto pr-1 flex-1 mt-6">
            {workload.map(member => {
              const totalTasks = member.openTasks + member.completedTasks;
              const maxPossibleTasks = Math.max(...workload.map(w => w.openTasks + w.completedTasks), 1);
              const openWidth = (member.openTasks / maxPossibleTasks) * 100;
              const closedWidth = (member.completedTasks / maxPossibleTasks) * 100;

              return (
                <div key={member.userId} className="flex items-center gap-4 group">
                  {/* User Profile with Squircle avatar */}
                  <div className="w-32 flex items-center gap-2.5 flex-shrink-0">
                    <img 
                      src={member.avatarUrl} 
                      alt={member.name} 
                      className="w-7 h-7 rounded-xl bg-slate-900 border border-white/5 object-cover"
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-indigo-400 transition" title={member.name}>
                        {member.name}
                      </span>
                      <span className="text-[8px] text-slate-550 uppercase tracking-widest font-semibold block leading-none mt-0.5">
                        {totalTasks} Task{totalTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Workload stacked progress capsule with grid lines overlay */}
                  <div className="flex-1 relative">
                    <div className="h-5 rounded-xl bg-slate-950/20 overflow-hidden flex border border-slate-900 relative shadow-inner">
                      {/* Grid background texture overlay */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                        backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px)',
                        backgroundSize: '12px 100%'
                      }}></div>

                      {/* Completed Tasks (Emerald gradient) */}
                      {member.completedTasks > 0 && (
                        <div 
                          className="bg-gradient-to-r from-emerald-600/70 to-teal-500/70 border-r border-slate-950 flex items-center justify-center text-[9px] font-black text-emerald-50 transition-all duration-700 relative group-hover:brightness-110"
                          style={{ width: `${closedWidth}%` }}
                          title={`${member.completedTasks} completed`}
                        >
                          <span className="z-10">{member.completedTasks}</span>
                        </div>
                      )}
                      
                      {/* Open Tasks (Indigo gradient) */}
                      {member.openTasks > 0 && (
                        <div 
                          className="bg-gradient-to-r from-indigo-600/70 to-violet-500/70 flex items-center justify-center text-[9px] font-black text-indigo-50 transition-all duration-700 relative group-hover:brightness-110"
                          style={{ width: `${openWidth}%` }}
                          title={`${member.openTasks} active`}
                        >
                          <span className="z-10">{member.openTasks}</span>
                        </div>
                      )}

                      {totalTasks === 0 && (
                        <div className="w-full flex items-center pl-3 text-[9px] text-slate-500 font-medium tracking-wide">
                          No tasks assigned
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points tally in monospace */}
                  <div className="w-14 text-right text-[10px] text-slate-400 font-bold tabular-nums flex-shrink-0">
                    <span className="text-slate-200">{member.pointsAssigned}</span> pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Milestones Progress - Redesigned card list with timeline visualizers */}
      <div className="glass-card p-5 sm:p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-900/50 pb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white font-display tracking-wide">Milestone Delivery</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Sprint release progress tracking</p>
          </div>
        </div>
        
        {milestones.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Calendar className="w-6 h-6 text-slate-650" />
            <span className="font-bold text-slate-400">No milestones set</span>
            <p className="text-[9px] text-slate-550 max-w-xs leading-relaxed">
              Set milestones on the Roadmap page to establish and track key target dates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {milestones.map(m => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-950/20 border border-app space-y-3.5 hover:border-slate-800 transition duration-300 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                  <div className="truncate">
                    <h5 className="font-bold text-xs text-slate-200 truncate group-hover:text-indigo-400" title={m.title}>
                      {m.title}
                    </h5>
                    <span className="text-[9px] font-bold text-slate-550 uppercase tracking-widest mt-1 block">
                      Tasks: {m.completedTasks} / {m.totalTasks}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-extrabold uppercase tracking-wider border ${m.status === 'completed' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' : m.status === 'active' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40' : 'bg-slate-900/30 text-slate-400 border-slate-800'}`}>
                    {m.status}
                  </span>
                </div>
                
                {/* Milestone Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="h-2 rounded-full bg-slate-950 overflow-hidden relative shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${m.status === 'completed' ? 'from-emerald-500 to-teal-500' : 'from-indigo-500 to-violet-500'}`}
                      style={{ width: `${m.completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Progress</span>
                    <span className={m.status === 'completed' ? 'text-emerald-450 font-black' : 'text-slate-350 font-black'}>
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
