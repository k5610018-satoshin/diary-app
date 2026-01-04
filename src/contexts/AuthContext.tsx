"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole } from "@/types/diary";
import * as storage from "@/lib/localStorage";
import { findRegisteredUserByName, registerUser } from "@/lib/localStorage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (name: string, role: UserRole) => void;
  logout: () => void;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからユーザー情報を読み込む
    const savedUser = storage.getUser();
    setUser(savedUser);
    setIsLoading(false);
  }, []);

  const login = (name: string, role: UserRole) => {
    // 既存のユーザーを検索し、存在すればそのIDを使用
    const existingUser = findRegisteredUserByName(name);
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 新規ユーザーを登録
      const registered = registerUser(name);
      userId = registered.id;
    }

    const user: User = {
      id: userId,
      email: `${name}@local`,
      name,
      role,
    };
    storage.saveUser(user);
    setUser(user);
  };

  const logout = () => {
    storage.clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isTeacher: user?.role === "teacher",
        isStudent: user?.role === "student",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
