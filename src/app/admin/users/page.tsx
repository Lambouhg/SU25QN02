'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Edit, Shield, UserCheck, MoreVertical, Trash2 } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import DashboardLayout from '@/components/dashboard/AdminDashboardLayout';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import EditUserModal from '@/components/admin/EditUserModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Toast from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';

interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  role: 'admin' | 'user';
  status: string;
  lastLogin: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { refreshRole } = useRole();
  
  // Toast state
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setUpdating(userId);
    try {
      const user = users.find(u => u._id === userId);
      if (!user) return;

      const response = await fetch(`/api/user/${user.clerkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        ));
        
        // Show success toast
        const actionText = newRole === 'admin' ? 'granted admin privileges to' : 'removed admin privileges from';
        showToast(`Successfully ${actionText} ${user.fullName}`, 'success');
        
        // Refresh role cache để cập nhật role ngay lập tức
        await refreshRole();
      } else {
        // Show error toast
        const actionText = newRole === 'admin' ? 'grant admin privileges to' : 'remove admin privileges from';
        showToast(`Failed to ${actionText} ${user.fullName}`, 'error');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      const user = users.find(u => u._id === userId);
      const actionText = newRole === 'admin' ? 'grant admin privileges to' : 'remove admin privileges from';
      showToast(`Failed to ${actionText} ${user?.fullName || 'user'}`, 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleEditUser = async (userData: { firstName: string; lastName: string; email: string; role: 'admin' | 'user' }) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/user/${editingUser.clerkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u._id === editingUser._id ? { 
            ...u, 
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
            fullName: `${userData.firstName} ${userData.lastName}`
          } : u
        ));
        setEditingUser(null);
        
        // Show success toast
        showToast(`Successfully updated ${userData.firstName} ${userData.lastName}`, 'success');
      } else {
        // Show error toast
        showToast(`Failed to update user information`, 'error');
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast(`Failed to update user information`, 'error');
      throw error;
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/user/${deletingUser.clerkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(u => u._id !== deletingUser._id));
        
        // Show success toast
        showToast(`Successfully deleted ${deletingUser.fullName}`, 'success');
        setDeletingUser(null);
      } else {
        // Show error toast
        showToast(`Failed to delete ${deletingUser.fullName}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(`Failed to delete ${deletingUser.fullName}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminRouteGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {users.length} total
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            {user.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.fullName || `${user.firstName} ${user.lastName}`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName || `${user.firstName} ${user.lastName}`}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              User
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <DropdownMenu
                            trigger={
                              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            }
                          >
                            <DropdownMenuItem
                              onClick={() => setEditingUser(user)}
                              className="flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => updateUserRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                              disabled={updating === user._id}
                              className={`flex items-center ${
                                user.role === 'admin'
                                  ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {updating === user._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              ) : (
                                <Shield className="w-4 h-4 mr-2" />
                              )}
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(user)}
                              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
        />

        <ConfirmDeleteModal
          user={deletingUser}
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          loading={deleteLoading}
        />

        {/* Toast Notifications */}
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </DashboardLayout>
    </AdminRouteGuard>
  );
}
