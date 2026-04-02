import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getDonationPayments, refundPayment } from '../api/endpoints'
import { HiOutlineSearch, HiOutlineRefresh } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    created: 'bg-amber-100 text-amber-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export default function DonationPayments() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['donation-payments', page, status, search],
    queryFn: () =>
      getDonationPayments({ page, limit: 20, status, search }).then((r) => r.data.data),
  })

  const refundMut = useMutation({
    mutationFn: ({ paymentId }: { paymentId: string }) => refundPayment(paymentId, 'donation'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-payments'] })
      toast.success('Refund initiated successfully')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Refund failed'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Donation Payments</h1>
        <p className="text-sm text-[#6A5A4A] mt-1">All donation payment transactions with donor messages</p>
      </div>

      {/* Filters */}
      <div className="bg-[#fdfaf2] rounded-2xl p-4 border border-white/30 shadow-sm mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1) }} className="flex-1 min-w-[200px] relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A5A4A]/50" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by order ID, payment ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30"
            />
          </form>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="created">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8B4513]/10 bg-[#f4ecd8]/50">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">User</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Order ID</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Payment ID</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Amount</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Message</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Status</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Date</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.payments?.map((p: any) => (
                    <tr key={p._id} className="border-b border-[#8B4513]/5 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#4A3B32] capitalize">{p.userId?.fullName || 'Unknown'}</p>
                        <p className="text-[11px] text-[#6A5A4A]">{p.userId?.email || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-[#6A5A4A] font-mono text-xs">{p.orderId}</td>
                      <td className="px-4 py-3 text-[#6A5A4A] font-mono text-xs">{p.paymentId || '-'}</td>
                      <td className="px-4 py-3 text-center font-black text-[#4A3B32]">₹{p.amount}</td>
                      <td className="px-4 py-3 text-[#6A5A4A] text-xs max-w-[200px] truncate">{p.donorMessage || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          { paid: 'bg-emerald-100 text-emerald-700', failed: 'bg-red-100 text-red-700', created: 'bg-amber-100 text-amber-700' }[p.status as string] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[#6A5A4A]">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status === 'paid' && p.paymentId && (
                          <button
                            onClick={() => {
                              if (confirm(`Refund ₹${p.amount} for donation ${p.orderId}?`))
                                refundMut.mutate({ paymentId: p.paymentId })
                            }}
                            disabled={refundMut.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50 transition-colors disabled:opacity-50"
                          >
                            <HiOutlineRefresh className="w-3.5 h-3.5" />
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#8B4513]/10">
                <p className="text-xs text-[#6A5A4A]">Page {data.page} of {data.totalPages} ({data.total} payments)</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#8B4513] hover:bg-[#8B4513]/10 disabled:opacity-30">Previous</button>
                  <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#8B4513] hover:bg-[#8B4513]/10 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
