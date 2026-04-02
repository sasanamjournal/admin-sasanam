import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { usePermissions } from '../hooks/usePermissions'
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineGift,
  HiOutlineExclamationCircle,
  HiOutlineHeart,
  HiOutlineNewspaper,
  HiOutlineUserGroup,
  HiOutlinePencil,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineKey,
} from 'react-icons/hi'

// permission required to see each nav item
const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard', end: true, permission: 'dashboard.view' },
  { to: '/users', icon: HiOutlineUsers, label: 'Users', permission: 'users.view' },
  { to: '/payments/subscriptions', icon: HiOutlineCreditCard, label: 'Subscriptions', permission: 'payments.view' },
  { to: '/payments/donations', icon: HiOutlineGift, label: 'Donation Payments', permission: 'payments.view' },
  { to: '/payments/failed', icon: HiOutlineExclamationCircle, label: 'Failed Payments', permission: 'payments.view' },
  { to: '/donation-list', icon: HiOutlineHeart, label: 'Donation List', permission: 'donations.view' },
  { to: '/news', icon: HiOutlineNewspaper, label: 'News', permission: 'news.view' },
  { to: '/team', icon: HiOutlineUserGroup, label: 'Team', permission: 'team.view' },
  { to: '/authors', icon: HiOutlinePencil, label: 'Authors', permission: 'authors.view' },
  { to: '/roles', icon: HiOutlineKey, label: 'Roles & Permissions', permission: 'users.view' },
]

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  mentor: { label: 'Mentor', color: 'bg-blue-500' },
  admin: { label: 'Admin', color: 'bg-purple-500' },
  super_admin: { label: 'Super Admin', color: 'bg-red-500' },
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { can, role, isLoading } = usePermissions()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}') } catch { return {} }
  })()

  // While permissions are loading, show all nav items to avoid flash of empty sidebar
  const visibleNavItems = isLoading ? navItems : navItems.filter((item) => can(item.permission))
  const badge = ROLE_BADGE[role] || null

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login')
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#8B4513]/15">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8B4513] to-[#6B3410] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <span className="text-white font-serif font-black text-lg">S</span>
        </div>
        <div>
          <h1 className="font-serif font-black text-[#8B4513] text-lg tracking-wide">Sasanam</h1>
          <p className="text-[10px] font-bold text-[#8B4513]/60 uppercase tracking-[0.2em]">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-[#8B4513] text-white shadow-md shadow-[#8B4513]/20'
                  : 'text-[#6A5A4A] hover:bg-[#8B4513]/8 hover:text-[#8B4513] hover:translate-x-1'
              } ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`
            }
            style={{ transitionDelay: mounted ? `${i * 40}ms` : '0ms' }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-[#8B4513]/15">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#8B4513] to-[#a0522d] flex items-center justify-center text-white text-xs font-black uppercase shadow-md">
            {(user.fullName || user.email || 'A').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{user.fullName || 'Admin'}</p>
            <p className="text-[11px] text-[#6A5A4A] truncate">{user.email}</p>
            {badge && (
              <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
        >
          <HiOutlineLogout className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#f4ecd8] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#fdfaf2] border-r border-[#8B4513]/10 fixed inset-y-0 left-0 z-30 shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            style={{ animation: 'fadeInUp 0.2s ease-out' }}
          />
          <aside
            className="fixed inset-y-0 left-0 w-72 flex flex-col bg-[#fdfaf2] shadow-2xl z-50"
            style={{ animation: 'fadeInLeft 0.3s ease-out' }}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#6A5A4A] hover:text-[#8B4513] hover:bg-[#8B4513]/10 rounded-lg transition-all"
            >
              <HiOutlineX className="w-6 h-6" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#fdfaf2]/95 backdrop-blur-md border-b border-[#8B4513]/10 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#8B4513] hover:bg-[#8B4513]/10 rounded-lg active:scale-95 transition-all"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8B4513] to-[#6B3410] flex items-center justify-center shadow-sm">
            <span className="text-white font-serif font-black text-sm">S</span>
          </div>
          <h1 className="font-serif font-black text-[#8B4513] text-lg">Sasanam Admin</h1>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
