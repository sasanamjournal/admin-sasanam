import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface TeamForm {
  name: string
  role: string
  bio: string
  order: number
}

const emptyForm: TeamForm = { name: '', role: '', bio: '', order: 0 }

export default function Team() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<TeamForm>(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => getTeam().then((r) => r.data.data),
  })

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('role', form.role)
    fd.append('bio', form.bio)
    fd.append('order', String(form.order))
    if (photoFile) fd.append('photo', photoFile)
    return fd
  }

  const createMut = useMutation({
    mutationFn: () => createTeamMember(buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member added'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => updateTeamMember(id, buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['team'] }); toast.success('Member deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm); setShowForm(false); setEditId(null)
    setPhotoFile(null); setPhotoPreview(null); setCropSource(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({ name: item.name, role: item.role, bio: item.bio || '', order: item.order || 0 })
    setEditId(item._id)
    setPhotoFile(null)
    setPhotoPreview(item.photo ? imgUrl(item.photo) : null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.role) return toast.error('Name and role required')
    if (editId) updateMut.mutate(editId)
    else createMut.mutate()
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSource(URL.createObjectURL(file))
  }

  const handleCropDone = (croppedFile: File) => {
    setPhotoFile(croppedFile)
    setPhotoPreview(URL.createObjectURL(croppedFile))
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const imgUrl = (photo: string, w = 360) => {
    if (!photo) return ''
    if (photo.startsWith('http')) return photo
    return `${API}/uploads/${photo}?w=${w}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Team Members</h1>
          <p className="text-sm text-muted mt-1">Manage team members shown on the About page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit Member' : 'Add Member'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
                </div>
              </div>
              {/* Photo upload with cropper */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Photo</label>
                {photoPreview ? (
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden border border-primary/20">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (photoRef.current) photoRef.current.value = '' }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"><HiOutlineX className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                    <HiOutlinePhotograph className="w-5 h-5 text-primary/60" />
                    <span className="text-sm text-muted">Choose photo</span>
                    <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Display Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
              </div>
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-light transition-colors disabled:opacity-50">
                {editId ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {cropSource && (
        <ImageCropper image={cropSource} onCropDone={handleCropDone} onCancel={handleCropCancel} aspect={3 / 4} fileName="photo.jpg" />
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((member: any) => (
            <div key={member._id} className="bg-card rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black uppercase flex-shrink-0 overflow-hidden">
                  {member.photo ? (
                    <img src={imgUrl(member.photo)} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-body text-base">{member.name}</h3>
                  <p className="text-xs font-semibold text-primary">{member.role}</p>
                  {member.bio && <p className="text-xs text-muted mt-2 line-clamp-2">{member.bio}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                <span className="text-2xs font-bold text-muted/60 uppercase">Order: {member.order}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(member)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
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
            <div className="col-span-full text-center py-12 text-muted/60">No team members yet</div>
          )}
        </div>
      )}
    </div>
  )
}
