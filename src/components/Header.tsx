import { UserButton} from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <Link className="text-xl font-bold" href="/">
          AI Interview
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
} 