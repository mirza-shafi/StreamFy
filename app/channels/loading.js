export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-40 rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    </div>
  )
}
