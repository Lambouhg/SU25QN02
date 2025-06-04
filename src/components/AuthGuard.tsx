"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const withAuth = (WrappedComponent: React.ComponentType) => {
  return function WithAuth(props: React.ComponentProps<typeof WrappedComponent>) {
    const { user, isLoaded } = useUser();

    useEffect(() => {
      const saveUser = async () => {
        if (!user || !isLoaded) return;

        try {
          // Chuẩn bị dữ liệu từ thông tin user, bao gồm cả thông tin từ Google
          const userData = {
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            avatar: user.imageUrl,
            // Thêm các trường khác từ external accounts nếu có
            ...user.externalAccounts?.[0]?.verification
          };

          console.log("Saving user data:", userData);

          const response = await fetch("/api/user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            throw new Error("Failed to save user to database");
          }

          const savedUser = await response.json();
          console.log("User saved successfully:", savedUser);
        } catch (error) {
          console.error("Error saving user:", error);
        }
      };

      saveUser();
    }, [user, isLoaded]);

    if (!isLoaded) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;