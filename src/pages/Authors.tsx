import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'

interface AuthorForm {
  name: string
  photo: string
  bookName: string
  order: number
}

const emptyForm: AuthorForm = { name: '', photo: '', bookName: '', order: 0 }

export default function Authors() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<AuthorForm>(emptyForm)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: () => getAuthors().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (d: AuthorForm) => createAuthor(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author added'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: AuthorForm }) => updateAuthor(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAuthor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditId(null) }

  const handleEdit = (item: any) => {
    setForm({ name: item.name, photo: item.photo || '', bookName: item.bookName, order: item.order || 0 })
    setEditId(item._id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.bookName) return toast.error('Name and book name required')
    if (editId) updateMut.mutate({ id: editId, d: form })
    else createMut.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Authors</h1>
          <p className="text-sm text-[#6A5A4A] mt-1">Manage authors shown on the About page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B4513] text-white text-sm font-bold shadow-md hover:bg-[#a0522d] transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Author
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-[#fdfaf2] rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-[#8B4513]/10">
              <h2 className="text-lg font-bold text-[#4A3B32]">{editId ? 'Edit Author' : 'Add Author'}</h2>
              <button onClick={resetForm} className="p-1 text-[#6A5A4A] hover:text-[#8B4513]"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Author Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Book Name</label>
                <input value={form.bookName} onChange={(e) => setForm({ ...form, bookName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Photo URL</label>
                <input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Display Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-3 rounded-xl bg-[#8B4513] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#a0522d] transition-colors disabled:opacity-50">
                {editId ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((author: any) => (
            <div key={author._id} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-[#8B4513]/10 flex items-center justify-center text-[#8B4513] text-xl font-black uppercase flex-shrink-0 overflow-hidden">
                  {author.photo ? (
                    <img src={author.photo} alt={author.name} className="h-full w-full object-cover" />
                  ) : (
                    author.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#4A3B32] text-base">{author.name}</h3>
                  <p className="text-xs font-semibold text-[#8B4513] mt-0.5">{author.bookName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#8B4513]/10">
                <span className="text-[10px] font-bold text-[#6A5A4A]/60 uppercase">Order: {author.order}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(author)} className="p-1.5 rounded-lg text-[#8B4513] hover:bg-[#8B4513]/10 transition-colors">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this author?')) deleteMut.mutate(author._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full text-center py-12 text-[#6A5A4A]/60">No authors yet</div>
          )}
        </div>
      )}
    </div>
  )
}
