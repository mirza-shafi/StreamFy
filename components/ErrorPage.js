'use client'
export default function ErrorPage({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-gray-400 text-sm mb-6 max-w-sm">{error?.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset}
        className="px-5 py-2.5 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-red-500 transition-colors text-sm">
        Try again
      </button>
    </div>
  )
}
