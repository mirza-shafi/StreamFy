export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="skeleton w-full rounded-xl" style={{ paddingTop: '56.25%' }} />
          <div className="skeleton h-40 rounded-xl" />
        </div>
        <div>
          <div className="skeleton h-6 w-36 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
