"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Diary, SortOrder, Addition, TeacherComment } from "@/types/diary";
import * as storage from "@/lib/localStorage";

export function useDiaries(userId?: string) {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDiaries = () => {
      const allDiaries = storage.getDiaries();
      const filtered = userId
        ? allDiaries.filter((d) => d.userId === userId)
        : allDiaries;
      setDiaries(filtered);
      setIsLoading(false);
    };

    loadDiaries();
  }, [userId]);

  const addDiary = useCallback(
    (diary: Omit<Diary, "id" | "createdAt" | "updatedAt" | "teacherComments" | "syncStatus" | "images"> & { images?: Diary["images"]; additions?: Diary["additions"] }) => {
      const newDiary: Diary = {
        ...diary,
        id: storage.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: diary.images || [],
        additions: diary.additions || [],
        teacherComments: [],
        syncStatus: "pending",
      };
      storage.addDiary(newDiary);
      setDiaries((prev) => [newDiary, ...prev]);
      return newDiary;
    },
    []
  );

  const updateDiary = useCallback((id: string, updates: Partial<Diary>) => {
    const updated = storage.updateDiary(id, updates);
    if (updated) {
      setDiaries((prev) =>
        prev.map((d) => (d.id === id ? updated : d))
      );
    }
    return updated;
  }, []);

  const deleteDiary = useCallback((id: string) => {
    const success = storage.deleteDiary(id);
    if (success) {
      setDiaries((prev) => prev.filter((d) => d.id !== id));
    }
    return success;
  }, []);

  const addAddition = useCallback((diaryId: string, addition: Omit<Addition, "id" | "createdAt">) => {
    const diary = storage.getDiaryById(diaryId);
    if (!diary) return null;

    const newAddition: Addition = {
      ...addition,
      id: storage.generateId(),
      createdAt: new Date().toISOString(),
    };

    const updated = storage.updateDiary(diaryId, {
      additions: [...diary.additions, newAddition],
    });

    if (updated) {
      setDiaries((prev) =>
        prev.map((d) => (d.id === diaryId ? updated : d))
      );
    }

    return updated;
  }, []);

  const addTeacherComment = useCallback(
    (diaryId: string, comment: Omit<TeacherComment, "id" | "createdAt">) => {
      const diary = storage.getDiaryById(diaryId);
      if (!diary) return null;

      const newComment: TeacherComment = {
        ...comment,
        id: storage.generateId(),
        createdAt: new Date().toISOString(),
      };

      const updated = storage.updateDiary(diaryId, {
        teacherComments: [...diary.teacherComments, newComment],
      });

      if (updated) {
        setDiaries((prev) =>
          prev.map((d) => (d.id === diaryId ? updated : d))
        );
      }

      return updated;
    },
    []
  );

  return {
    diaries,
    isLoading,
    addDiary,
    updateDiary,
    deleteDiary,
    addAddition,
    addTeacherComment,
  };
}

export function useFilteredDiaries(
  diaries: Diary[],
  searchQuery: string,
  sortOrder: SortOrder
) {
  return useMemo(() => {
    let filtered = [...diaries];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.content.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [diaries, searchQuery, sortOrder]);
}
