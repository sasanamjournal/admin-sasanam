import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getResourceCenters, createResourceCenter, updateResourceCenter, deleteResourceCenter } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface CenterForm {
  name: string
  description: string
  location: string
  url: string
  isPublished: boolean
  order: number
}

const emptyForm: CenterForm = { name: '', description: '', location: '', url: '', isPublished: true, order: 0 }

export default function ResourceCenters() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<CenterForm>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const imgUrl = (photo: string) => {
    if (!photo) return ''
    if (photo.startsWith('http')) return photo
    return `${API}/uploads/${photo}?w=640`
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('location', form.location)
    fd.append('url', form.url)
    fd.append('isPublished', String(form.isPublished))
    fd.append('order', String(form.order))
    if (imageFile) fd.append('image', imageFile)
    if (imageRemoved && !imageFile) fd.append('removeImage', 'true')
    return fd
  }

  const { data, isLoading } = useQuery({
    queryKey: ['resourceCenters'],
    queryFn: () => getResourceCenters().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: () => createResourceCenter(buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resourceCenters'] }); toast.success('Resource center created'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => updateResourceCenter(id, buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resourceCenters'] }); toast.success('Resource center updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteResourceCenter,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resourceCenters'] }); toast.success('Resource center deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm); setShowForm(false); setEditId(null)
    setImageFile(null); setImagePreview(null); setImageRemoved(false); setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({ name: item.name, description: item.description || '', location: item.location || '', url: item.url || '', isPublished: item.isPublished, order: item.order || 0 })
    setEditId(item._id)
    setImageFile(null); setImagePreview(item.imageUrl ? imgUrl(item.imageUrl) : null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('Name is required')
    if (editId) updateMut.mutate(editId)
    else createMut.mutate()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSource(URL.createObjectURL(file))
  }

  const handleCropDone = (croppedFile: File) => {
    setImageFile(croppedFile); setImagePreview(URL.createObjectURL(croppedFile))
    if (cropSource) URL.revokeObjectURL(cropSource); setCropSource(null)
  }

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource); setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Resource Centers</h1>
          <p className="text-sm text-muted mt-1">Manage community resource centers for the Community page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Center
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit Resource Center' : 'Add Resource Center'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Chennai, Tamil Nadu"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Website URL</label>
                  <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Image</label>
                {imagePreview ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-primary/20">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setImageRemoved(true); if (imageRef.current) imageRef.current.value = '' }}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"><HiOutlineX className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                    <HiOutlinePhotograph className="w-5 h-5 text-primary/60" />
                    <span className="text-sm text-muted">Choose image</span>
                    <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded text-primary accent-primary" />
                <span className="text-sm font-semibold text-body">Published</span>
              </label>
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
          {data?.map((item: any) => (
            <div key={item._id} className="bg-card rounded-2xl border border-white/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {item.imageUrl && (
                <div className="h-36 w-full overflow-hidden">
                  <img src={imgUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-body text-base">{item.name}</h3>
                {item.location && <p className="text-xs text-primary font-semibold mt-0.5">{item.location}</p>}
                {item.description && <p className="text-xs text-muted mt-2 line-clamp-2">{item.description}</p>}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-black uppercase ${item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this resource center?')) deleteMut.mutate(item._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted/60">No resource centers yet</div>
          )}
        </div>
      )}

      {cropSource && (
        <ImageCropper image={cropSource} onCropDone={handleCropDone} onCancel={handleCropCancel} aspect={16 / 9} fileName="center-image.jpg" />
      )}
    </div>
  )
}
