import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

interface AdminLayoutProps {
  children: ReactNode;
}

interface UserWithRole {
  role: string;
  clerkId: string;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Get current user from Clerk
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  // Connect to database and check user role
  try {
    await connectDB();
    const user = await User.findOne({ clerkId: clerkUser.id }).lean() as UserWithRole | null;
    
    if (!user || user.role !== 'admin') {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error checking admin role:', error);
    redirect('/dashboard');
  }

  return (
    <AdminDashboardLayout>
      {children}
    </AdminDashboardLayout>
  );
}
