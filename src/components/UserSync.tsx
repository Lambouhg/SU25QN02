"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useUserSync } from "@/context/UserSyncContext";

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const { syncedUserIds, markUserSynced } = useUserSync();
  const syncInProgress = useRef<Set<string>>(new Set()); // Để track sync đang chạy

  useEffect(() => {
    const saveUserToDB = async (userData: {
      email: string;
      firstName: string;
      lastName: string;
      clerkId: string;
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
          // Đánh dấu user này đã được sync bất kể action nào
          markUserSynced(userData.clerkId);
          // Log thông tin dựa trên action
          switch (result.action) {
            case "signup":
              console.log("✅ New user created and synced");
              break;
            case "login":
              console.log("✅ Existing user login recorded");
              break;
            case "link":
              console.log("✅ Account linked successfully");
              break;
            default:
              console.log("✅ User sync completed");
          }
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
      console.log("=== UserSync: All conditions met, proceeding to sync ===");
      console.log("UserSync: Detected new user, syncing to database...");
      // Đánh dấu đang sync để tránh duplicate
      syncInProgress.current.add(user.id);
      const userData = {
        email: user.emailAddresses?.[0]?.emailAddress || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        clerkId: user.id,
      };
      console.log("UserSync: userData to be synced:", userData);
      // Kiểm tra xem có email không trước khi lưu
      if (userData.email) {
        saveUserToDB(userData);
      } else {
        console.warn("UserSync: User has no email address, skipping save");
        syncInProgress.current.delete(user.id); // Remove from progress nếu skip
      }
    }
  }, [user, isLoaded, syncedUserIds, markUserSynced]);

  // Component này không render gì, chỉ xử lý logic sync
  return null;
}
