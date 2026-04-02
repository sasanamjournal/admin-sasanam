import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

interface Area {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropperProps {
  image: string
  onCropDone: (croppedFile: File) => void
  onCancel: () => void
  aspect?: number
  cropShape?: 'rect' | 'round'
  fileName?: string
}

// Convert crop area to a canvas blob
async function getCroppedImg(imageSrc: string, pixelCrop: Area, fileName: string): Promise<File> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = reject
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Canvas is empty'))
      resolve(new File([blob], fileName, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

export default function ImageCropper({
  image,
  onCropDone,
  onCancel,
  aspect = 3 / 4,
  cropShape = 'rect',
  fileName = 'cropped.jpg',
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedArea) return
    setSaving(true)
    try {
      const file = await getCroppedImg(image, croppedArea, fileName)
      onCropDone(file)
    } catch {
      // fallback: if crop fails, just pass original
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex flex-col">
      {/* Crop area */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={true}
          style={{
            containerStyle: { background: '#1a1a1a' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-body px-6 py-4 flex items-center gap-4">
        {/* Zoom slider */}
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs text-white/60 shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 accent-primary bg-white/20 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-light disabled:opacity-50 transition-all"
          >
            {saving ? 'Cropping...' : 'Crop & Use'}
          </button>
        </div>
      </div>
    </div>
  )
}
