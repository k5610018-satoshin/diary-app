import { Diary, AppSettings, User } from "@/types/diary";

const KEYS = {
  DIARIES: "diary-app-diaries",
  USER: "diary-app-user",
  SETTINGS: "diary-app-settings",
  USER_REGISTRY: "diary-app-user-registry",
} as const;

// ユーザー登録情報（名前とIDの紐付け）
export interface RegisteredUser {
  id: string;
  name: string;
  password: string;
  createdAt: string;
}

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.USER_REGISTRY);
  return data ? JSON.parse(data) : [];
}

export function saveRegisteredUsers(users: RegisteredUser[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.USER_REGISTRY, JSON.stringify(users));
}

export function findRegisteredUserByName(name: string): RegisteredUser | null {
  const users = getRegisteredUsers();
  return users.find((u) => u.name === name) || null;
}

export function registerUser(name: string, password: string): RegisteredUser {
  const users = getRegisteredUsers();
  const newUser: RegisteredUser = {
    id: generateId(),
    name,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveRegisteredUsers(users);
  return newUser;
}

export function verifyUserPassword(name: string, password: string): boolean {
  const user = findRegisteredUserByName(name);
  if (!user) return false;
  return user.password === password;
}

export function getDiaries(): Diary[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.DIARIES);
  return data ? JSON.parse(data) : [];
}

export function saveDiaries(diaries: Diary[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.DIARIES, JSON.stringify(diaries));
}

export function addDiary(diary: Diary): void {
  const diaries = getDiaries();
  diaries.unshift(diary);
  saveDiaries(diaries);
}

export function updateDiary(id: string, updates: Partial<Diary>): Diary | null {
  const diaries = getDiaries();
  const index = diaries.findIndex((d) => d.id === id);
  if (index === -1) return null;

  diaries[index] = { ...diaries[index], ...updates, updatedAt: new Date().toISOString() };
  saveDiaries(diaries);
  return diaries[index];
}

export function deleteDiary(id: string): boolean {
  const diaries = getDiaries();
  const filtered = diaries.filter((d) => d.id !== id);
  if (filtered.length === diaries.length) return false;

  saveDiaries(filtered);
  return true;
}

export function getDiaryById(id: string): Diary | null {
  const diaries = getDiaries();
  return diaries.find((d) => d.id === id) || null;
}

export function getDiariesByUserId(userId: string): Diary[] {
  const diaries = getDiaries();
  return diaries.filter((d) => d.userId === userId);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
}

export function saveUser(user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.USER);
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(KEYS.SETTINGS);
  return data ? JSON.parse(data) : {};
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
