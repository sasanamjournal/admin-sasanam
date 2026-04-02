import { useQuery } from '@tanstack/react-query'
import { getMyPermissions } from '../api/endpoints'

interface PermissionsData {
  role: string
  permissions: string[]
}

export function usePermissions() {
  const { data, isLoading } = useQuery<PermissionsData>({
    queryKey: ['permissions'],
    queryFn: () => getMyPermissions().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const can = (permission: string): boolean => {
    if (!data) return false
    return data.permissions.includes(permission)
  }

  return {
    role: data?.role || '',
    permissions: data?.permissions || [],
    can,
    isLoading,
    isSuperAdmin: data?.role === 'super_admin',
    isAdmin: data?.role === 'admin',
    isMentor: data?.role === 'mentor',
  }
}
