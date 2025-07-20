"use client";

import { useSignUp, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user, isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't render if user is signed in (will redirect)
  if (isSignedIn) {
    return null;
  }

  const saveUserToDatabase = async (userData: { 
    email: string, 
    firstName: string, 
    lastName: string, 
    clerkId: string,
    avatar?: string 
  }) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    
    try {
      // Tạo tài khoản với email, password, firstName, lastName
      const signUpData = {
        emailAddress: email,
        password,
        firstName,
        lastName
      };

      const result = await signUp.create(signUpData);

      if (result.status === "complete") {
        // Lưu user data vào database
        await saveUserToDatabase({
          email: email,
          firstName: firstName,
          lastName: lastName,
          clerkId: result.createdUserId as string,
        });
        
        await setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        // Nếu cần xác thực email
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("email address is taken")) {
          setErrorMessage("This email address is already registered. Please try another or sign in.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setErrorMessage("Please enter the verification code.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Save user data to database với thông tin đã nhập
        await saveUserToDatabase({
          email: email,
          firstName: firstName || result.firstName || "",
          lastName: lastName || result.lastName || "",
          clerkId: result.createdUserId as string,
        });
        
        await setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        setErrorMessage("Verification failed. Please check the code and try again.");
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("incorrect code")) {
          setErrorMessage("The verification code is incorrect. Please try again.");
        } else if (error.message.includes("expired")) {
          setErrorMessage("The verification code has expired. Please request a new one.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
      
      // Note: The actual user data saving will happen in the sso-callback page
      // since Google OAuth flow redirects the user after successful authentication
      
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to initialize Google Sign In");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div id="clerk-captcha" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {pendingVerification ? "Check your email" : "Create your account"}
        </h2>
        {pendingVerification && (
          <p className="mt-2 text-center text-sm text-gray-600">
            We have sent a verification code to {email}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleSignInWithGoogle}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 mb-6"
          >
            <Image src="/google.svg" alt="Google logo" width={20} height={20} />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {!pendingVerification ? (
            // Form đăng ký
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </button>
              </div>
            </form>
          ) : (
            // Form xác thực email
            <form className="space-y-6" onSubmit={verifyEmail}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification code
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter the 6-digit code"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </button>
              </div>
            </form>
          )}

          {pendingVerification && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mt-4">
                Did not receive the code? Check your spam folder or try signing up again.
              </p>
              <button
                onClick={() => setPendingVerification(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-500"
              >
                Try again with a different email
              </button>
            </div>
          )}

          {!pendingVerification && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/sign-in"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
