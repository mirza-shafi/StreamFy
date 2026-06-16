export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-40 rounded mb-6" />
      <div className="flex gap-3 mb-6">
        <div className="skeleton h-10 w-64 rounded-xl" />
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
      </div>
    </div>
  )
}
