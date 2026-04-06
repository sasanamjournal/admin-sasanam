import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { getBulkBooks, createBulkBook, updateBulkBook, deleteBulkBook, getSections } from '../api/endpoints'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineFilter } from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

interface BulkBookForm {
  bookName: string
  authorName: string
  sectionId: string
  description: string
}

const emptyForm: BulkBookForm = { bookName: '', authorName: '', sectionId: '', description: '' }

export default function BulkBooksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BulkBookForm>(emptyForm)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filterSection, setFilterSection] = useState('')
  const [search, setSearch] = useState('')
  const pdfRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: () => getSections().then((r) => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['bulkbooks', page, filterSection, search],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (filterSection) params.sectionId = filterSection
      if (search) params.search = search
      return getBulkBooks(params).then((r) => r.data.data)
    },
  })
  console.log(data,"data")
  const createMut = useMutation({
    mutationFn: (fd: FormData) => createBulkBook(fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulkbooks'] }); queryClient.invalidateQueries({ queryKey: ['sections'] }); toast.success('Bulk Book added'); resetForm() },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => updateBulkBook(id, fd),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulkbooks'] }); toast.success('Bulk Book updated'); resetForm() },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBulkBook,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bulkbooks'] }); queryClient.invalidateQueries({ queryKey: ['sections'] }); toast.success('Bulk Book deleted') },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Delete failed'),
  })

  const resetForm = () => {
    setForm(emptyForm); setShowForm(false); setEditId(null)
    setPdfFile(null); setCoverImage(null); setCoverPreview(null); setCropSource(null)
    if (pdfRef.current) pdfRef.current.value = ''
    if (coverRef.current) coverRef.current.value = ''
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCropSource(url)
  }

  const handleCropDone = (croppedFile: File) => {
    setCoverImage(croppedFile)
    setCoverPreview(URL.createObjectURL(croppedFile))
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
    if (coverRef.current) coverRef.current.value = ''
  }

  const handleEdit = (item: any) => {
    setForm({
      bookName: item.bookName,
      authorName: item.authorName,
      sectionId: item.sectionId?._id || item.sectionId || '',
      description: item.description || '',
    })
    setEditId(item._id)
    setPdfFile(null)
    setCoverImage(null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(form, pdfFile, coverImage,"datas")
    if (!form.bookName || !form.authorName || !form.sectionId) return toast.error('Book name, author, and section are required')

    const fd = new FormData()
    fd.append('bookName', form.bookName)
    fd.append('authorName', form.authorName)
    fd.append('sectionId', form.sectionId)
    fd.append('description', form.description)
    fd.append('order',"1")
    if (pdfFile) fd.append('pdfFile', pdfFile)
    if (coverImage) fd.append('coverImage', coverImage)
     console.log(fd,"formdata")
    if (editId) updateMut.mutate({ id: editId, fd })
    else createMut.mutate(fd)
  }

  const getSectionName = (book: any) => {
    if (book.sectionId && typeof book.sectionId === 'object') return book.sectionId.name
    const s = sections?.find((s: any) => s._id === book.sectionId)
    return s?.name || 'Unknown'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Bulk Books</h1>
          <p className="text-sm text-muted mt-1">
            Manage bulk books &amp; PDFs {data ? `(${data.total} total)` : ''}
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors">
          <HiOutlinePlus className="w-4 h-4" /> Add Bulk Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search bulk books..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full px-4 py-2.5 rounded-xl bg-card border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
          />
        </div>
        <div className="relative">
          <select
            value={filterSection}
            onChange={(e) => { setFilterSection(e.target.value); setPage(1) }}
            className="appearance-none px-4 py-2.5 pr-10 rounded-xl bg-card border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
          >
            <option value="">All Sections</option>
            {sections?.map((s: any) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <HiOutlineFilter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 pointer-events-none" />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 overflow-y-auto py-6 px-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-white/30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 sticky top-0 bg-card rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-body">{editId ? 'Edit Bulk Book' : 'Add Bulk Book'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary"><HiOutlineX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
              <div>
                <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Book Name</label>
                <input value={form.bookName} onChange={(e) => setForm({ ...form, bookName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Author Name</label>
                  <input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required />
                </div>
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Section</label>
                  <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30" required>
                    <option value="">Select</option>
                    {sections?.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} maxLength={500}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none" />
              </div>

              {/* File Uploads - side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">
                    PDF {editId && '(optional)'}
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                    <HiOutlineDocumentText className="w-4 h-4 text-primary/60 shrink-0" />
                    <span className="text-xs text-muted truncate">{pdfFile ? pdfFile.name : 'Choose PDF'}</span>
                    <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">
                    Cover {editId && '(optional)'}
                  </label>
                  {coverPreview ? (
                    <div className="relative w-full h-20 rounded-lg overflow-hidden border border-primary/20">
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setCoverImage(null); setCoverPreview(null); if (coverRef.current) coverRef.current.value = '' }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                      <HiOutlinePhotograph className="w-4 h-4 text-primary/60 shrink-0" />
                      <span className="text-xs text-muted truncate">Choose image</span>
                      <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={handleCoverSelect} />
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-light transition-colors disabled:opacity-50">
                {(createMut.isPending || updateMut.isPending) ? 'Uploading...' : editId ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Books Table */}
      {isLoading ? (
        <CardGridSkeleton count={6} cols={1} />
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Book</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Author</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Section</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">PDF</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Cover</th>
                    <th className="text-right px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((book: any) => (
                    <tr key={book._id} className="border-b border-primary/5 hover:bg-primary/3 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-body">{book.bookName}</p>
                        </div>
                        {book.description && <p className="text-xs text-muted mt-0.5 line-clamp-1">{book.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-muted">{book.authorName}</td>
                      <td className="px-5 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                          {getSectionName(book)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {book.pdfFile ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <HiOutlineDocumentText className="w-4 h-4" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted/50">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {book.coverImage ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <HiOutlinePhotograph className="w-4 h-4" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted/50">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleEdit(book)} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if (confirm('Delete this bulk book and its files?')) deleteMut.mutate(book._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!data || data.length === 0) && (
              <div className="text-center py-12 text-muted/60">No bulk books found</div>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm font-bold text-body hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-muted">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm font-bold text-body hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {/* Image Cropper Modal */}
      {cropSource && (
        <ImageCropper
          image={cropSource}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
          aspect={3 / 4}
          fileName="cover.jpg"
        />
      )}
    </div>
  )
}
