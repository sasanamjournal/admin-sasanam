import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getNews, createNews, updateNews, deleteNews } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'

interface NewsForm {
  title: string
  content: string
  category: string
  imageUrl: string
  isPublished: boolean
  author: string
}

const emptyForm: NewsForm = { title: '', content: '', category: 'general', imageUrl: '', isPublished: true, author: 'admin' }

export default function News() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<NewsForm>(emptyForm)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['news', page],
    queryFn: () => getNews({ page, limit: 20 }).then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (data: NewsForm) => createNews(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
      toast.success('News created')
      resetForm()
    },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NewsForm }) => updateNews(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
      toast.success('News updated')
      resetForm()
    },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
      toast.success('News deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
  }

  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      content: item.content,
      category: item.category || 'general',
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
      author: item.author || 'admin',
    })
    setEditId(item._id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content required')
    if (editId) {
      updateMut.mutate({ id: editId, data: form })
    } else {
      createMut.mutate(form)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-[#4A3B32]">News & Events</h1>
          <p className="text-sm text-[#6A5A4A] mt-1">Manage news articles and events</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B4513] text-white text-sm font-bold shadow-md hover:bg-[#a0522d] transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add News
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-[#fdfaf2] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-[#8B4513]/10">
              <h2 className="text-lg font-bold text-[#4A3B32]">{editId ? 'Edit News' : 'Add News'}</h2>
              <button onClick={resetForm} className="p-1 text-[#6A5A4A] hover:text-[#8B4513]">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Author</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded text-[#8B4513] accent-[#8B4513]" />
                <span className="text-sm font-semibold text-[#4A3B32]">Published</span>
              </label>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-3 rounded-xl bg-[#8B4513] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#a0522d] transition-colors disabled:opacity-50">
                {editId ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#8B4513]/10 bg-[#f4ecd8]/50">
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Title</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Category</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Author</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Published</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Date</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#8B4513]/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.news?.map((item: any) => (
                    <tr key={item._id} className="border-b border-[#8B4513]/5 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#4A3B32] line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-[#6A5A4A] line-clamp-1 mt-0.5">{item.content?.substring(0, 80)}...</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B4513]/10 text-[#8B4513]">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#6A5A4A] text-xs">{item.author}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.isPublished ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-[#6A5A4A]">
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-[#8B4513] hover:bg-[#8B4513]/10 transition-colors">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this news?')) deleteMut.mutate(item._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#8B4513]/10">
                <p className="text-xs text-[#6A5A4A]">Page {data.page} of {data.totalPages}</p>
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
