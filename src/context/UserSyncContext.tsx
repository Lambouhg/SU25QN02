"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface UserSyncContextType {
  syncedUserIds: Set<string>;
  markUserSynced: (userId: string) => void;
}

const STORAGE_KEY = "syncedUserIds";

const UserSyncContext = createContext<UserSyncContextType | undefined>(undefined);

export const UserSyncProvider = ({ children }: { children: ReactNode }) => {
  const [syncedUserIds, setSyncedUserIds] = useState<Set<string>>(new Set());

  // Load từ localStorage khi mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            setSyncedUserIds(new Set(arr));
          }
        } catch {}
      }
    }
  }, []);

  // Lưu vào localStorage khi syncedUserIds thay đổi
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(syncedUserIds)));
    }
  }, [syncedUserIds]);

  const markUserSynced = (userId: string) => {
    setSyncedUserIds(prev => {
      const newSet = new Set(prev);
      newSet.add(userId);
      return newSet;
    });
  };

  return (
    <UserSyncContext.Provider value={{ syncedUserIds, markUserSynced }}>
      {children}
    </UserSyncContext.Provider>
  );
};

export const useUserSync = () => {
  const context = useContext(UserSyncContext);
  if (!context) {
    throw new Error("useUserSync must be used within a UserSyncProvider");
  }
  return context;
};
