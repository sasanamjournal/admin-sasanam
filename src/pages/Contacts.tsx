import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getContacts, markContactRead, replyContact, deleteContact } from '../api/endpoints'
import { HiOutlineTrash, HiOutlineX, HiOutlineReply, HiOutlineMail, HiOutlineEye } from 'react-icons/hi'

export default function Contacts() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [replyModal, setReplyModal] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [viewMsg, setViewMsg] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, statusFilter],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      return getContacts(params).then(r => r.data.data)
    },
  })

  const readMut = useMutation({
    mutationFn: markContactRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const replyMut = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyContact(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Reply sent')
      setReplyModal(null)
      setReplyText('')
    },
    onError: () => toast.error('Failed to send reply'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const openView = (msg: any) => {
    setViewMsg(msg)
    if (msg.status === 'new') readMut.mutate(msg._id)
  }

  const statusBadge = (s: string) => {
    const cls = s === 'new' ? 'bg-blue-100 text-blue-700' : s === 'replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
    return <span className={`text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{s}</span>
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Contact Messages</h1>
          <p className="text-sm text-muted mt-1">{data?.total || 0} total messages</p>
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm text-body focus:outline-none">
          <option value="">All</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-border/40 rounded w-40 mb-2" />
              <div className="h-3 bg-border/30 rounded w-60" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.messages?.map((msg: any) => (
            <div key={msg._id}
              className={`bg-card rounded-xl p-5 border transition-all hover:shadow-sm cursor-pointer ${msg.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'border-white/30'}`}
              onClick={() => openView(msg)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-body">{msg.name}</h3>
                    {statusBadge(msg.status)}
                  </div>
                  <p className="text-xs text-muted mb-1">{msg.email}</p>
                  <p className="text-sm text-body line-clamp-1">{msg.message}</p>
                </div>
                <span className="text-2xs text-muted shrink-0">{formatDate(msg.createdAt)}</span>
              </div>
            </div>
          ))}
          {(!data?.messages || data.messages.length === 0) && (
            <div className="text-center py-12 text-muted/60">No messages</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm font-bold text-body disabled:opacity-40">Previous</button>
          <span className="text-sm font-bold text-muted">Page {page} of {data.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
            className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm font-bold text-body disabled:opacity-40">Next</button>
        </div>
      )}

      {/* View Message Modal */}
      {viewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <HiOutlineMail className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-body">Message from {viewMsg.name}</h2>
              </div>
              <button onClick={() => setViewMsg(null)} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">From:</span>
                <span className="font-bold text-body">{viewMsg.email}</span>
                {statusBadge(viewMsg.status)}
              </div>
              <div className="bg-cream/50 rounded-xl p-4">
                <p className="text-sm text-body whitespace-pre-wrap">{viewMsg.message}</p>
              </div>
              <p className="text-2xs text-muted">{formatDate(viewMsg.createdAt)}</p>

              {viewMsg.adminReply && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-2xs font-bold text-emerald-700 mb-1">Your reply ({formatDate(viewMsg.repliedAt)})</p>
                  <p className="text-sm text-body whitespace-pre-wrap">{viewMsg.adminReply}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => { setReplyModal(viewMsg); setViewMsg(null); setReplyText('') }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light transition-colors">
                  <HiOutlineReply className="w-4 h-4" /> Reply
                </button>
                <button onClick={() => { if (confirm('Delete?')) { deleteMut.mutate(viewMsg._id); setViewMsg(null) } }}
                  className="py-2.5 px-4 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-base font-bold text-body">Reply to {replyModal.name}</h2>
              <button onClick={() => setReplyModal(null)} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-cream/50 rounded-xl p-3">
                <p className="text-xs text-muted line-clamp-2">{replyModal.message}</p>
              </div>
              <div>
                <label className="text-xs font-black text-primary uppercase tracking-widest mb-1.5 block">Your Reply</label>
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={5}
                  placeholder="Type your reply..."
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" />
              </div>
              <p className="text-2xs text-muted">Reply will be sent to: {replyModal.email}</p>
              <button onClick={() => { if (replyText.trim()) replyMut.mutate({ id: replyModal._id, reply: replyText }) }}
                disabled={!replyText.trim() || replyMut.isPending}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-light transition-colors disabled:opacity-50">
                {replyMut.isPending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
