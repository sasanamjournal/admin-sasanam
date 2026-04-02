import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFailedPayments } from '../api/endpoints'
import { FailedPaymentsSkeleton } from '../components/Skeletons'

export default function FailedPayments() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['failed-payments', page],
    queryFn: () => getFailedPayments({ page, limit: 20 }).then((r) => r.data.data),
  })

  const renderTable = (title: string, payments: any[], type: string) => (
    <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 shadow-sm overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-[#8B4513]/10 bg-[#f4ecd8]/30">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#8B4513]">
          {title}
          <span className="ml-2 text-xs font-bold text-red-500">
            ({type === 'sub' ? data?.totalSubscriptionFailures : data?.totalDonationFailures} total)
          </span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#8B4513]/10 bg-[#f4ecd8]/50">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">User</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Order ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Payment ID</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Amount</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Currency</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6A5A4A]/60">
                  No failed payments
                </td>
              </tr>
            ) : (
              payments.map((p: any) => (
                <tr key={p._id} className="border-b border-[#8B4513]/5 hover:bg-white/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#4A3B32] capitalize">{p.userId?.fullName || 'Unknown'}</p>
                    <p className="text-[11px] text-[#6A5A4A]">{p.userId?.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-[#6A5A4A] font-mono text-xs">{p.orderId}</td>
                  <td className="px-4 py-3 text-[#6A5A4A] font-mono text-xs">{p.paymentId || '-'}</td>
                  <td className="px-4 py-3 text-center font-black text-red-600">₹{p.amount}</td>
                  <td className="px-4 py-3 text-center text-xs text-[#6A5A4A]">{p.currency}</td>
                  <td className="px-4 py-3 text-center text-xs text-[#6A5A4A]">
                    {new Date(p.createdAt).toLocaleDateString('en-IN')} {new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Failed Payments</h1>
        <p className="text-sm text-[#6A5A4A] mt-1">All failed payment attempts across subscriptions and donations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-red-500/70 mb-1">Total Failed</p>
          <p className="text-3xl font-black text-red-600">{data?.total || 0}</p>
        </div>
        <div className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1">Subscription Failures</p>
          <p className="text-3xl font-black text-[#4A3B32]">{data?.totalSubscriptionFailures || 0}</p>
        </div>
        <div className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1">Donation Failures</p>
          <p className="text-3xl font-black text-[#4A3B32]">{data?.totalDonationFailures || 0}</p>
        </div>
      </div>

      {isLoading ? (
        <FailedPaymentsSkeleton />
      ) : (
        <>
          {renderTable('Failed Subscription Payments', data?.subscriptionFailures || [], 'sub')}
          {renderTable('Failed Donation Payments', data?.donationFailures || [], 'don')}
        </>
      )}
    </div>
  )
}
