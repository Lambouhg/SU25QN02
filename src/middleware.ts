import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
 
// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/interview(.*)',
  '/profile(.*)',
  '/eq(.*)',
  '/jd(.*)',
  '/saved(.*)',
  '/tracking(.*)',
  '/avatar-interview(.*)',
  '/interview-review(.*)',
  '/payment(.*)',
  '/test(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  
  // Protect routes that require authentication
  if (isProtectedRoute(req) && !userId) {
    return redirectToSignIn();
  }

  return NextResponse.next();
});
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
