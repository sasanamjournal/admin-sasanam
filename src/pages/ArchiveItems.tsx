import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getArchiveItems, createArchiveItem, updateArchiveItem, deleteArchiveItem } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface ArchiveForm {
  title: string
  period: string
  content: string
  isPublished: boolean
  order: number
}

const emptyForm: ArchiveForm = { title: '', period: '', content: '', isPublished: true, order: 0 }

export default function ArchiveItems() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ArchiveForm>(emptyForm)
  // Multi-image state
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cropSource, setCropSource] = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const imgUrl = (photo: string) => {
    if (!photo) return ''
    if (photo.startsWith('http')) return photo
    if (photo.startsWith('blob:')) return photo
    return `${API}/uploads/${photo}?w=640`
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('period', form.period)
    fd.append('content', form.content)
    fd.append('isPublished', String(form.isPublished))
    fd.append('order', String(form.order))
    // Existing images to keep
    existingImages.forEach((img) => fd.append('existingImages', img))
    // New files to upload
    newFiles.forEach((file) => fd.append('images', file))
    return fd
  }

  const { data, isLoading } = useQuery({
    queryKey: ['archiveItems'],
    queryFn: () => getArchiveItems().then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: () => createArchiveItem(buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['archiveItems'] }); toast.success('Archive item created'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => updateArchiveItem(id, buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['archiveItems'] }); toast.success('Archive item updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteArchiveItem,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['archiveItems'] }); toast.success('Archive item deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm); setShowForm(false); setEditId(null)
    newPreviews.forEach((p) => URL.revokeObjectURL(p))
    setNewFiles([]); setNewPreviews([]); setExistingImages([])
    setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({ title: item.title, period: item.period || '', content: item.content, isPublished: item.isPublished, order: item.order || 0 })
    setEditId(item._id)
    setExistingImages(item.images || [])
    setNewFiles([]); setNewPreviews([])
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content required')
    if (editId) updateMut.mutate(editId)
    else createMut.mutate()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSource(URL.createObjectURL(file))
  }

  const handleCropDone = (croppedFile: File) => {
    const preview = URL.createObjectURL(croppedFile)
    setNewFiles((prev) => [...prev, croppedFile])
    setNewPreviews((prev) => [...prev, preview])
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource); setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const removeExisting = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const totalImages = existingImages.length + newFiles.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Archive</h1>
          <p className="text-sm text-muted mt-1">Manage historical archive items for the Archive page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Archive Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit Archive Item' : 'Add Archive Item'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Period / Era</label>
                <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. Chola Dynasty (848–1279 CE)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
              </div>

              {/* Multi-image upload */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">
                  Images <span className="text-muted font-normal normal-case tracking-normal">({totalImages}/10)</span>
                </label>

                {/* Preview grid */}
                {(existingImages.length > 0 || newPreviews.length > 0) && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {existingImages.map((img, i) => (
                      <div key={`ex-${i}`} className="relative h-20 rounded-lg overflow-hidden border border-primary/20">
                        <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeExisting(i)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newPreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative h-20 rounded-lg overflow-hidden border border-primary/20 ring-2 ring-emerald-300">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeNew(i)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70">
                          <HiOutlineX className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {totalImages < 10 && (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                    <HiOutlinePhotograph className="w-5 h-5 text-primary/60" />
                    <span className="text-sm text-muted">Add image</span>
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

      {/* Table */}
      <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-cream/50">
                  <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Images</th>
                  <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Title</th>
                  <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Period</th>
                  <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Published</th>
                  <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Date</th>
                  <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item: any) => {
                  const imgs = item.images || []
                  return (
                    <tr key={item._id} className="border-b border-primary/5 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        {imgs.length > 0 ? (
                          <div className="flex items-center -space-x-2">
                            {imgs.slice(0, 3).map((img: string, i: number) => (
                              <img key={i} src={imgUrl(img)} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-card" />
                            ))}
                            {imgs.length > 3 && (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-card flex items-center justify-center text-2xs font-black text-primary">
                                +{imgs.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-cream/60 border border-primary/10 flex items-center justify-center">
                            <HiOutlinePhotograph className="w-4 h-4 text-primary/30" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-body line-clamp-1">{item.title}</p>
                        <p className="text-2xs text-muted line-clamp-1 mt-0.5">{item.content?.substring(0, 80)}...</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-primary/10 text-primary">{item.period || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-black uppercase ${item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {item.isPublished ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted">
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this archive item?')) deleteMut.mutate(item._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!data || data.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted/60">No archive items yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cropSource && (
        <ImageCropper image={cropSource} onCropDone={handleCropDone} onCancel={handleCropCancel} aspect={16 / 9} fileName="archive-image.jpg" />
      )}
    </div>
  )
}
