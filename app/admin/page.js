'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import AdminTable from '@/components/AdminTable'

const CRON_SECRET = 'streamfy_cron_2026'

const MATCH_DEFAULTS = {
  team1: '', team2: '', team1_flag: '', team2_flag: '',
  tournament: '', match_time: '', stream_url: '', stream_url_2: '', stream_url_3: '',
  backup_stream_url: '', status: 'upcoming',
}
const CH_DEFAULTS = {
  name: '', logo_url: '', stream_url: '', stream_url_2: '', stream_url_3: '',
  category: 'Sports', quality: 'HD',
}

const inp = 'w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#e63946] transition-colors placeholder:text-gray-600'
const lbl = 'block text-xs text-gray-400 mb-1'

function StatusBadge({ status }) {
  const map = { live: 'bg-green-900/40 text-green-400 border-green-800', dead: 'bg-red-900/40 text-red-400 border-red-800', unknown: 'bg-gray-800 text-gray-400 border-gray-600' }
  const cls = map[status] || map.unknown
  return <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cls}`}>{status || 'unknown'}</span>
}

function timeAgo(ts) {
  if (!ts) return null
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState('matches')

  // Matches
  const [matches, setMatches] = useState([])
  const [matchForm, setMatchForm] = useState(MATCH_DEFAULTS)
  const [editingMatchId, setEditingMatchId] = useState(null)
  const [matchMsg, setMatchMsg] = useState('')
  const [checkingMatch, setCheckingMatch] = useState(null)
  const [findingMatch, setFindingMatch] = useState(null)

  // Channels
  const [channels, setChannels] = useState([])
  const [chForm, setChForm] = useState(CH_DEFAULTS)
  const [editingChId, setEditingChId] = useState(null)
  const [chMsg, setChMsg] = useState('')
  const [checkingCh, setCheckingCh] = useState(null)
  const [findingCh, setFindingCh] = useState(null)

  // Logs
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({ live: 0, dead: 0, channels: 0, lastCheck: null })
  const [runningCheck, setRunningCheck] = useState(false)

  const fetchAll = useCallback(async () => {
    const [{ data: m }, { data: c }] = await Promise.all([
      supabase.from('matches').select('*').order('created_at', { ascending: false }),
      supabase.from('channels').select('*').order('created_at', { ascending: false }),
    ])
    setMatches(m || [])
    setChannels(c || [])
    setStats({
      live: (m || []).filter(x => x.status === 'live').length,
      dead: [...(m || []), ...(c || [])].filter(x => x.stream_status === 'dead').length,
      channels: (c || []).filter(x => x.is_active).length,
      lastCheck: [...(m || []), ...(c || [])].map(x => x.stream_last_checked).filter(Boolean).sort().pop() || null,
    })
  }, [])

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data } = await supabase.from('stream_logs').select('*').order('created_at', { ascending: false }).limit(50)
    setLogs(data || [])
    setLogsLoading(false)
  }, [])

  useEffect(() => {
    if (authed) { fetchAll(); }
  }, [authed, fetchAll])

  useEffect(() => {
    if (authed && tab === 'logs') fetchLogs()
  }, [authed, tab, fetchLogs])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) { setAuthed(true) }
      else { setAuthError('Incorrect password') }
    } catch { setAuthError('Login failed. Try again.') }
  }

  // MATCHES CRUD
  const fetchMatches = async () => {
    const { data } = await supabase.from('matches').select('*').order('created_at', { ascending: false })
    setMatches(data || [])
  }

  const submitMatch = async (e) => {
    e.preventDefault()
    setMatchMsg('')
    const payload = { ...matchForm }
    if (!payload.match_time) delete payload.match_time

    const { error } = editingMatchId
      ? await supabase.from('matches').update(payload).eq('id', editingMatchId)
      : await supabase.from('matches').insert(payload)

    if (error) { setMatchMsg('Error: ' + error.message); return }
    setMatchMsg(editingMatchId ? 'Updated!' : 'Added!')
    setMatchForm(MATCH_DEFAULTS); setEditingMatchId(null)
    fetchMatches()
    setTimeout(() => setMatchMsg(''), 3000)
  }

  const editMatch = (row) => {
    setEditingMatchId(row.id)
    setMatchForm({
      team1: row.team1 || '', team2: row.team2 || '',
      team1_flag: row.team1_flag || '', team2_flag: row.team2_flag || '',
      tournament: row.tournament || '',
      match_time: row.match_time ? row.match_time.slice(0, 16) : '',
      stream_url: row.stream_url || '', stream_url_2: row.stream_url_2 || '',
      stream_url_3: row.stream_url_3 || '', backup_stream_url: row.backup_stream_url || '',
      status: row.status || 'upcoming',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteMatch = async (id) => {
    if (!confirm('Delete this match?')) return
    await supabase.from('matches').delete().eq('id', id)
    fetchMatches()
  }

  const checkMatchStream = async (match) => {
    setCheckingMatch(match.id)
    try {
      await fetch(`/api/check-streams?matchId=${match.id}`, {
        headers: { Authorization: `Bearer ${CRON_SECRET}` }
      })
      await fetchMatches()
    } catch { }
    setCheckingMatch(null)
  }

  const findMatchStream = async (match) => {
    setFindingMatch(match.id)
    try {
      const res = await fetch('/api/find-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'match', team1: match.team1, team2: match.team2, tournament: match.tournament }),
      })
      const data = await res.json()
      if (data.url) {
        setMatchForm(f => ({ ...f, stream_url: data.url }))
        editMatch({ ...match, stream_url: data.url })
        setMatchMsg(`Found: ${data.url}`)
        setTimeout(() => setMatchMsg(''), 5000)
      } else {
        setMatchMsg('No stream found automatically.')
        setTimeout(() => setMatchMsg(''), 3000)
      }
    } catch { }
    setFindingMatch(null)
  }

  // CHANNELS CRUD
  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('*').order('created_at', { ascending: false })
    setChannels(data || [])
  }

  const submitChannel = async (e) => {
    e.preventDefault()
    setChMsg('')
    const { error } = editingChId
      ? await supabase.from('channels').update(chForm).eq('id', editingChId)
      : await supabase.from('channels').insert(chForm)
    if (error) { setChMsg('Error: ' + error.message); return }
    setChMsg(editingChId ? 'Updated!' : 'Added!')
    setChForm(CH_DEFAULTS); setEditingChId(null)
    fetchChannels()
    setTimeout(() => setChMsg(''), 3000)
  }

  const editChannel = (row) => {
    setEditingChId(row.id)
    setChForm({
      name: row.name || '', logo_url: row.logo_url || '',
      stream_url: row.stream_url || '', stream_url_2: row.stream_url_2 || '',
      stream_url_3: row.stream_url_3 || '', category: row.category || 'Sports', quality: row.quality || 'HD',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteChannel = async (id) => {
    if (!confirm('Delete this channel?')) return
    await supabase.from('channels').delete().eq('id', id)
    fetchChannels()
  }

  const findChannelStream = async (ch) => {
    setFindingCh(ch.id)
    try {
      const res = await fetch('/api/find-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'channel', name: ch.name }),
      })
      const data = await res.json()
      if (data.url) {
        editChannel({ ...ch, stream_url: data.url })
        setChMsg(`Found: ${data.url}`)
        setTimeout(() => setChMsg(''), 5000)
      } else {
        setChMsg('No stream found automatically.')
        setTimeout(() => setChMsg(''), 3000)
      }
    } catch { }
    setFindingCh(null)
  }

  const runGlobalCheck = async () => {
    setRunningCheck(true)
    try {
      await fetch('/api/check-streams', {
        headers: { Authorization: `Bearer ${CRON_SECRET}` }
      })
      await fetchAll()
    } catch { }
    setRunningCheck(false)
  }

  const clearLogs = async () => {
    if (!confirm('Clear all logs?')) return
    await supabase.from('stream_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    fetchLogs()
  }

  // LOGIN
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="text-[#e63946] text-3xl">●</span>
            <h1 className="text-xl font-bold text-white mt-2">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">StreamFy</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={lbl}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className={inp} placeholder="Enter admin password" required autoFocus />
            </div>
            {authError && <p className="text-[#e63946] text-xs">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-red-500 transition-colors">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  // DASHBOARD
  const matchCols = [
    { key: 'team1', label: 'Teams', render: (_, r) => `${r.team1} vs ${r.team2}` },
    { key: 'tournament', label: 'Tournament' },
    { key: 'status', label: 'Status', render: v => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${v === 'live' ? 'bg-red-900/40 text-red-400' : 'bg-gray-800 text-gray-400'}`}>{v}</span>
    )},
    { key: 'stream_status', label: 'Stream', render: (v, r) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={v} />
        {r.stream_auto_updated && <span className="text-xs text-purple-400">🤖 Auto</span>}
        {r.stream_last_checked && <span className="text-xs text-gray-600">{timeAgo(r.stream_last_checked)}</span>}
      </div>
    )},
    { key: 'id', label: 'Actions', render: (_, r) => (
      <div className="flex gap-1 flex-wrap">
        <button onClick={() => checkMatchStream(r)} disabled={checkingMatch === r.id}
          className="px-2 py-1 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded text-xs hover:bg-blue-800/50 disabled:opacity-50">
          {checkingMatch === r.id ? '...' : 'Check'}
        </button>
        <button onClick={() => findMatchStream(r)} disabled={findingMatch === r.id}
          className="px-2 py-1 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded text-xs hover:bg-purple-800/50 disabled:opacity-50">
          {findingMatch === r.id ? '...' : 'Find'}
        </button>
      </div>
    )},
  ]

  const chCols = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'quality', label: 'Quality' },
    { key: 'stream_status', label: 'Stream', render: (v, r) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={v} />
        {r.stream_auto_updated && <span className="text-xs text-purple-400">🤖 Auto</span>}
      </div>
    )},
    { key: 'id', label: 'Actions', render: (_, r) => (
      <button onClick={() => findChannelStream(r)} disabled={findingCh === r.id}
        className="px-2 py-1 bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded text-xs hover:bg-purple-800/50 disabled:opacity-50">
        {findingCh === r.id ? 'Finding...' : 'Auto Find'}
      </button>
    )},
  ]

  const logCols = [
    { key: 'created_at', label: 'Time', render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: 'event_type', label: 'Event', render: v => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${v === 'fixed' ? 'bg-green-900/40 text-green-400' : v === 'dead' ? 'bg-red-900/40 text-red-400' : 'bg-blue-900/40 text-blue-300'}`}>{v}</span>
    )},
    { key: 'message', label: 'Message' },
    { key: 'old_url', label: 'Old URL', render: v => v ? <span className="text-xs text-red-400 truncate block max-w-[120px]">{v}</span> : '—' },
    { key: 'new_url', label: 'New URL', render: v => v ? <span className="text-xs text-green-400 truncate block max-w-[120px]">{v}</span> : '—' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button onClick={() => setAuthed(false)} className="px-4 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]">
          Logout
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Live Matches', value: stats.live, color: 'text-green-400' },
          { label: 'Dead Streams', value: stats.dead, color: 'text-red-400' },
          { label: 'Active Channels', value: stats.channels, color: 'text-blue-400' },
          { label: 'Last Check', value: stats.lastCheck ? timeAgo(stats.lastCheck) : 'Never', color: 'text-gray-300' },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-6">
        <button onClick={runGlobalCheck} disabled={runningCheck}
          className="px-5 py-2.5 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-red-500 disabled:opacity-50 transition-colors text-sm">
          {runningCheck ? '⏳ Checking all streams...' : '▶ Run Stream Check Now'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-[#2a2a2a]">
        {['matches', 'channels', 'logs'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-[#e63946] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t}
            {t === 'matches' && <span className="ml-1.5 text-xs text-gray-600">({matches.length})</span>}
            {t === 'channels' && <span className="ml-1.5 text-xs text-gray-600">({channels.length})</span>}
          </button>
        ))}
      </div>

      {/* MATCHES TAB */}
      {tab === 'matches' && (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-5">{editingMatchId ? '✏️ Edit Match' : '➕ Add Match'}</h2>
            <form onSubmit={submitMatch}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div><label className={lbl}>Team 1 *</label><input className={inp} value={matchForm.team1} onChange={e => setMatchForm({...matchForm, team1: e.target.value})} placeholder="Bangladesh" required /></div>
                <div><label className={lbl}>Team 2 *</label><input className={inp} value={matchForm.team2} onChange={e => setMatchForm({...matchForm, team2: e.target.value})} placeholder="India" required /></div>
                <div><label className={lbl}>Team 1 Flag</label><input className={inp} value={matchForm.team1_flag} onChange={e => setMatchForm({...matchForm, team1_flag: e.target.value})} placeholder="🇧🇩" /></div>
                <div><label className={lbl}>Team 2 Flag</label><input className={inp} value={matchForm.team2_flag} onChange={e => setMatchForm({...matchForm, team2_flag: e.target.value})} placeholder="🇮🇳" /></div>
                <div><label className={lbl}>Tournament</label><input className={inp} value={matchForm.tournament} onChange={e => setMatchForm({...matchForm, tournament: e.target.value})} placeholder="ICC T20 World Cup" /></div>
                <div><label className={lbl}>Match Time</label><input type="datetime-local" className={inp} value={matchForm.match_time} onChange={e => setMatchForm({...matchForm, match_time: e.target.value})} /></div>
                <div><label className={lbl}>Stream URL 1</label><input className={inp} value={matchForm.stream_url} onChange={e => setMatchForm({...matchForm, stream_url: e.target.value})} placeholder="https://... .m3u8 or iframe" /></div>
                <div><label className={lbl}>Stream URL 2</label><input className={inp} value={matchForm.stream_url_2} onChange={e => setMatchForm({...matchForm, stream_url_2: e.target.value})} placeholder="Backup stream URL" /></div>
                <div><label className={lbl}>Stream URL 3</label><input className={inp} value={matchForm.stream_url_3} onChange={e => setMatchForm({...matchForm, stream_url_3: e.target.value})} placeholder="Third backup URL" /></div>
                <div><label className={lbl}>Status</label>
                  <select className={inp} value={matchForm.status} onChange={e => setMatchForm({...matchForm, status: e.target.value})}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              </div>
              {matchMsg && <p className={`text-sm mb-3 ${matchMsg.startsWith('Error') ? 'text-red-400' : matchMsg.startsWith('Found') ? 'text-green-400' : 'text-yellow-400'}`}>{matchMsg}</p>}
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-red-500 transition-colors text-sm">
                  {editingMatchId ? 'Update' : 'Add Match'}
                </button>
                {editingMatchId && (
                  <button type="button" onClick={() => { setEditingMatchId(null); setMatchForm(MATCH_DEFAULTS) }}
                    className="px-5 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm hover:bg-[#3a3a3a]">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <AdminTable columns={matchCols} rows={matches} onEdit={editMatch} onDelete={deleteMatch} />
        </div>
      )}

      {/* CHANNELS TAB */}
      {tab === 'channels' && (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-5">{editingChId ? '✏️ Edit Channel' : '➕ Add Channel'}</h2>
            <form onSubmit={submitChannel}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div><label className={lbl}>Channel Name *</label><input className={inp} value={chForm.name} onChange={e => setChForm({...chForm, name: e.target.value})} placeholder="Sony Sports HD" required /></div>
                <div><label className={lbl}>Logo URL</label><input className={inp} value={chForm.logo_url} onChange={e => setChForm({...chForm, logo_url: e.target.value})} placeholder="https://..." /></div>
                <div><label className={lbl}>Stream URL 1 *</label><input className={inp} value={chForm.stream_url} onChange={e => setChForm({...chForm, stream_url: e.target.value})} placeholder="https://... .m3u8 or iframe" required /></div>
                <div><label className={lbl}>Stream URL 2</label><input className={inp} value={chForm.stream_url_2} onChange={e => setChForm({...chForm, stream_url_2: e.target.value})} placeholder="Backup stream" /></div>
                <div><label className={lbl}>Stream URL 3</label><input className={inp} value={chForm.stream_url_3} onChange={e => setChForm({...chForm, stream_url_3: e.target.value})} placeholder="Third backup" /></div>
                <div><label className={lbl}>Category</label>
                  <select className={inp} value={chForm.category} onChange={e => setChForm({...chForm, category: e.target.value})}>
                    <option>Sports</option><option>News</option><option>Entertainment</option>
                  </select>
                </div>
                <div><label className={lbl}>Quality</label>
                  <select className={inp} value={chForm.quality} onChange={e => setChForm({...chForm, quality: e.target.value})}>
                    <option>HD</option><option>4K</option><option>SD</option>
                  </select>
                </div>
              </div>
              {chMsg && <p className={`text-sm mb-3 ${chMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{chMsg}</p>}
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 bg-[#e63946] text-white rounded-lg font-semibold hover:bg-red-500 text-sm">
                  {editingChId ? 'Update' : 'Add Channel'}
                </button>
                {editingChId && (
                  <button type="button" onClick={() => { setEditingChId(null); setChForm(CH_DEFAULTS) }}
                    className="px-5 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg text-sm">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <AdminTable columns={chCols} rows={channels} onEdit={editChannel} onDelete={deleteChannel} />
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Stream Logs (last 50)</h2>
            <button onClick={clearLogs} className="px-4 py-2 bg-red-900/40 text-red-400 border border-red-800/50 rounded-lg text-sm hover:bg-red-800/50">
              Clear Logs
            </button>
          </div>
          {logsLoading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <AdminTable columns={logCols} rows={logs} onEdit={() => {}} onDelete={() => {}} />
          )}
        </div>
      )}
    </div>
  )
}
