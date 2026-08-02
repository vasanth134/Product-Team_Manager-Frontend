import React, { useState } from 'react';
import { useTeam, type MilestoneType } from '../context/TeamContext';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Flag,
  X,
  Edit2
} from 'lucide-react';

export const Roadmap: React.FC = () => {
  const { milestones, createMilestone, updateMilestone, deleteMilestone } = useTeam();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneType | null>(null);

  // New Milestone Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<MilestoneType['status']>('planned');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Milestone Form States
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<MilestoneType['status']>('planned');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !startDate || !endDate) {
      setFormError('Title, start date, and end date are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date');
      return;
    }

    try {
      await createMilestone({
        title,
        description,
        startDate,
        endDate,
        status,
      });
      // Reset
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setStatus('planned');
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create milestone');
    }
  };

  const handleEditClick = (milestone: MilestoneType) => {
    setSelectedMilestone(milestone);
    setEditTitle(milestone.title);
    setEditDescription(milestone.description || '');
    setEditStartDate(new Date(milestone.startDate).toISOString().split('T')[0]);
    setEditEndDate(new Date(milestone.endDate).toISOString().split('T')[0]);
    setEditStatus(milestone.status);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone) return;
    try {
      await updateMilestone(selectedMilestone._id, {
        title: editTitle,
        description: editDescription,
        startDate: editStartDate,
        endDate: editEndDate,
        status: editStatus,
      });
      setSelectedMilestone(null);
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Delete this milestone? Any linked tasks will remain but lose this milestone link.')) return;
    try {
      await deleteMilestone(id);
      setSelectedMilestone(null);
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-app">
      
      {/* Page Header */}
      <div className="p-4 sm:p-8 border-b border-app flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Product Roadmap</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4.5 py-2.5 rounded-xl bg-gradient-indigo-purple hover:opacity-95 font-medium text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-650/15 text-xs transition duration-155 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Add Roadmap Milestone</span>
        </button>
      </div>

      {/* Roadmap List View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        
        {milestones.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16 px-4 border border-dashed border-slate-850 rounded-2xl space-y-4">
            <Flag className="w-10 h-10 text-slate-650 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-350 font-display text-sm">No Roadmap Milestones Set</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Break your product development down into sequential releases, features, or phases.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/45 text-indigo-450 border border-indigo-900/50 hover:bg-indigo-900/30 transition text-xs font-semibold"
            >
              Configure First Milestone
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 relative before:absolute before:inset-y-0 before:left-4.5 before:w-0.5 before:bg-[var(--border)]">
            {milestones.map((milestone) => {
              const isActive = milestone.status === 'active';
              const isCompleted = milestone.status === 'completed';

              return (
                <div key={milestone._id} className="relative pl-12 group">
                  {/* Timeline bullet indicator */}
                  <div className={`absolute left-2.5 top-1.5 w-4.5 h-4.5 rounded-full border-2 transform -translate-x-1/2 flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'bg-[#EDF3EC] border-[#346538]/30' : isActive ? 'bg-[#aeecd5] border-[#1F523B]/30 animate-pulse' : 'bg-[var(--bg-base-2)] border-[var(--border)]'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-[#346538]' : isActive ? 'bg-[#1F523B]' : 'bg-[var(--text-muted)]'}`}></div>
                  </div>

                  {/* Card Container */}
                  <div className="glass-card p-5.5 rounded-2xl border-slate-850 hover:border-slate-800 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="font-bold text-sm text-slate-200 font-display">{milestone.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${isCompleted ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : isActive ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30' : 'bg-slate-900/30 text-slate-400 border-slate-900/50'}`}>
                          {milestone.status}
                        </span>
                      </div>
                      
                      {milestone.description && (
                        <p className="text-xs text-slate-450 leading-relaxed max-w-2xl">
                          {milestone.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-650" />
                          <span>{formatDate(milestone.startDate)} — {formatDate(milestone.endDate)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions button */}
                    <button
                      onClick={() => handleEditClick(milestone)}
                      className="p-2.5 rounded-xl border border-slate-850 hover:border-slate-750 text-slate-450 hover:text-white transition bg-slate-900/10 flex-shrink-0 self-start md:self-center"
                      title="Edit Milestone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* CREATE MILESTONE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Add Milestone</h3>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Release Public Beta v0.9.0"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  placeholder="Summarize key features, releases, or goals for this milestone..."
                  value={description}
                  rows={3}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
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
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MILESTONE MODAL */}
      {selectedMilestone && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">Edit Milestone</h3>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => handleDeleteClick(selectedMilestone._id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/15 transition mr-1"
                  title="Delete Milestone"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedMilestone(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Milestone Title</label>
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
                  rows={3}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs bg-slate-950"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4.5 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel Changes
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 rounded-xl bg-gradient-indigo-purple text-white font-medium hover:opacity-95 text-xs cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
