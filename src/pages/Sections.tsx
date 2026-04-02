import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getSections, createSection, updateSection, deleteSection } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'

export default function Sections() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (d: { name: string }) => createSection(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); toast.success('Section added'); resetForm() },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: { name: string } }) => updateSection(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); toast.success('Section updated'); resetForm() },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sections'] }); toast.success('Section deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Delete failed'),
  })

  const resetForm = () => { setName(''); setShowForm(false); setEditId(null) }

  const handleEdit = (item: any) => {
    setName(item.name)
    setEditId(item._id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Section name is required')
    if (editId) updateMut.mutate({ id: editId, d: { name: name.trim() } })
    else createMut.mutate({ name: name.trim() })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Sections</h1>
          <p className="text-sm text-muted mt-1">Manage journal headers / sections</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit Section' : 'Add Section'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Section Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
                  placeholder="e.g. Hiri Sasanam" required />
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-light transition-colors disabled:opacity-50">
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
          {data?.map((section: any) => (
            <div key={section._id} className="bg-card rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black uppercase flex-shrink-0">
                  {section.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-body text-base">{section.name}</h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">{section.bookCount} book(s)</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                <span className="text-2xs font-bold text-muted/60 uppercase">
                  {new Date(section.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(section)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this section?')) deleteMut.mutate(section._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted/60">No sections yet</div>
          )}
        </div>
      )}
    </div>
  )
}
