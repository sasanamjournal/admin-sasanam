import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getNews, createNews, updateNews, deleteNews } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi'
import { TableSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface NewsForm {
  title: string
  content: string
  category: string
  isPublished: boolean
  author: string
}

const emptyForm: NewsForm = { title: '', content: '', category: 'general', isPublished: true, author: 'admin' }

export default function News() {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<NewsForm>(emptyForm)
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
    fd.append('title', form.title)
    fd.append('content', form.content)
    fd.append('category', form.category)
    fd.append('isPublished', String(form.isPublished))
    fd.append('author', form.author)
    if (imageFile) fd.append('image', imageFile)
    if (imageRemoved && !imageFile) fd.append('removeImage', 'true')
    return fd
  }

  const { data, isLoading } = useQuery({
    queryKey: ['news', page],
    queryFn: () => getNews({ page, limit: 20 }).then((r) => r.data.data),
  })

  const createMut = useMutation({
    mutationFn: () => createNews(buildFormData()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] })
      toast.success('News created')
      resetForm()
    },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => updateNews(id, buildFormData()),
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
    setImageFile(null)
    setImagePreview(null)
    setImageRemoved(false)
    setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      content: item.content,
      category: item.category || 'general',
      isPublished: item.isPublished,
      author: item.author || 'admin',
    })
    setEditId(item._id)
    setImageFile(null)
    setImagePreview(item.imageUrl ? imgUrl(item.imageUrl) : null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Title and content required')
    if (editId) {
      updateMut.mutate(editId)
    } else {
      createMut.mutate()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSource(URL.createObjectURL(file))
  }

  const handleCropDone = (croppedFile: File) => {
    setImageFile(croppedFile)
    setImagePreview(URL.createObjectURL(croppedFile))
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    if (imageRef.current) imageRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">News & Events</h1>
          <p className="text-sm text-muted mt-1">Manage news articles and events</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add News
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit News' : 'Add News'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Author</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" />
                </div>
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

      {/* Table */}
      <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10 bg-cream/50">
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Cover</th>
                    <th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-primary/70">Title</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Category</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Author</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Published</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Date</th>
                    <th className="px-4 py-3 text-center text-2xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.news?.map((item: any) => (
                    <tr key={item._id} className="border-b border-primary/5 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        {item.imageUrl ? (
                          <img src={imgUrl(item.imageUrl)} alt="" className="w-14 h-10 rounded-lg object-cover border border-primary/10" />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-cream/60 border border-primary/10 flex items-center justify-center">
                            <HiOutlinePhotograph className="w-4 h-4 text-primary/30" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-body line-clamp-1">{item.title}</p>
                        <p className="text-2xs text-muted line-clamp-1 mt-0.5">{item.content?.substring(0, 80)}...</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-primary/10 text-primary">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted text-xs">{item.author}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-black uppercase ${
                          item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
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
              <div className="flex items-center justify-between px-4 py-3 border-t border-primary/10">
                <p className="text-xs text-muted">Page {data.page} of {data.totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30">Previous</button>
                  <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Cropper */}
      {cropSource && (
        <ImageCropper image={cropSource} onCropDone={handleCropDone} onCancel={handleCropCancel} aspect={16 / 9} fileName="news-image.jpg" />
      )}
    </div>
  )
}
