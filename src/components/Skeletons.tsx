// Reusable skeleton building blocks for admin panel

const Pulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-[#e2c9a0]/40 ${className}`} />
)

// ─── Dashboard ──────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <Pulse className="h-8 w-48 mb-2" />
          <Pulse className="h-4 w-64" />
        </div>
        <Pulse className="h-10 w-56 rounded-xl" />
      </div>
      {/* Stat cards row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30">
            <Pulse className="h-11 w-11 rounded-xl mb-3" />
            <Pulse className="h-8 w-20 mb-2" />
            <Pulse className="h-3 w-28" />
          </div>
        ))}
      </div>
      {/* Stat cards row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30">
            <Pulse className="h-10 w-10 rounded-xl mb-3" />
            <Pulse className="h-7 w-24 mb-2" />
            <Pulse className="h-3 w-28" />
          </div>
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#fdfaf2] rounded-2xl p-6 border border-white/30">
          <Pulse className="h-4 w-40 mb-6" />
          <Pulse className="h-[280px] w-full rounded-xl" />
        </div>
        <div className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30">
          <Pulse className="h-4 w-36 mb-6" />
          <Pulse className="h-[280px] w-full rounded-xl" />
        </div>
      </div>
      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30">
            <Pulse className="h-4 w-36 mb-4" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-3">
                <Pulse className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1">
                  <Pulse className="h-4 w-24 mb-1" />
                  <Pulse className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Table skeleton ─────────────────────────────────────
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-3 border-b border-[#8B4513]/10 bg-[#f4ecd8]/50">
        {[...Array(cols)].map((_, i) => (
          <Pulse key={i} className="h-3 w-20 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#8B4513]/5">
          {i % 3 === 0 && <Pulse className="h-8 w-8 rounded-full shrink-0" />}
          {[...Array(cols - (i % 3 === 0 ? 1 : 0))].map((_, j) => (
            <Pulse key={j} className={`h-4 flex-1 ${j === 0 ? 'max-w-[160px]' : 'max-w-[100px]'}`} />
          ))}
        </div>
      ))}
      {/* Pagination */}
      <div className="flex justify-between px-4 py-3 border-t border-[#8B4513]/10">
        <Pulse className="h-4 w-32" />
        <div className="flex gap-2">
          <Pulse className="h-8 w-20 rounded-lg" />
          <Pulse className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ─── Card grid skeleton (Team, Authors) ─────────────────
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const colClass = cols === 4 ? 'lg:grid-cols-4' : cols === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${colClass} gap-5`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-[#fdfaf2] rounded-2xl p-6 border border-white/30 flex flex-col items-center">
          <Pulse className="h-20 w-20 rounded-full mb-4" />
          <Pulse className="h-5 w-32 mb-2" />
          <Pulse className="h-3 w-24 mb-1" />
          <Pulse className="h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

// ─── Roles page skeleton ────────────────────────────────
export function RolesSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <Pulse className="h-8 w-56 mb-2" />
        <Pulse className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border-2 border-[#e2c9a0]/40 p-5">
            <Pulse className="h-5 w-24 mb-2" />
            <Pulse className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="bg-[#fdfaf2] rounded-2xl border border-white/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-[#8B4513]/10 bg-[#f4ecd8]/50">
          <Pulse className="h-4 w-44" />
        </div>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-[#8B4513]/5">
            <Pulse className="h-4 w-40 flex-1" />
            {[...Array(4)].map((_, j) => (
              <Pulse key={j} className="h-7 w-7 rounded-lg shrink-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Failed payments skeleton ───────────────────────────
export function FailedPaymentsSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#fdfaf2] rounded-2xl p-5 border border-white/30">
            <Pulse className="h-3 w-24 mb-3" />
            <Pulse className="h-8 w-16" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} cols={6} />
    </div>
  )
}
