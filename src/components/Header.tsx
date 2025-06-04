import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-xl font-bold">
          AI Interview
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <SignedIn>
          <UserButton afterSignOutUrl="/"/>
        </SignedIn>
        <SignedOut>
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
          <Link href="/sign-up" className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Sign up
          </Link>
        </SignedOut>
      </div>
    </header>
  );
}
