import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getDonationList, deleteDonation } from '../api/endpoints'
import { HiOutlineTrash } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'

export default function DonationList() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['donation-list', page],
    queryFn: () => getDonationList({ page, limit: 20 }).then((r) => r.data.data),
  })

  const deleteMut = useMutation({
    mutationFn: deleteDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-list'] })
      toast.success('Donation entry deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-black text-body">Donation List</h1>
        <p className="text-sm text-muted mt-1">Public donation records displayed on the homepage</p>
      </div>

      <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10 bg-cream/50">
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Donor Name</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Amount</th>
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Order ID</th>
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Payment ID</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Date</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.donations?.map((d: any) => (
                    <tr key={d._id} className="border-b border-primary/5 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-body">{d.donaterName}</td>
                      <td className="px-4 py-3 text-center font-black text-body">₹{(d.donationAmount / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">{d.orderId}</td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">{d.paymentId}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted">
                        {new Date(d.donationDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { if (confirm('Delete this donation record?')) deleteMut.mutate(d._id) }}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-primary/10">
                <p className="text-xs text-muted">Page {data.page} of {data.totalPages} ({data.total} donations)</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30">Previous</button>
                  <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
