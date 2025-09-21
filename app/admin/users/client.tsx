"use client";

import { useState, JSX } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GlassCard, Badge } from "@/components/glass";
import { useTheme } from "@/lib/themes/provider";
import {
  User,
  Shield,
  UserCheck,
  UserX,
  Save,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

type UserRole = "admin" | "pm" | "developer" | "client" | "user";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminUsersClientProps {
  users: UserData[];
  currentUserId: string;
}

export default function AdminUsersClient({
  users: initialUsers,
  currentUserId,
}: AdminUsersClientProps) {
  const router = useRouter();
  const { clarity } = useTheme();
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const roles: {
    value: UserRole;
    label: string;
    icon: JSX.Element;
    color: string;
  }[] = [
    {
      value: "admin",
      label: "Admin",
      icon: <Shield className="h-4 w-4" />,
      color: "text-red-400",
    },
    {
      value: "pm",
      label: "Project Manager",
      icon: <UserCheck className="h-4 w-4" />,
      color: "text-blue-400",
    },
    {
      value: "developer",
      label: "Developer",
      icon: <User className="h-4 w-4" />,
      color: "text-green-400",
    },
    {
      value: "client",
      label: "Client",
      icon: <UserX className="h-4 w-4" />,
      color: "text-yellow-400",
    },
    {
      value: "user",
      label: "User",
      icon: <User className="h-4 w-4" />,
      color: "text-white/70",
    },
  ];

  const getRoleInfo = (role: string) => {
    return roles.find((r) => r.value === role) || roles[4];
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(userId);
    setUpdateMessage(null);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setUpdateMessage("Role updated successfully");
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        const error = await response.text();
        setUpdateMessage(`Error: ${error}`);
      }
    } catch (error) {
      setUpdateMessage("Failed to update role");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user: ${userEmail}?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(userId);
    setUpdateMessage(null);

    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setUpdateMessage(`User ${userEmail} deleted successfully`);
        setTimeout(() => setUpdateMessage(null), 3000);
      } else {
        const error = await response.json();
        setUpdateMessage(`Error: ${error.error || "Failed to delete user"}`);
      }
    } catch (error) {
      setUpdateMessage("Failed to delete user");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-white/70">Manage user roles and permissions</p>
        </div>

        {/* Success/Error Message */}
        {updateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-xl border ${
              updateMessage.includes("Error")
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-green-500/10 border-green-500/20 text-green-400"
            }`}
          >
            {updateMessage}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {roles.map((role) => {
            const count = users.filter((u) => u.role === role.value).length;
            return (
              <GlassCard key={role.value} clarity={clarity} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`flex items-center gap-2 ${role.color}`}>
                      {role.icon}
                      <span className="text-sm font-medium">{role.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {count}
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Users Table */}
        <GlassCard clarity={clarity} className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Current Role
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Change Role
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Last Updated
                  </th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`border-b border-white/5 ${
                        isCurrentUser ? "bg-white/5" : "hover:bg-white/5"
                      } transition-colors`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {user.name || "No name"}
                              {isCurrentUser && (
                                <Badge className="ml-2 text-xs">You</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white/80 text-sm">
                          {user.email}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className={`flex items-center gap-2 ${roleInfo.color}`}
                        >
                          {roleInfo.icon}
                          <span className="text-sm font-medium">
                            {roleInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as UserRole
                            )
                          }
                          disabled={loading === user.id || isCurrentUser}
                          className={`px-3 py-2 text-sm rounded-lg border ${
                            clarity
                              ? "bg-black/20 border-black/30"
                              : "bg-white/5 border-white/10"
                          } text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 [&>option]:bg-gray-800 ${
                            isCurrentUser ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {loading === user.id && (
                          <RefreshCw className="inline-block ml-2 h-4 w-4 text-purple-400 animate-spin" />
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white/60 text-sm">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white/60 text-sm">
                          {format(new Date(user.updatedAt), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={loading === user.id || isCurrentUser}
                          className={`px-3 py-2 text-sm rounded-lg border transition flex items-center gap-2 ${
                            isCurrentUser
                              ? "opacity-50 cursor-not-allowed bg-gray-500/10 border-gray-500/20 text-gray-400"
                              : clarity
                                ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 hover:border-red-500/40"
                                : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30"
                          }`}
                        >
                          {loading === user.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                Total Users:{" "}
                <span className="font-medium text-white">{users.length}</span>
              </div>
              <button
                onClick={() => router.refresh()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                  clarity
                    ? "border-white/25 bg-white/10 hover:bg-white/15"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                } text-white text-sm`}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
