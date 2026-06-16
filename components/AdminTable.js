export default function AdminTable({ columns, rows, onEdit, onDelete }) {
  if (!rows?.length) {
    return <p className="text-gray-500 text-center py-8">No records found.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#2a2a2a]">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-gray-300 font-semibold px-4 py-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
            <th className="text-left text-gray-300 font-semibold px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={`border-t border-[#2a2a2a] ${i % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#1e1e1e]'} hover:bg-[#252525] transition-colors`}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[160px] truncate">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(row)}
                    className="px-3 py-1 bg-blue-800/40 text-blue-300 border border-blue-700/50 rounded text-xs hover:bg-blue-700/50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => onDelete(row.id)}
                    className="px-3 py-1 bg-red-900/40 text-red-400 border border-red-800/50 rounded text-xs hover:bg-red-800/50 transition-colors">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
