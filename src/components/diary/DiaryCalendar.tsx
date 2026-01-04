"use client";

import { useState, useMemo } from "react";
import { Diary } from "@/types/diary";
import { DiaryCard } from "./DiaryCard";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";

interface DiaryCalendarProps {
  diaries: Diary[];
  onDiaryClick: (diary: Diary) => void;
  showUserName?: boolean;
}

export function DiaryCalendar({
  diaries,
  onDiaryClick,
  showUserName = false,
}: DiaryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 日付ごとの日記をマッピング
  const diariesByDate = useMemo(() => {
    const map = new Map<string, Diary[]>();
    diaries.forEach((diary) => {
      const dateKey = format(new Date(diary.createdAt), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(diary);
    });
    return map;
  }, [diaries]);

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // 選択された日付の日記
  const selectedDiaries = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return diariesByDate.get(dateKey) || [];
  }, [selectedDate, diariesByDate]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </h2>
        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-xs font-medium py-2 ${
              index === 0
                ? "text-red-500"
                : index === 6
                ? "text-blue-500"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayDiaries = diariesByDate.get(dateKey) || [];
          const hasDiary = dayDiaries.length > 0;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dayOfWeek = day.getDay();

          return (
            <button
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`
                relative aspect-square p-1 rounded-lg transition-all text-sm
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isSelected ? "bg-amber-500 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-700"}
                ${isTodayDate && !isSelected ? "ring-2 ring-amber-400" : ""}
                ${dayOfWeek === 0 && !isSelected ? "text-red-500" : ""}
                ${dayOfWeek === 6 && !isSelected ? "text-blue-500" : ""}
              `}
            >
              <span className="block">{format(day, "d")}</span>
              {hasDiary && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {dayDiaries.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-amber-500"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 選択された日付の日記一覧 */}
      {selectedDate && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
            {format(selectedDate, "M月d日(E)", { locale: ja })}の日記
          </h3>
          {selectedDiaries.length > 0 ? (
            <div className="space-y-3">
              {selectedDiaries.map((diary) => (
                <DiaryCard
                  key={diary.id}
                  diary={diary}
                  onClick={() => onDiaryClick(diary)}
                  showUserName={showUserName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">この日の日記はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
