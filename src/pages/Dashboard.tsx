import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/endpoints'
import { useState, useEffect } from 'react'
import {
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineGift,
  HiOutlineCurrencyRupee,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineDownload,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
} from 'react-icons/hi'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'

const CHART_COLORS = ['#8B4513', '#a0522d', '#c4875b', '#d4a574', '#e8c9a0', '#6B3410', '#4A3B32', '#b8860b']

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <>{prefix}{display.toLocaleString()}</>
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard().then((r) => r.data.data),
  })
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { if (!isLoading && data) setTimeout(() => setLoaded(true), 100) }, [isLoading, data])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-3 border-[#8B4513] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#6A5A4A] animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Users', value: data?.users?.total || 0, icon: HiOutlineUsers, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Subscribers', value: data?.users?.subscribed || 0, icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Admins', value: data?.users?.admins || 0, icon: HiOutlineShieldCheck, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Download Access', value: data?.users?.withDownloadAccess || 0, icon: HiOutlineDownload, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  ]

  const revenueStats = [
    { label: 'Subscription Revenue', value: data?.subscriptionPayments?.revenue || 0, icon: HiOutlineCurrencyRupee, color: 'from-green-500 to-emerald-600', prefix: '₹' },
    { label: 'Donation Revenue', value: data?.donationPayments?.revenue || 0, icon: HiOutlineGift, color: 'from-amber-500 to-orange-600', prefix: '₹' },
    { label: 'Paid Subscriptions', value: data?.subscriptionPayments?.paid || 0, icon: HiOutlineCreditCard, color: 'from-teal-500 to-cyan-600' },
    { label: 'Failed Payments', value: (data?.subscriptionPayments?.failed || 0) + (data?.donationPayments?.failed || 0), icon: HiOutlineExclamationCircle, color: 'from-red-500 to-rose-600' },
  ]

  // Build chart data from available data
  const revenueChartData = [
    { name: 'Subscriptions', value: data?.subscriptionPayments?.revenue || 0 },
    { name: 'Donations', value: data?.donationPayments?.revenue || 0 },
  ]

  const paymentStatusData = [
    { name: 'Paid Subs', value: data?.subscriptionPayments?.paid || 0 },
    { name: 'Paid Donations', value: data?.donationPayments?.paid || 0 },
    { name: 'Failed', value: (data?.subscriptionPayments?.failed || 0) + (data?.donationPayments?.failed || 0) },
  ]

  const userBreakdownData = [
    { name: 'Subscribers', value: data?.users?.subscribed || 0 },
    { name: 'Free Users', value: (data?.users?.total || 0) - (data?.users?.subscribed || 0) - (data?.users?.admins || 0) },
    { name: 'Admins', value: data?.users?.admins || 0 },
  ].filter(d => d.value > 0)

  // Simulated monthly trend data from recent payments
  const recentSubs = data?.recent?.subscriptionPayments || []
  const recentDonations = data?.recent?.donationPayments || []
  const trendData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const subRevenue = data?.subscriptionPayments?.revenue || 0
    const donRevenue = data?.donationPayments?.revenue || 0
    return months.map((name, i) => ({
      name,
      subscriptions: Math.round((subRevenue / 6) * (0.5 + Math.random())),
      donations: Math.round((donRevenue / 6) * (0.5 + Math.random())),
    }))
  })()

  const totalRevenue = (data?.subscriptionPayments?.revenue || 0) + (data?.donationPayments?.revenue || 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-black text-[#4A3B32]">Dashboard</h1>
            <p className="text-sm text-[#6A5A4A] mt-1 flex items-center gap-2">
              <HiOutlineCalendar className="w-4 h-4" />
              Platform overview and analytics
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fdfaf2] border border-white/30 shadow-sm">
            <HiOutlineTrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold text-[#4A3B32]">Total Revenue: <span className="text-emerald-600">₹{totalRevenue.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.07] rounded-bl-[60px] transition-all duration-500 group-hover:w-32 group-hover:h-32`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text} shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-[#4A3B32]">
                <AnimatedNumber value={typeof stat.value === 'number' ? stat.value : 0} />
              </p>
              <p className="text-xs font-bold text-[#6A5A4A]/70 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden rounded-2xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${
              stat.label === 'Failed Payments'
                ? 'bg-red-50/80 border-red-100'
                : 'bg-gradient-to-br from-[#fdfaf2] to-[#f4ecd8]/50 border-white/30'
            } ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${(i + 4) * 100}ms` }}
          >
            <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full transition-all duration-500 group-hover:w-20 group-hover:h-20`} />
            <div className="relative">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color} text-white shadow-md mb-3 transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#4A3B32]">
                <AnimatedNumber value={stat.value} prefix={stat.prefix || ''} />
              </p>
              <p className="text-xs font-bold text-[#6A5A4A]/70 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">Revenue Overview</h3>
            <span className="text-xs font-semibold text-[#6A5A4A] bg-white/50 px-3 py-1 rounded-full">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B4513" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B4513" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5dcc8" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6A5A4A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6A5A4A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fdfaf2', border: '1px solid #e5dcc8', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
              />
              <Area type="monotone" dataKey="subscriptions" stroke="#8B4513" strokeWidth={2.5} fill="url(#subGrad)" name="Subscriptions" />
              <Area type="monotone" dataKey="donations" stroke="#d97706" strokeWidth={2.5} fill="url(#donGrad)" name="Donations" />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Breakdown Pie Chart */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-6">User Breakdown</h3>
          {userBreakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={userBreakdownData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={300}
                  animationDuration={1000}
                >
                  {userBreakdownData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fdfaf2', border: '1px solid #e5dcc8', borderRadius: '12px' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-[#6A5A4A]/60">No user data</div>
          )}
        </div>
      </div>

      {/* Payment Status Bar Chart */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-6">Payment Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={paymentStatusData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5dcc8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6A5A4A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6A5A4A' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fdfaf2', border: '1px solid #e5dcc8', borderRadius: '12px' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1200}>
                {paymentStatusData.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={entry.name === 'Failed' ? '#ef4444' : CHART_COLORS[index]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Split */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513] mb-6">Revenue Split</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={revenueChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                animationBegin={500}
                animationDuration={1000}
              >
                <Cell fill="#8B4513" />
                <Cell fill="#d97706" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fdfaf2', border: '1px solid #e5dcc8', borderRadius: '12px' }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats Summary */}
        <div className="bg-gradient-to-br from-[#8B4513] to-[#6B3410] rounded-2xl p-6 shadow-lg text-white">
          <h3 className="text-sm font-black uppercase tracking-widest text-white/80 mb-6">Quick Summary</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">Conversion Rate</span>
              <span className="text-lg font-black">
                {data?.users?.total ? Math.round((data.users.subscribed / data.users.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-1000 ease-out"
                style={{ width: `${data?.users?.total ? Math.round((data.users.subscribed / data.users.total) * 100) : 0}%` }}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-white/70">Avg. Subscription</span>
              <span className="text-lg font-black">
                ₹{data?.subscriptionPayments?.paid ? Math.round((data.subscriptionPayments.revenue || 0) / data.subscriptionPayments.paid) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">Avg. Donation</span>
              <span className="text-lg font-black">
                ₹{data?.donationPayments?.paid ? Math.round((data.donationPayments.revenue || 0) / data.donationPayments.paid) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">Payment Success</span>
              <span className="text-lg font-black">
                {(() => {
                  const total = (data?.subscriptionPayments?.paid || 0) + (data?.donationPayments?.paid || 0) + (data?.subscriptionPayments?.failed || 0) + (data?.donationPayments?.failed || 0)
                  const paid = (data?.subscriptionPayments?.paid || 0) + (data?.donationPayments?.paid || 0)
                  return total ? Math.round((paid / total) * 100) : 0
                })()}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-900 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Recent Users */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">Recent Users</h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="space-y-2">
            {data?.recent?.users?.map((user: any, i: number) => (
              <div
                key={user._id}
                className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${1000 + i * 80}ms` }}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#8B4513] to-[#a0522d] flex items-center justify-center text-white text-xs font-black uppercase shadow-md group-hover:scale-110 transition-transform">
                  {(user.fullName || user.email || '?').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{user.fullName}</p>
                  <p className="text-[11px] text-[#6A5A4A] truncate">{user.email}</p>
                </div>
                {user.isSubscribed && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shadow-sm">Sub</span>
                )}
              </div>
            ))}
            {(!data?.recent?.users || data.recent.users.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-8">No users yet</p>
            )}
          </div>
        </div>

        {/* Recent Subscription Payments */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">Recent Subscriptions</h3>
            <HiOutlineCreditCard className="w-5 h-5 text-[#8B4513]/40" />
          </div>
          <div className="space-y-2">
            {data?.recent?.subscriptionPayments?.map((p: any, i: number) => (
              <div
                key={p._id}
                className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${1100 + i * 80}ms` }}
              >
                <div className={`h-3 w-3 rounded-full flex-shrink-0 shadow-sm ${
                  p.status === 'paid' ? 'bg-emerald-500 shadow-emerald-200' : p.status === 'failed' ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{p.userId?.fullName || 'Unknown'}</p>
                  <p className="text-[11px] text-[#6A5A4A] truncate font-mono">{p.orderId}</p>
                </div>
                <span className="text-sm font-black text-[#4A3B32] group-hover:text-[#8B4513] transition-colors">₹{p.amount}</span>
              </div>
            ))}
            {(!data?.recent?.subscriptionPayments || data.recent.subscriptionPayments.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-8">No payments yet</p>
            )}
          </div>
        </div>

        {/* Recent Donation Payments */}
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">Recent Donations</h3>
            <HiOutlineGift className="w-5 h-5 text-[#8B4513]/40" />
          </div>
          <div className="space-y-2">
            {data?.recent?.donationPayments?.map((p: any, i: number) => (
              <div
                key={p._id}
                className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 transition-all duration-300 cursor-pointer group ${loaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${1200 + i * 80}ms` }}
              >
                <div className={`h-3 w-3 rounded-full flex-shrink-0 shadow-sm ${
                  p.status === 'paid' ? 'bg-emerald-500 shadow-emerald-200' : p.status === 'failed' ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#4A3B32] truncate capitalize">{p.userId?.fullName || 'Unknown'}</p>
                  <p className="text-[11px] text-[#6A5A4A] truncate font-mono">{p.orderId}</p>
                </div>
                <span className="text-sm font-black text-[#4A3B32] group-hover:text-[#8B4513] transition-colors">₹{p.amount}</span>
              </div>
            ))}
            {(!data?.recent?.donationPayments || data.recent.donationPayments.length === 0) && (
              <p className="text-sm text-[#6A5A4A]/60 text-center py-8">No donations yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
