"use client";

import { AuthenticateWithRedirectCallback, useSignIn, useSignUp } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    
    // Lưu user vào DB sau khi xác thực thành công
    const handleCallback = async () => {
      if (!isSignInLoaded || !isSignUpLoaded) {
        return;
      }      try {
        if (signUp?.status === "complete" && setActive) {
          
          await setActive({ session: signUp.createdSessionId });
          router.push("/"); // Redirect to home page after successful signup
        } else if (signIn?.status === "complete" && setActive) {
        
          await setActive({ session: signIn.createdSessionId });
          router.push("/"); // Redirect to home page after successful signin
        }
      } catch (error) {
        console.error("Error in callback:", error);
      }
    };

    handleCallback();
  }, [
    signIn?.status,
    signIn?.createdSessionId,
    signUp?.status,
    signUp?.createdSessionId,
    setActive,
    router,
    isSignInLoaded,
    isSignUpLoaded
  ]);

  return <AuthenticateWithRedirectCallback />;
}
