import React from 'react';
import { Trello, Table, ChevronDown } from 'lucide-react';

export type TaskViewMode = 'kanban' | 'table';

export interface ViewSwitcherProps {
  viewMode: TaskViewMode;
  onViewChange: (mode: TaskViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-semibold cursor-pointer hover:border-slate-700 transition shadow-inner relative">
        {viewMode === 'kanban' ? (
          <Trello className="w-3 h-3 text-indigo-400" />
        ) : (
          <Table className="w-3 h-3 text-indigo-400" />
        )}
        <select
          value={viewMode}
          onChange={(e) => onViewChange(e.target.value as TaskViewMode)}
          className="bg-transparent text-slate-200 outline-none pr-5 pl-0.5 border-none font-semibold text-[11px] cursor-pointer appearance-none relative z-10 focus:ring-0"
        >
          <option value="kanban" className="bg-[#0B0F19] text-slate-250">Kanban Board</option>
          <option value="table" className="bg-[#0B0F19] text-slate-250">Table View</option>
        </select>
        <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
      </div>
    </div>
  );
};
