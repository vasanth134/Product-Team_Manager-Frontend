import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { 
  Calendar, 
  Send, 
  AlertCircle, 
  FileText,
  Plus,
  X
} from 'lucide-react';

export const Standups: React.FC = () => {
  const { user } = useAuth();
  const { 
    standups, 
    selectedDate, 
    setSelectedDate, 
    submitStandup 
  } = useTeam();

  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Check if current user has already submitted a standup for the selected date
  const myStandup = standups.find(s => s.userId._id === user?.id);

  // Auto-fill values if they want to edit their submitted standup
  useEffect(() => {
    if (myStandup) {
      setYesterday(myStandup.yesterday);
      setToday(myStandup.today);
      setBlockers(myStandup.blockers || '');
    } else {
      setYesterday('');
      setToday('');
      setBlockers('');
    }
  }, [myStandup, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!yesterday.trim() || !today.trim()) {
      setSubmitError('Please describe yesterday and today achievements.');
      return;
    }

    setSubmitLoading(true);
    try {
      await submitStandup(yesterday, today, blockers);
      setShowFormModal(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit standup log');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#070A0F]">
      
      {/* Page Header */}
      <div className="p-4 sm:p-8 border-b border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Daily Standups</h2>
        </div>
        
        {/* Actions bar (Date Selector + Log Button) */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Date Selector input */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass border-slate-800 bg-slate-950/20">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-350 outline-none select-none border-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setSubmitError(null);
              setShowFormModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-indigo-purple hover:opacity-95 font-semibold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-650/15 text-xs transition duration-150 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{myStandup ? 'Update Entry' : 'Log Standup'}</span>
          </button>
        </div>
      </div>

      {/* Primary layout scroll area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-200 font-display">Team Feed</h4>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {standups.length} logged entries
            </span>
          </div>

          <div className="space-y-4">
            {standups.map(standup => {
              const isMe = standup.userId._id === user?.id;
              const hasBlockers = standup.blockers && standup.blockers.trim().length > 0;

              return (
                <div 
                  key={standup._id} 
                  className={`glass-card p-5.5 rounded-2xl border-l-3 transition duration-150 ${hasBlockers ? 'border-l-red-500/80 bg-red-950/2' : isMe ? 'border-l-indigo-500/80' : 'border-l-slate-800'}`}
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={standup.userId.avatarUrl} 
                        alt={standup.userId.name} 
                        className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-250 block">
                          {standup.userId.name} {isMe && <span className="text-[10px] font-semibold text-indigo-400 ml-1">(You)</span>}
                        </span>
                        <span className="text-[9px] text-slate-550 block mt-0.5">
                          Logged at {new Date(standup.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accomplishments sections */}
                  <div className="space-y-3.5 pl-1.5 border-l border-slate-900">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Yesterday</span>
                      <p className="text-xs text-slate-350 mt-1 leading-relaxed">{standup.yesterday}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Today</span>
                      <p className="text-xs text-slate-350 mt-1 leading-relaxed">{standup.today}</p>
                    </div>

                    {hasBlockers && (
                      <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400">
                        <span className="text-[9px] font-extrabold text-red-400 uppercase tracking-wider block flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Blockers</span>
                        </span>
                        <p className="text-xs mt-1 leading-relaxed">{standup.blockers}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {standups.length === 0 && (
              <div className="text-center py-16 px-4 border border-dashed border-slate-850 rounded-2xl space-y-3">
                <FileText className="w-8 h-8 text-slate-650 mx-auto" />
                <div>
                  <h5 className="font-semibold text-slate-400 text-xs uppercase tracking-wider">No Standups Logged</h5>
                  <p className="text-[10px] text-slate-550 max-w-xs mx-auto mt-1">
                    No one has submitted a standup log for {selectedDate} yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP STANDUP FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white font-display">
                {myStandup ? "Update Daily Standup" : "Log Daily Standup"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mb-4">
              {isTodaySelected 
                ? "Broadcast your updates to the team for today." 
                : `Log retrospective details for ${selectedDate}`}
            </p>

            {submitError && (
              <div className="p-2.5 rounded bg-red-950/30 border border-red-900/50 text-red-200 text-xs mb-4">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  1. What did you accomplish yesterday?
                </label>
                <textarea
                  required
                  placeholder="e.g. Set up API endpoints, verified token validations..."
                  value={yesterday}
                  rows={3}
                  onChange={e => setYesterday(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  2. What is your priority for today?
                </label>
                <textarea
                  required
                  placeholder="e.g. Completing Stripe webhooks and mapping product schema..."
                  value={today}
                  rows={3}
                  onChange={e => setToday(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <span>3. Active Blockers?</span>
                  <span className="text-[8px] font-extrabold text-slate-550 lowercase normal-case">(optional)</span>
                </label>
                <textarea
                  placeholder="e.g. Waiting on Stripe API credentials from owner..."
                  value={blockers}
                  rows={2}
                  onChange={e => setBlockers(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-gradient-indigo-purple hover:opacity-95 text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{myStandup ? 'Update Entry' : 'Post Standup'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
