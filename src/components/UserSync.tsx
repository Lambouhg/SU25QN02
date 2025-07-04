"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useUserSync } from "@/context/UserSyncContext";
import { useRole } from "@/context/RoleContext";

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const { syncedUserIds, markUserSynced } = useUserSync();
  const { refreshRole } = useRole();
  const syncInProgress = useRef<Set<string>>(new Set()); // Để track sync đang chạy

  useEffect(() => {
    const saveUserToDB = async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      clerkId: string;
      avatar: string;
    }) => {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
        if (!response.ok) {
          console.error("Failed to save user to database, status:", response.status);
          const errorData = await response.text();
          console.error("Error details:", errorData);
        } else {
          const result = await response.json();
          console.log("✅ User sync completed:", result.action);
          
          // Đánh dấu user này đã được sync bất kể action nào
          markUserSynced(userData.clerkId);
          
          // Refresh role sau khi sync để đảm bảo có role mới nhất
          // Đặc biệt quan trọng cho admin users
          setTimeout(() => {
            refreshRole();
          }, 500); // Small delay để đảm bảo DB đã commit
        }
      } catch (error) {
        console.error("Error saving user:", error);
      } finally {
        // Luôn remove khỏi progress, dù thành công hay thất bại
        syncInProgress.current.delete(userData.clerkId);
      }
    };

    if (
      isLoaded &&
      user &&
      user.id &&
      !syncedUserIds.has(user.id) &&
      !syncInProgress.current.has(user.id)
    ) {
      // Đánh dấu đang sync để tránh duplicate
      syncInProgress.current.add(user.id);
      const userData = {
        email: user.emailAddresses?.[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        clerkId: user.id,
        avatar: user.imageUrl || "",
      };
      // Kiểm tra xem có email không trước khi lưu
      if (userData.email) {
        saveUserToDB(userData);
      } else {
        console.warn("UserSync: User has no email address, skipping save");
        syncInProgress.current.delete(user.id); // Remove from progress nếu skip
      }
    }
  }, [user, isLoaded, syncedUserIds, markUserSynced, refreshRole]);

  // Component này không render gì, chỉ xử lý logic sync
  return null;
}
