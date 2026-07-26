import React from 'react';
import { Trello, Table } from 'lucide-react';

export type TaskViewMode = 'kanban' | 'table';

export interface ViewSwitcherProps {
  viewMode: TaskViewMode;
  onViewChange: (mode: TaskViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="inline-flex p-1 bg-slate-900/80 rounded-xl border border-slate-800/80 backdrop-blur-md items-center gap-1 shadow-inner">
      <button
        type="button"
        onClick={() => onViewChange('kanban')}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
          viewMode === 'kanban'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
        title="Switch to Kanban Board View"
      >
        <Trello className="w-3.5 h-3.5" />
        <span>Kanban Board</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange('table')}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
          viewMode === 'table'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
        }`}
        title="Switch to Notion Table View"
      >
        <Table className="w-3.5 h-3.5" />
        <span>Notion Table View</span>
      </button>
    </div>
  );
};
