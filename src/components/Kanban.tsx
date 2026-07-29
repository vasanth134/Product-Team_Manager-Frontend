import React, { useState } from 'react';
import { useTeam, type TaskType } from '../context/TeamContext';
import { formatDateForInput, resolveAssignee } from '../utils/helpers';
import { ViewSwitcher, type TaskViewMode } from './ViewSwitcher';
import { TableView } from './TableView';
import { 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  X
} from 'lucide-react';

export const Kanban: React.FC = () => {
  const { 
    tasks, 
    activeTeam, 
    milestones, 
    createTask, 
    updateTask, 
    deleteTask 
  } = useTeam();

  const LOCAL_STORAGE_KEY = 'aether_task_view_mode';

  const [viewMode, setViewMode] = useState<TaskViewMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved === 'table' || saved === 'kanban') {
        return saved;
      }
    } catch (err) {
      console.error('Failed to load task view mode from localStorage:', err);
    }
    return 'kanban';
  });

  const handleViewChange = (mode: TaskViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, mode);
    } catch (err) {
      console.error('Failed to save task view mode to localStorage:', err);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);

  // New task form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskType['status']>('todo');
  const [priority, setPriority] = useState<TaskType['priority']>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit task form fields (tracked when selectedTask is active)
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskType['status']>('todo');
  const [editPriority, setEditPriority] = useState<TaskType['priority']>('medium');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [editMilestoneId, setEditMilestoneId] = useState('');
  const [editStoryPoints, setEditStoryPoints] = useState(1);
  const [editDueDate, setEditDueDate] = useState('');

  const columns: { id: TaskType['status']; title: string; color: string }[] = [
    { id: 'backlog', title: 'Backlog', color: 'border-t-slate-500 bg-slate-500/5' },
    { id: 'todo', title: 'To Do', color: 'border-t-blue-500 bg-blue-500/5' },
    { id: 'in_progress', title: 'In Progress', color: 'border-t-violet-500 bg-violet-500/5' },
    { id: 'review', title: 'Review', color: 'border-t-amber-500 bg-amber-500/5' },
    { id: 'done', title: 'Completed', color: 'border-t-emerald-500 bg-emerald-500/5' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: TaskType['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    try {
      await updateTask(taskId, { status: columnId });
    } catch (err) {
      console.error('Failed to update task column status:', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }
    try {
      await createTask({
        title,
        description,
        status,
        priority,
        assignee: assigneeId ? assigneeId : null,
        milestoneId: milestoneId ? milestoneId : null,
        storyPoints: Number(storyPoints),
        dueDate: dueDate ? dueDate : null,
      });
      // Reset fields
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssigneeId('');
      setMilestoneId('');
      setStoryPoints(1);
      setDueDate('');
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create task');
    }
  };

  const handleEditClick = (task: TaskType) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    const assigneeUser = resolveAssignee(task.assignee, activeTeam?.members);
    setEditAssigneeId(assigneeUser ? assigneeUser._id : '');
    setEditMilestoneId(task.milestoneId ? task.milestoneId._id : '');
    setEditStoryPoints(task.storyPoints || 0);
    setEditDueDate(formatDateForInput(task.dueDate));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask._id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        assignee: editAssigneeId ? editAssigneeId : null,
        milestoneId: editMilestoneId ? editMilestoneId : null,
        storyPoints: Number(editStoryPoints),
        dueDate: editDueDate ? editDueDate : null,
      });
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteClick = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const getPriorityColor = (p: TaskType['priority']) => {
    switch (p) {
      case 'critical': return 'bg-red-950/40 text-red-400 border-red-900/50';
      case 'high': return 'bg-amber-950/40 text-amber-400 border-amber-900/50';
      case 'medium': return 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50';
      case 'low': return 'bg-slate-900/60 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070A0F]">
      
      {/* Upper header */}
      <div className="p-4 sm:p-8 border-b border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-display">Product Task Board</h2>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'kanban' ? (
              <>Drag cards to update task status in <span className="text-indigo-400 font-semibold">{activeTeam?.name}</span></>
            ) : (
              <>Interactive table view for <span className="text-indigo-400 font-semibold">{activeTeam?.name}</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitcher viewMode={viewMode} onViewChange={handleViewChange} />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4.5 py-2.5 rounded-xl bg-gradient-indigo-purple hover:opacity-95 font-medium text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-650/15 text-xs transition duration-150 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{viewMode === 'kanban' ? 'New Kanban Task' : 'New Task'}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto p-4 sm:p-8 flex gap-5 items-start">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const colPoints = colTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 flex-shrink-0 rounded-2xl border-t-2 border-slate-900/50 flex flex-col max-h-full ${col.color} p-4.5`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200 font-display">{col.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">
                    {colPoints} pts
                  </span>
                </div>

                {/* Task Cards Stack */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => handleEditClick(task)}
                      className="p-4 rounded-xl glass hover:border-slate-750 transition-all duration-200 cursor-pointer shadow-md border-slate-850 hover:bg-slate-900/30 group active:scale-[0.98]"
                    >
                      <h5 className="font-bold text-xs text-slate-250 leading-snug group-hover:text-white transition truncate" title={task.title}>
                        {task.title}
                      </h5>
                      
                      {task.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Meta Tag list */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3.5 border-t border-slate-900">
                        
                        {/* Priority Tag */}
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        {/* Story points */}
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-slate-900 text-slate-450 border border-slate-850">
                          {task.storyPoints || 0} pts
                        </span>

                        {/* Milestone badge */}
                        {task.milestoneId && (
                          <span className="max-w-[80px] truncate px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-purple-950/20 text-purple-400 border border-purple-900/40">
                            {task.milestoneId.title}
                          </span>
                        )}

                        {/* Assignee Avatar / Due Date spacer */}
                        <div className="ml-auto flex items-center gap-1">
                          {task.dueDate && (
                            <div className="flex items-center gap-0.5 text-slate-550 text-[8px]" title={`Due: ${(() => { const d = new Date(task.dueDate); return !isNaN(d.getTime()) ? d.toLocaleDateString() : task.dueDate; })()}`}>
                              <Calendar className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {(() => {
                            const assigneeUser = resolveAssignee(task.assignee, activeTeam?.members);
                            return assigneeUser?.avatarUrl ? (
                              <img
                                src={assigneeUser.avatarUrl}
                                alt={assigneeUser.name || 'User'}
                                className="w-5 h-5 rounded-full bg-slate-900 ring-1 ring-slate-850"
                                title={`Assigned to ${assigneeUser.name}`}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-650" title={assigneeUser?.name ? `Assigned to ${assigneeUser.name}` : "Unassigned"}>
                                <User className="w-2.5 h-2.5" />
                              </div>
                            );
                          })()}
                        </div>

                      </div>
                    </div>
                  ))}
                  
                  {colTasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed border-slate-850 rounded-xl">
                      <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Empty Column</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <TableView onEditTask={handleEditClick} />
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Create a New Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-3">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Integrate Stripe webhook subscription handler"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Describe the acceptance criteria or implementation notes..."
                  value={description}
                  rows={4}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Initial Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Teammate Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="">-- Unassigned --</option>
                    {activeTeam?.members.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Roadmap Milestone</label>
                  <select
                    value={milestoneId}
                    onChange={e => setMilestoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="">-- No Milestone --</option>
                    {milestones.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Story Points</label>
                  <input
                    type="number"
                    min={0}
                    value={storyPoints}
                    onChange={e => setStoryPoints(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-gradient-indigo-purple text-white font-medium hover:opacity-95 text-xs cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / VIEW TASK MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Edit Task</h3>
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={() => handleDeleteClick(selectedTask._id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/15 transition mr-1"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Task Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  value={editDescription}
                  rows={4}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Priority</label>
                  <select
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Teammate Assignee</label>
                  <select
                    value={editAssigneeId}
                    onChange={e => setEditAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="">-- Unassigned --</option>
                    {activeTeam?.members.map(m => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Roadmap Milestone</label>
                  <select
                    value={editMilestoneId}
                    onChange={e => setEditMilestoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                  >
                    <option value="">-- No Milestone --</option>
                    {milestones.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Story Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editStoryPoints}
                    onChange={e => setEditStoryPoints(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel Changes
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-gradient-indigo-purple text-white font-medium hover:opacity-95 text-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
