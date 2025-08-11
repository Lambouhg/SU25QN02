'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Edit, Shield, UserCheck, MoreVertical, Trash2 } from 'lucide-react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import EditUserModal from '@/components/admin/EditUserModal';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import Toast from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';
import { useRoleInvalidation } from '@/hooks/useRoleInvalidation';

interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  imageUrl?: string;
  role: 'admin' | 'user';
  lastActivity?: string;
  isOnline?: boolean;
  clerkSessionActive?: boolean;
  lastSignInAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { loading } = useRole();
  const { refreshRole } = useRole();
  const { broadcastRoleInvalidation } = useRoleInvalidation();

  // Helper function to get user initials
  const getUserInitials = (fullName: string | undefined): string => {
    if (!fullName) return 'U';
    const names = fullName.split(' ').slice(0, 2);
    return (names[0]?.[0] || '') + (names[1]?.[0] || '');
  };

  // Helper function to parse name parts
  const parseNameParts = (fullName: string | undefined) => {
    if (!fullName) return { firstName: '', lastName: '' };
    const parts = fullName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || ''
    };
  };

  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ 
    show: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info' | 'warning' 
  }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to fetch users', 'error');
      }
    };
    
    fetchUsers();
  }, []);

  // Thêm function fetchUsers để có thể gọi lại
  const fetchUsers = async () => {
    try {
      // Clear cache trước khi fetch
      await fetch('/api/user/clear-cache', {
        method: 'POST'
      });
      
      // Thêm timestamp để force refresh
      const timestamp = Date.now();
      const response = await fetch(`/api/user?t=${timestamp}`, {
        cache: 'no-store', // Đảm bảo không cache
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        showToast('Users refreshed successfully', 'success');
      } else {
        showToast('Failed to refresh users', 'error');
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
      showToast('Error refreshing users', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ show: true, message, type });
  };

  const changeUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const actionText = newRole === 'admin' ? 'promote' : 'demote';

    try {
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

        // Trigger role invalidation
        broadcastRoleInvalidation('ROLE_CHANGE');
        refreshRole();
        showToast(`Successfully ${actionText}d ${user.fullName}`, 'success');

        // If the current user's role was changed, trigger a full refresh
        if (user.clerkId === user?.clerkId) {
          window.location.reload();
        }
      } else {
        showToast(`Failed to ${actionText} ${user.fullName}`, 'error');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      showToast(`Failed to ${actionText} ${user?.fullName || 'user'}`, 'error');
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
            email: userData.email,
            role: userData.role,
            fullName: `${userData.firstName} ${userData.lastName}`
          } : u
        ));

        setEditingUser(null);
        showToast(`Successfully updated ${userData.firstName} ${userData.lastName}`, 'success');
      } else {
        showToast('Failed to update user', 'error');
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
        // Fetch lại danh sách users với cache busting
        await fetchUsers();
        
        // Force reload trang để đảm bảo dữ liệu mới nhất
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        showToast(`Successfully deleted ${deletingUser.fullName}`, 'success');
        setDeletingUser(null);
      } else {
        const errorData = await response.json();
        showToast(`Failed to delete ${deletingUser.fullName}: ${errorData.error || 'Unknown error'}`, 'error');
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
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard>
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

          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
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
                          {user.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt={user.fullName}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {getUserInitials(user.fullName)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-3 h-3 mr-1" />
                        ) : (
                          <UserCheck className="w-3 h-3 mr-1" />
                        )}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <DropdownMenu 
                          trigger={
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          }
                        >
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => changeUserRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                          >
                            {user.role === 'admin' ? (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Demote to User
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingUser(user)}
                            className="text-red-600"
                          >
                            {deleteLoading && deletingUser?._id === user._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
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

        <EditUserModal
          user={editingUser ? {
            ...editingUser,
            ...(!editingUser.firstName || !editingUser.lastName ? parseNameParts(editingUser.fullName) : {
              firstName: editingUser.firstName,
              lastName: editingUser.lastName
            })
          } : null}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
        />

        <ConfirmDeleteModal
          user={deletingUser ? {
            ...deletingUser,
            ...(!deletingUser.firstName || !deletingUser.lastName ? parseNameParts(deletingUser.fullName) : {
              firstName: deletingUser.firstName,
              lastName: deletingUser.lastName
            })
          } : null}
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteUser}
          loading={deleteLoading}
        />

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      </div>
    </AdminRouteGuard>
  );
}
