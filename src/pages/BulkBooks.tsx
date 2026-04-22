import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  getBulkBooks, createBulkBook, updateBulkBook, deleteBulkBook,
  initiateUpload, completeUpload, abortUpload, reorderBulkBooks,
} from '../api/endpoints'
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineChevronUp, HiOutlineChevronDown,
} from 'react-icons/hi'
import { CardGridSkeleton } from '../components/Skeletons'
import ImageCropper from '../components/ImageCropper'

const UPLOAD_CONCURRENCY = 3 // parallel chunk uploads

interface BulkBookForm {
  bookName: string
  description: string
}

const emptyForm: BulkBookForm = { bookName: '', description: '' }

export default function BulkBooksPage() {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BulkBookForm>(emptyForm)

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfKey, setPdfKey] = useState<string | null>(null)
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number>(0)
  const [pdfUploading, setPdfUploading] = useState(false)
  const uploadAbortRef = useRef<{ uploadId: string; key: string } | null>(null)

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pdfRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // ── Data ────────────────────────────────────────────────────────────────────
  // Response shape: { data: Book[], total, page, pageSize, totalPages }
  const { data, isLoading } = useQuery({
    queryKey: ['bulkbooks', page, search],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (search) params.search = search
      return getBulkBooks(params).then((r) => r.data) // keep full shape
    },
    staleTime: 0,
  })

  const books: any[] = data?.data ?? []

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (fd: FormData) => createBulkBook(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkbooks'] })
      toast.success('Book added')
      resetForm()
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Create failed'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, fd }: { id: string; fd: FormData }) => updateBulkBook(id, fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkbooks'] })
      toast.success('Book updated')
      resetForm()
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Update failed'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteBulkBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkbooks'] })
      toast.success('Book deleted')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Delete failed'),
  })

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorderBulkBooks(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulkbooks'] }),
    onError: () => toast.error('Reorder failed'),
  })

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditId(null)
    setPdfFile(null)
    setPdfKey(null)
    setPdfUploadProgress(0)
    setPdfUploading(false)
    uploadAbortRef.current = null
    setCoverImage(null)
    setCoverPreview(null)
    setCropSource(null)
    if (pdfRef.current) pdfRef.current.value = ''
    if (coverRef.current) coverRef.current.value = ''
  }

  // ── Direct-to-R2 parallel multipart upload ───────────────────────────────────
  const uploadPdfDirectly = async (file: File): Promise<string | null> => {
    setPdfUploading(true)
    setPdfUploadProgress(0)
    uploadAbortRef.current = null
    try {
      const { data: initData } = await initiateUpload(file.name, file.size, file.type)
      const { uploadId, key, parts, chunkSize } = initData.data
      uploadAbortRef.current = { uploadId, key }

      const completedParts: { PartNumber: number; ETag: string }[] = []
      let done = 0

      // Upload UPLOAD_CONCURRENCY parts in parallel, then next batch
      for (let i = 0; i < parts.length; i += UPLOAD_CONCURRENCY) {
        const batch = parts.slice(i, i + UPLOAD_CONCURRENCY)
        const results = await Promise.all(
          batch.map(async (part: { partNumber: number; url: string }) => {
            const start = (part.partNumber - 1) * chunkSize
            const chunk = file.slice(start, start + chunkSize)
            const res = await fetch(part.url, {
              method: 'PUT',
              body: chunk,
              headers: { 'Content-Type': file.type },
            })
            if (!res.ok) throw new Error(`Part ${part.partNumber} failed: ${res.status}`)
            const etag = res.headers.get('ETag') || res.headers.get('etag')
            if (!etag) throw new Error(`No ETag for part ${part.partNumber}`)
            return { PartNumber: part.partNumber, ETag: etag }
          })
        )
        completedParts.push(...results)
        done += batch.length
        setPdfUploadProgress(Math.round((done / parts.length) * 100))
      }

      await completeUpload(uploadId, key, completedParts)
      setPdfKey(key)
      uploadAbortRef.current = null
      toast.success('PDF uploaded to Cloudflare R2')
      return key
    } catch (err: any) {
      toast.error(err?.message || 'PDF upload failed')
      if (uploadAbortRef.current) {
        abortUpload(uploadAbortRef.current.uploadId, uploadAbortRef.current.key).catch(() => {})
        uploadAbortRef.current = null
      }
      setPdfFile(null)
      setPdfKey(null)
      if (pdfRef.current) pdfRef.current.value = ''
      return null
    } finally {
      setPdfUploading(false)
    }
  }

  // ── Image crop ───────────────────────────────────────────────────────────────
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSource(URL.createObjectURL(file))
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

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = (item: any) => {
    setForm({ bookName: item.bookName, description: item.description || '' })
    setEditId(item._id)
    setPdfFile(null)
    setPdfKey(null)
    setCoverImage(null)
    setCoverPreview(null)
    setShowForm(true)
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bookName) return toast.error('Book name is required')
    if (pdfUploading) return toast.error('PDF is still uploading, please wait')

    let finalPdfKey = pdfKey
    if (pdfFile && !finalPdfKey) {
      finalPdfKey = await uploadPdfDirectly(pdfFile)
      if (!finalPdfKey) return
    }

    const fd = new FormData()
    fd.append('bookName', form.bookName)
    fd.append('description', form.description)
    if (finalPdfKey) fd.append('pdfKey', finalPdfKey)
    if (coverImage) fd.append('coverImage', coverImage)

    if (editId) updateMut.mutate({ id: editId, fd })
    else createMut.mutate(fd)
  }

  // ── Reorder ──────────────────────────────────────────────────────────────────
  const move = (index: number, direction: -1 | 1) => {
    const next = [...books]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderMut.mutate(next.map((b: any) => b._id))
  }

  const isBusy = createMut.isPending || updateMut.isPending

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-serif font-black text-body">Bulk Books</h1>
          <p className="text-sm text-muted mt-1">
            Manage bulk books &amp; PDFs {data ? `(${data.total} total)` : ''}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-light transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" /> Add Bulk Book
        </button>
      </div>

      {/* ── Search ── */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search bulk books..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
        />
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 overflow-y-auto py-6 px-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-white/30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 sticky top-0 bg-card rounded-t-2xl z-10">
              <h2 className="text-base font-bold text-body">{editId ? 'Edit Book' : 'Add Book'}</h2>
              <button onClick={resetForm} className="p-1 text-muted hover:text-primary">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
              <div>
                <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Book Name</label>
                <input
                  value={form.bookName}
                  onChange={(e) => setForm({ ...form, bookName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30"
                  required
                />
              </div>
              <div>
                <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg bg-white/50 border border-primary/10 text-sm text-body focus:outline-none focus:border-primary/30 resize-none"
                />
              </div>

              {/* ── File Uploads ── */}
              <div className="grid grid-cols-2 gap-3">
                {/* PDF */}
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">
                    PDF {editId && '(optional)'}
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-dashed transition-colors ${pdfUploading ? 'border-primary/40 cursor-not-allowed' : 'border-primary/20 cursor-pointer hover:border-primary/40'}`}>
                    <HiOutlineDocumentText className={`w-4 h-4 shrink-0 ${pdfKey ? 'text-green-500' : 'text-primary/60'}`} />
                    <span className="text-xs text-muted truncate">
                      {pdfUploading
                        ? `Uploading… ${pdfUploadProgress}%`
                        : pdfKey
                          ? pdfFile?.name ?? 'Uploaded'
                          : 'Choose PDF'}
                    </span>
                    <input
                      ref={pdfRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      disabled={pdfUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setPdfFile(file)
                        setPdfKey(null)
                        if (file) uploadPdfDirectly(file) // auto-upload immediately
                      }}
                    />
                  </label>
                  {pdfUploading && (
                    <div className="mt-1 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${pdfUploadProgress}%` }}
                      />
                    </div>
                  )}
                  {pdfKey && !pdfUploading && (
                    <p className="mt-1 text-2xs text-green-600 font-bold">✓ Ready to save</p>
                  )}
                </div>

                {/* Cover */}
                <div>
                  <label className="block text-2xs font-black uppercase tracking-widest text-primary/70 mb-1">
                    Cover {editId && '(optional)'}
                  </label>
                  {coverPreview ? (
                    <div className="relative w-full h-20 rounded-lg overflow-hidden border border-primary/20">
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setCoverImage(null); setCoverPreview(null); if (coverRef.current) coverRef.current.value = '' }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 border border-dashed border-primary/20 cursor-pointer hover:border-primary/40 transition-colors">
                      <HiOutlinePhotograph className="w-4 h-4 text-primary/60 shrink-0" />
                      <span className="text-xs text-muted truncate">Choose image</span>
                      <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverSelect} />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || pdfUploading}
                className="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm uppercase tracking-widest hover:bg-primary-light transition-colors disabled:opacity-50"
              >
                {pdfUploading
                  ? `Uploading PDF… ${pdfUploadProgress}%`
                  : isBusy
                    ? 'Saving...'
                    : editId ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {isLoading || deleteMut.isPending ? (
        <CardGridSkeleton count={6} cols={1} />
      ) : (
        <>
          <div className="bg-card rounded-2xl border border-white/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left px-3 py-3 text-xs font-black uppercase tracking-widest text-primary/70 w-16">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Book</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">PDF</th>
                    <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Cover</th>
                    <th className="text-right px-5 py-3 text-xs font-black uppercase tracking-widest text-primary/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book: any, index: number) => (
                    <tr key={book._id} className="border-b border-primary/5 hover:bg-primary/3 transition-colors">
                      {/* ── Reorder buttons ── */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => move(index, -1)}
                            disabled={index === 0 || reorderMut.isPending}
                            className="p-0.5 rounded text-primary/50 hover:text-primary hover:bg-primary/10 disabled:opacity-20 transition-colors"
                            title="Move up"
                          >
                            <HiOutlineChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => move(index, 1)}
                            disabled={index === books.length - 1 || reorderMut.isPending}
                            className="p-0.5 rounded text-primary/50 hover:text-primary hover:bg-primary/10 disabled:opacity-20 transition-colors"
                            title="Move down"
                          >
                            <HiOutlineChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <p className="font-bold text-body">{book.bookName}</p>
                        {book.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{book.description}</p>
                        )}
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
                          <button
                            onClick={() => { if (confirm('Delete this book and its files?')) deleteMut.mutate(book._id) }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {books.length === 0 && (
              <div className="text-center py-12 text-muted/60">No bulk books found</div>
            )}
          </div>

          {/* ── Pagination ── */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-card border border-primary/10 text-sm font-bold text-body hover:bg-primary/5 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-muted">Page {page} of {data.totalPages}</span>
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

      {/* ── Image Cropper ── */}
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
