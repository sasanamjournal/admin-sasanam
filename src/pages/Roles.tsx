import { Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getRoles, updateRole } from '../api/endpoints'
import { usePermissions } from '../hooks/usePermissions'
import { RolesSkeleton } from '../components/Skeletons'
import { HiOutlineShieldCheck } from 'react-icons/hi'

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700 border-gray-200',
  mentor: 'bg-blue-100 text-blue-700 border-blue-200',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  super_admin: 'bg-red-100 text-red-700 border-red-200',
}

// Defines the structure to render: category → list of { label, path }
const PERMISSION_SECTIONS = [
  {
    category: 'Dashboard',
    perms: [{ label: 'View Dashboard & Stats', path: 'dashboard.view' }],
  },
  {
    category: 'Users',
    perms: [
      { label: 'View Users', path: 'users.view' },
      { label: 'Update Users', path: 'users.update' },
      { label: 'Delete Users', path: 'users.delete' },
      { label: 'Create Mentor', path: 'users.create_mentor' },
      { label: 'Create Admin', path: 'users.create_admin' },
      { label: 'Create Super Admin', path: 'users.create_super_admin' },
    ],
  },
  {
    category: 'Payments',
    perms: [
      { label: 'View Payments', path: 'payments.view' },
      { label: 'Refund Payments', path: 'payments.refund' },
    ],
  },
  {
    category: 'Donations',
    perms: [
      { label: 'View Donations', path: 'donations.view' },
      { label: 'Delete Donations', path: 'donations.delete' },
    ],
  },
  {
    category: 'News',
    perms: [
      { label: 'View News', path: 'news.view' },
      { label: 'Create News', path: 'news.create' },
      { label: 'Update News', path: 'news.update' },
      { label: 'Delete News', path: 'news.delete' },
    ],
  },
  {
    category: 'Team',
    perms: [
      { label: 'View Team', path: 'team.view' },
      { label: 'Create Team', path: 'team.create' },
      { label: 'Update Team', path: 'team.update' },
      { label: 'Delete Team', path: 'team.delete' },
    ],
  },
  {
    category: 'Authors',
    perms: [
      { label: 'View Authors', path: 'authors.view' },
      { label: 'Create Authors', path: 'authors.create' },
      { label: 'Update Authors', path: 'authors.update' },
      { label: 'Delete Authors', path: 'authors.delete' },
    ],
  },
  {
    category: 'Frontend',
    perms: [{ label: 'Download PDFs', path: 'frontend.download' }],
  },
]

// Helper: get nested value from permissions object by "section.action"
function getPermValue(permissions: any, path: string): boolean {
  const [section, action] = path.split('.')
  return permissions?.[section]?.[action] === true
}

// Helper: set nested value and return new permissions object
function setPermValue(permissions: any, path: string, value: boolean): any {
  const [section, action] = path.split('.')
  return {
    ...permissions,
    [section]: {
      ...permissions[section],
      [action]: value,
    },
  }
}

export default function Roles() {
  const { role: myRole, isSuperAdmin } = usePermissions()
  const queryClient = useQueryClient()

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles().then((r) => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) => updateRole(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      toast.success('Role updated')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
  })

  const handleToggle = (roleId: string, permissions: any, path: string, currentValue: boolean) => {
    const newPermissions = setPermValue(permissions, path, !currentValue)
    mutation.mutate({ id: roleId, body: { permissions: newPermissions } })
  }

  // Sort roles in the correct order
  const roleOrder = ['user', 'mentor', 'admin', 'super_admin']
  const sortedRoles = roles ? [...roles].sort((a: any, b: any) => roleOrder.indexOf(a.name) - roleOrder.indexOf(b.name)) : []

  if (isLoading) return <RolesSkeleton />

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Roles & Permissions</h1>
        <p className="text-sm text-[#6A5A4A] mt-1">
          {isSuperAdmin ? 'Click any checkbox to toggle permissions. Changes take effect immediately.' : 'Overview of all roles and their permissions.'}
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {sortedRoles.map((r: any) => (
          <div
            key={r._id}
            className={`rounded-2xl border-2 p-5 transition-all ${ROLE_COLORS[r.name] || 'bg-gray-100 text-gray-700 border-gray-200'} ${myRole === r.name ? 'ring-2 ring-offset-2 ring-[#8B4513] scale-[1.02]' : ''}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">{r.label}</h3>
            </div>
            <p className="text-xs font-medium opacity-80">{r.description}</p>
            {myRole === r.name && (
              <span className="inline-block mt-3 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#8B4513] text-white">
                Your Role
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#8B4513]/10 bg-[#f4ecd8]/50 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">Permissions Matrix</h2>
          <span className="text-xs text-[#6A5A4A]">
            {isSuperAdmin && <span className="text-emerald-600 font-bold mr-2">Editable</span>}
            Stored in database
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#8B4513]/10">
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#6A5A4A] min-w-[200px]">Permission</th>
                {sortedRoles.map((r: any) => (
                  <th key={r._id} className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLE_COLORS[r.name] || ''}`}>
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_SECTIONS.map((section) => (
                <Fragment key={section.category}>
                  {/* Category Header */}
                  <tr className="bg-[#f4ecd8]/30">
                    <td colSpan={sortedRoles.length + 1} className="px-5 py-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B4513]/60">{section.category}</span>
                    </td>
                  </tr>
                  {/* Permission Rows */}
                  {section.perms.map((perm) => (
                    <tr key={perm.path} className="border-b border-[#8B4513]/5 hover:bg-white/40 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-[#4A3B32]">{perm.label}</td>
                      {sortedRoles.map((r: any) => {
                        const value = getPermValue(r.permissions, perm.path)
                        const canEdit = isSuperAdmin && r.name !== 'super_admin' // Can't remove super_admin's own permissions
                        return (
                          <td key={r._id} className="px-4 py-3 text-center">
                            {canEdit ? (
                              <button
                                onClick={() => handleToggle(r._id, r.permissions, perm.path, value)}
                                disabled={mutation.isPending}
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                                  value
                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                    : 'bg-red-50 text-red-300 hover:bg-red-100 hover:text-red-400'
                                }`}
                              >
                                {value ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            ) : (
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                                value ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-300'
                              }`}>
                                {value ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
