import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getUsers, updateUser, deleteUser } from '../api/endpoints'
import { usePermissions } from '../hooks/usePermissions'
import { HiOutlineSearch, HiOutlineTrash, HiOutlineDownload, HiOutlineShieldCheck } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  user: { label: 'User', color: 'bg-gray-100 text-gray-600' },
  mentor: { label: 'Mentor', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
}

const ALL_ROLES = ['user', 'mentor', 'admin', 'super_admin'] as const

export default function Users() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [subFilter, setSubFilter] = useState('')
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { can, isSuperAdmin, role: myRole } = usePermissions()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter, subFilter],
    queryFn: () =>
      getUsers({ page, limit: 20, search, role: roleFilter, subscribed: subFilter }).then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
      setEditingRole(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Delete failed'),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  // Determine which roles the current user can assign
  const getAssignableRoles = () => {
    if (isSuperAdmin) return ALL_ROLES
    if (myRole === 'admin') return ['user', 'mentor'] as const
    return [] as const
  }
  const assignableRoles = getAssignableRoles()

  // Can the current user modify this target user's role?
  const canChangeRole = (targetRole: string) => {
    if (!can('users.update')) return false
    if (isSuperAdmin) return true
    if (myRole === 'admin') {
      // Admin cannot change admin or super_admin roles
      return !['admin', 'super_admin'].includes(targetRole)
    }
    return false
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-black text-body">Users</h1>
        <p className="text-sm text-muted mt-1">Manage user accounts, roles, and download access</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 border border-white/30 shadow-sm mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/50" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
            />
          </form>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={subFilter}
            onChange={(e) => { setSubFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Subscribed</option>
            <option value="false">Not Subscribed</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10 bg-cream/50">
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Name</th>
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Email</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Role</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Subscribed</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Download</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Joined</th>
                    {can('users.delete') && (
                      <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data?.users?.map((user: any) => {
                    const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.user
                    const canEdit = canChangeRole(user.role)

                    return (
                      <tr key={user._id} className="border-b border-primary/5 hover:bg-white/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black uppercase">
                              {(user.fullName || '?').charAt(0)}
                            </div>
                            <span className="font-bold text-body capitalize">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{user.email}</td>
                        <td className="px-4 py-3 text-center">
                          {editingRole === user._id && canEdit ? (
                            <select
                              value={user.role}
                              onChange={(e) => {
                                updateMutation.mutate({ id: user._id, body: { role: e.target.value } })
                              }}
                              onBlur={() => setEditingRole(null)}
                              autoFocus
                              className="px-2 py-1 rounded-lg border border-primary/20 text-xs font-bold bg-white focus:outline-none focus:border-primary"
                            >
                              {assignableRoles.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => canEdit && setEditingRole(user._id)}
                              disabled={!canEdit}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider transition-colors ${roleInfo.color} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                            >
                              <HiOutlineShieldCheck className="w-3 h-3" />
                              {roleInfo.label}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider ${
                            user.isSubscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.isSubscribed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {can('users.update') ? (
                            <button
                              onClick={() =>
                                updateMutation.mutate({
                                  id: user._id,
                                  body: { canDownload: !user.canDownload },
                                })
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider transition-colors ${
                                user.canDownload
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <HiOutlineDownload className="w-3 h-3" />
                              {user.canDownload ? 'Enabled' : 'Disabled'}
                            </button>
                          ) : (
                            <span className={`inline-block px-2.5 py-1 rounded-full text-2xs font-black uppercase tracking-wider ${
                              user.canDownload ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <HiOutlineDownload className="w-3 h-3 inline mr-1" />
                              {user.canDownload ? 'Enabled' : 'Disabled'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-muted text-xs">
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        {can('users.delete') && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (confirm('Delete this user?')) deleteMutation.mutate(user._id)
                              }}
                              disabled={['admin', 'super_admin'].includes(user.role) && !isSuperAdmin}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-primary/10">
                <p className="text-xs text-muted">
                  Page {data.page} of {data.totalPages} ({data.total} users)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
