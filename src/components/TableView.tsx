import React, { useState, useMemo } from 'react';
import { useTeam, type TaskType } from '../context/TeamContext';
import { formatDateForInput, resolveAssignee } from '../utils/helpers';
import {
  Plus,
  Trash2,
  User,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';

type SortField = 'title' | 'storyPoints' | 'dueDate';
type SortOrder = 'asc' | 'desc';

export interface TableViewProps {
  onEditTask?: (task: TaskType) => void;
}

export const TableView: React.FC<TableViewProps> = ({ onEditTask }) => {
  const { tasks, activeTeam, createTask, updateTask, deleteTask } = useTeam();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Quick add state
  const [quickTitle, setQuickTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Status options mapping
  const statusOptions: { id: TaskType['status']; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: 'bg-slate-500/10 text-slate-400 border-slate-700' },
    { id: 'todo', label: 'To Do', color: 'bg-blue-500/10 text-blue-400 border-blue-800/50' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-violet-500/10 text-violet-400 border-violet-800/50' },
    { id: 'review', label: 'Review', color: 'bg-amber-500/10 text-amber-400 border-amber-800/50' },
    { id: 'done', label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-800/50' },
  ];

  const getPriorityBadge = (priority: TaskType['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-950/40 text-red-400 border-red-900/50';
      case 'high': return 'bg-amber-950/40 text-amber-400 border-amber-900/50';
      case 'medium': return 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50';
      case 'low': return 'bg-slate-900/60 text-slate-400 border-slate-800';
    }
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        result = result.filter(t => !resolveAssignee(t.assignee, activeTeam?.members));
      } else {
        result = result.filter(t => {
          const assigneeUser = resolveAssignee(t.assignee, activeTeam?.members);
          return assigneeUser?._id === filterAssignee;
        });
      }
    }

    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'title') {
          valA = (valA || '').toLowerCase();
          valB = (valB || '').toLowerCase();
        } else if (sortField === 'storyPoints') {
          valA = valA || 0;
          valB = valB || 0;
        } else if (sortField === 'dueDate') {
          const dA = valA ? new Date(valA).getTime() : 0;
          const dB = valB ? new Date(valB).getTime() : 0;
          valA = isNaN(dA) ? 0 : dA;
          valB = isNaN(dB) ? 0 : dB;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [tasks, searchQuery, filterStatus, filterAssignee, sortField, sortOrder, activeTeam?.members]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isAdding) return;
    try {
      setIsAdding(true);
      await createTask({
        title: quickTitle.trim(),
        status: 'todo',
        priority: 'medium',
        storyPoints: 1,
      });
      setQuickTitle('');
    } catch (err) {
      console.error('Failed to quick add task:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFieldUpdate = async (taskId: string, field: string, value: any) => {
    try {
      await updateTask(taskId, { [field]: value });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070A0F] p-4 sm:p-8">
      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl glass-input text-xs w-full bg-slate-950/20"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl glass-input text-xs bg-[#0B0F19] text-slate-200 border border-slate-800"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* Filter Assignee */}
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl glass-input text-xs bg-[#0B0F19] text-slate-200 border border-slate-800"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {activeTeam?.members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Glass Table Container */}
      <div className="flex-1 glass-card rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none sticky top-0 z-10">
                {/* 1. Title Header */}
                <th onClick={() => handleSort('title')} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>Title</span>
                    {sortField === 'title' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 2. Status Header */}
                <th className="py-3.5 px-4">Status</th>

                {/* 3. Priority Header */}
                <th className="py-3.5 px-4">Priority</th>

                {/* 4. Assignee Header */}
                <th className="py-3.5 px-4">Assignee</th>

                {/* 5. Story Points Header */}
                <th onClick={() => handleSort('storyPoints')} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>Story Points</span>
                    {sortField === 'storyPoints' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 6. Due Date Header */}
                <th onClick={() => handleSort('dueDate')} className="py-3.5 px-4 cursor-pointer hover:text-white transition">
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {sortField === 'dueDate' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* Actions Header */}
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredAndSortedTasks.map(task => {
                const currentStatus = statusOptions.find(s => s.id === task.status) || statusOptions[1];
                return (
                  <tr key={task._id} className="hover:bg-slate-900/40 transition group">
                    {/* 1. Title Column */}
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div
                        onClick={() => onEditTask?.(task)}
                        className={`truncate max-w-xs ${onEditTask ? 'cursor-pointer hover:text-indigo-400 transition' : ''}`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    </td>

                    {/* 2. Status Column (Inline Selector) */}
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={e => handleFieldUpdate(task._id, 'status', e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentStatus.color} bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                      >
                        {statusOptions.map(s => (
                          <option key={s.id} value={s.id} className="bg-slate-950 text-slate-200">{s.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* 3. Priority Column (Inline Selector) */}
                    <td className="py-3 px-4">
                      <select
                        value={task.priority}
                        onChange={e => handleFieldUpdate(task._id, 'priority', e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getPriorityBadge(task.priority)} bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                      >
                        <option value="low" className="bg-slate-950 text-slate-200">Low</option>
                        <option value="medium" className="bg-slate-950 text-slate-200">Medium</option>
                        <option value="high" className="bg-slate-950 text-slate-200">High</option>
                        <option value="critical" className="bg-slate-950 text-slate-200">Critical</option>
                      </select>
                    </td>

                    {/* 4. Assignee Column (Inline Selector with Avatar) */}
                    <td className="py-3 px-4">
                      {(() => {
                        const assigneeUser = resolveAssignee(task.assignee, activeTeam?.members);
                        return (
                          <div className="flex items-center gap-2">
                            {assigneeUser?.avatarUrl ? (
                              <img
                                src={assigneeUser.avatarUrl}
                                alt={assigneeUser.name || 'User'}
                                className="w-5 h-5 rounded-full ring-1 ring-slate-800"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-600" title={assigneeUser?.name ? `Assigned to ${assigneeUser.name}` : "Unassigned"}>
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <select
                              value={assigneeUser ? assigneeUser._id : ''}
                              onChange={e => handleFieldUpdate(task._id, 'assignee', e.target.value ? e.target.value : null)}
                              className="bg-transparent text-slate-300 text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[110px] truncate"
                            >
                              <option value="" className="bg-slate-950 text-slate-400">Unassigned</option>
                              {activeTeam?.members.map(m => (
                                <option key={m.user._id} value={m.user._id} className="bg-slate-950 text-slate-200">{m.user.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </td>

                    {/* 5. Story Points Column (Inline Editable Input) */}
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        value={task.storyPoints || 0}
                        onChange={e => handleFieldUpdate(task._id, 'storyPoints', Number(e.target.value))}
                        className="w-16 px-2 py-0.5 rounded-lg glass-input text-xs font-bold text-indigo-300 bg-slate-900/60 text-center"
                      />
                    </td>

                    {/* 6. Due Date Column (Inline Date Input) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="date"
                          value={formatDateForInput(task.dueDate)}
                          onChange={e => handleFieldUpdate(task._id, 'dueDate', e.target.value ? e.target.value : null)}
                          className="bg-transparent text-slate-300 text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </td>

                    {/* Delete Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-slate-600 hover:text-red-400 p-1 rounded-md hover:bg-red-950/20 transition opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSortedTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Add Bottom Row */}
        <form onSubmit={handleQuickAdd} className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
          <Plus className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Quick add new task title... Press Enter"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            disabled={isAdding}
            className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {quickTitle.trim() && (
            <button
              type="submit"
              disabled={isAdding}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
            >
              Add Task
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
