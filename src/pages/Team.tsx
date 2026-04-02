import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'

interface TeamForm {
  name: string
  role: string
  photo: string
  bio: string
  order: number
}

const emptyForm: TeamForm = { name: '', role: '', photo: '', bio: '', order: 0 }

export default function Team() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<TeamForm>(emptyForm)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => getTeam().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: (d: TeamForm) => createTeamMember(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member added'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: TeamForm }) => updateTeamMember(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => { setForm(emptyForm); setShowForm(false); setEditId(null) }

  const handleEdit = (item: any) => {
    setForm({ name: item.name, role: item.role, photo: item.photo || '', bio: item.bio || '', order: item.order || 0 })
    setEditId(item._id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.role) return toast.error('Name and role required')
    if (editId) updateMut.mutate({ id: editId, d: form })
    else createMut.mutate(form)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-[#4A3B32]">Team Members</h1>
          <p className="text-sm text-[#6A5A4A] mt-1">Manage team members shown on the About page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B4513] text-white text-sm font-bold shadow-md hover:bg-[#a0522d] transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-[#fdfaf2] rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-[#8B4513]/10">
              <h2 className="text-lg font-bold text-[#4A3B32]">{editId ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={resetForm} className="p-1 text-[#6A5A4A] hover:text-[#8B4513]"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Photo URL</label>
                <input value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[#8B4513]/70 mb-1.5">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-[#8B4513]/10 text-sm text-[#4A3B32] focus:outline-none focus:border-[#8B4513]/30 resize-none" />
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
          {data?.map((member: any) => (
            <div key={member._id} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-[#8B4513]/10 flex items-center justify-center text-[#8B4513] text-xl font-black uppercase flex-shrink-0 overflow-hidden">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#4A3B32] text-base">{member.name}</h3>
                  <p className="text-xs font-semibold text-[#8B4513]">{member.role}</p>
                  {member.bio && <p className="text-xs text-[#6A5A4A] mt-2 line-clamp-2">{member.bio}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#8B4513]/10">
                <span className="text-[10px] font-bold text-[#6A5A4A]/60 uppercase">Order: {member.order}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(member)} className="p-1.5 rounded-lg text-[#8B4513] hover:bg-[#8B4513]/10 transition-colors">
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this member?')) deleteMut.mutate(member._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full text-center py-12 text-[#6A5A4A]/60">No team members yet</div>
          )}
        </div>
      )}
    </div>
  )
}
