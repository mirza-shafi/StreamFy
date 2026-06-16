export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-48 rounded mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
      </div>
    </div>
  )
}
