"use client";

import { Search, ArrowUpDown, LayoutGrid, List, Calendar } from "lucide-react";
import { SortOrder, ViewMode } from "@/types/diary";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
}: SearchBarProps) {
  const viewModes: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "グリッド" },
    { mode: "list", icon: List, label: "リスト" },
    { mode: "calendar", icon: Calendar, label: "カレンダー" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="日記を検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-300 dark:focus:border-amber-600/50 transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <button
          onClick={() => onSortChange(sortOrder === "newest" ? "oldest" : "newest")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <ArrowUpDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {sortOrder === "newest" ? "新しい順" : "古い順"}
          </span>
        </button>
      </div>

      {/* 表示モード切り替え */}
      <div className="flex items-center gap-1.5 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm p-1.5 rounded-xl w-fit border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm">
        {viewModes.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === mode
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-700/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
