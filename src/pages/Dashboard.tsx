import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/endpoints'
import {
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineGift,
  HiOutlineCurrencyRupee,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineDownload,
} from 'react-icons/hi'

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-3 border-[#8B4513] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: 'Total Users', value: data?.users?.total || 0, icon: HiOutlineUsers, color: 'bg-blue-50 text-blue-600' },
    { label: 'Subscribers', value: data?.users?.subscribed || 0, icon: HiOutlineCheckCircle, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Admins', value: data?.users?.admins || 0, icon: HiOutlineShieldCheck, color: 'bg-purple-50 text-purple-600' },
    { label: 'Download Access', value: data?.users?.withDownloadAccess || 0, icon: HiOutlineDownload, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Subscription Revenue', value: `₹${(data?.subscriptionPayments?.revenue || 0).toLocaleString()}`, icon: HiOutlineCurrencyRupee, color: 'bg-green-50 text-green-600' },
    { label: 'Donation Revenue', value: `₹${(data?.donationPayments?.revenue || 0).toLocaleString()}`, icon: HiOutlineGift, color: 'bg-amber-50 text-amber-600' },
    { label: 'Paid Subscriptions', value: data?.subscriptionPayments?.paid || 0, icon: HiOutlineCreditCard, color: 'bg-teal-50 text-teal-600' },
    { label: 'Failed Payments', value: (data?.subscriptionPayments?.failed || 0) + (data?.donationPayments?.failed || 0), icon: HiOutlineExclamationCircle, color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Dashboard</h1>
        <p className="text-sm text-[#6A5A4A] mt-1">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#4A3B32]">{stat.value}</p>
            <p className="text-xs font-bold text-[#6A5A4A]/70 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-4">Recent Users</h3>
          <div className="space-y-3">
            {data?.recent?.users?.map((user: any) => (
              <div key={user._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-[#8B4513]/10 flex items-center justify-center text-[#8B4513] text-xs font-black uppercase">
                  {(user.fullName || user.email || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{user.fullName}</p>
                  <p className="text-[11px] text-[#6A5A4A] truncate">{user.email}</p>
                </div>
                {user.isSubscribed && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Sub</span>
                )}
              </div>
            ))}
            {(!data?.recent?.users || data.recent.users.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-4">No users yet</p>
            )}
          </div>
        </div>

        {/* Recent Subscription Payments */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-4">Recent Subscriptions</h3>
          <div className="space-y-3">
            {data?.recent?.subscriptionPayments?.map((p: any) => (
              <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/40 transition-colors">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-emerald-500' : p.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{p.userId?.fullName || 'Unknown'}</p>
                  <p className="text-[11px] text-[#6A5A4A]">{p.orderId}</p>
                </div>
                <span className="text-sm font-black text-[#4A3B32]">₹{p.amount}</span>
              </div>
            ))}
            {(!data?.recent?.subscriptionPayments || data.recent.subscriptionPayments.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-4">No payments yet</p>
            )}
          </div>
        </div>

        {/* Recent Donation Payments */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-4">Recent Donations</h3>
          <div className="space-y-3">
            {data?.recent?.donationPayments?.map((p: any) => (
              <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/40 transition-colors">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-emerald-500' : p.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{p.userId?.fullName || 'Unknown'}</p>
                  <p className="text-[11px] text-[#6A5A4A]">{p.orderId}</p>
                </div>
                <span className="text-sm font-black text-[#4A3B32]">₹{p.amount}</span>
              </div>
            ))}
            {(!data?.recent?.donationPayments || data.recent.donationPayments.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-4">No donations yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
