import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface AuthorForm {
  name: string
  bookName: string
  order: number
}

const emptyForm: AuthorForm = { name: '', bookName: '', order: 0 }

export default function Authors() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<AuthorForm>(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: () => getAuthors().then((r) => r.data.data),
  })

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('bookName', form.bookName)
    fd.append('order', String(form.order))
    if (photoFile) fd.append('photo', photoFile)
    return fd
  }

  const createMut = useMutation({
    mutationFn: () => createAuthor(buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author added'); resetForm() },
    onError: () => toast.error('Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: (id: string) => updateAuthor(id, buildFormData()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author updated'); resetForm() },
    onError: () => toast.error('Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAuthor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['authors'] }); toast.success('Author deleted') },
    onError: () => toast.error('Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm); setShowForm(false); setEditId(null)
    setPhotoFile(null); setPhotoPreview(null); setCropSource(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({ name: item.name, bookName: item.bookName, order: item.order || 0 })
    setEditId(item._id)
    setPhotoFile(null)
    setPhotoPreview(item.photo ? `${API}/uploads/${item.photo}?w=360` : null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.bookName) return toast.error('Name and book name required')
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

  const imgUrl = (photo: string, w = 360) => photo ? `${API}/uploads/${photo}?w=${w}` : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Authors</h1>
          <p className="text-sm text-muted mt-1">Manage authors shown on the About page</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Author
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl border border-white/30">
            <div className="flex items-center justify-between p-5 border-b border-primary/10">
              <h2 className="text-lg font-bold text-body">{editId ? 'Edit Author' : 'Add Author'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Author Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary/70 mb-1.5">Book Name</label>
                <input value={form.bookName} onChange={(e) => setForm({ ...form, bookName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              {/* Photo upload */}
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
        <ImageCropper image={cropSource} onCropDone={handleCropDone} onCancel={handleCropCancel} aspect={1} cropShape="round" fileName="photo.jpg" />
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <CardGridSkeleton count={6} cols={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((author: any) => (
            <div key={author._id} className="bg-card rounded-2xl p-5 border border-white/30 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black uppercase flex-shrink-0 overflow-hidden">
                  {author.photo ? (
                    <img src={imgUrl(author.photo)} alt={author.name} className="h-full w-full object-cover" />
                  ) : (
                    author.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-body text-base">{author.name}</h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">{author.bookName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary/10">
                <span className="text-2xs font-bold text-muted/60 uppercase">Order: {author.order}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(author)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
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
            <div className="col-span-full text-center py-12 text-muted/60">No authors yet</div>
          )}
        </div>
      )}
    </div>
  )
}
