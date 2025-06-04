import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
 
export default clerkMiddleware(() => {
  return NextResponse.next();
});
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
