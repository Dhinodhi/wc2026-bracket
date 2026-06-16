import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import {
  GROUPS, getGroupMatches, ALL_MATCHES,
  LOCKED_IDS, POINTS, scoreGroupPick, calcTotal, MATCH_TIMES
} from './data'
import { generateBracketPDF } from './generatePDF'

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  bg: '#030b1a',
  surface: '#0a1628',
  surfaceHi: '#0e1e38',
  border: 'rgba(255,255,255,0.08)',
  borderBlue: 'rgba(21,101,192,0.4)',
  blue: '#1565c0',
  blueBright: '#1976d2',
  blueLight: '#90caf9',
  text: '#e8edf8',
  textMuted: '#6b7fa3',
  textDim: '#3a4f72',
  green: '#00e676',
  greenDark: '#001a00',
  gold: '#ffd600',
  amber: '#ffb300',
  red: '#ef5350',
}

const font = "'Inter', 'Segoe UI', sans-serif"

// ── FETCH RESULTS ──────────────────────────────────────────────────────────

async function fetchResults() {
  const { data } = await supabase.from('results').select('match_id, home, away')
  const map = {}
  ;(data || []).forEach(r => { map[r.match_id] = { home: r.home, away: r.away } })
  return map
}

// ── SMALL COMPONENTS ───────────────────────────────────────────────────────

function Btn({ children, onClick, variant = 'primary', disabled, style = {} }) {
  const base = {
    padding: '11px 20px',
    borderRadius: 8,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: font,
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }
  const variants = {
    primary: { background: C.blue, color: '#fff' },
    secondary: { background: C.surfaceHi, color: C.blueLight, border: `1px solid ${C.borderBlue}` },
    ghost: { background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}` },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number" min={0} max={20}
      value={value === undefined || value === null ? '' : value}
      onChange={e => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
      disabled={disabled}
      style={{
        width: 44, textAlign: 'center',
        background: disabled ? '#0a1628' : '#060f20',
        border: `1px solid ${disabled ? C.textDim : C.borderBlue}`,
        color: disabled ? C.textDim : C.text,
        borderRadius: 6, padding: '5px 0',
        fontSize: 18, fontWeight: 700,
        fontFamily: font,
        WebkitAppearance: 'none', MozAppearance: 'textfield',
      }}
    />
  )
}

function PtsBadge({ pts, maxPts }) {
  const full = pts === maxPts
  const partial = pts > 0 && pts < maxPts
  const bg = full ? C.green : partial ? C.amber : C.red
  const fg = full ? C.greenDark : partial ? '#1a1000' : '#fff'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 800,
      background: bg, color: fg,
    }}>
      +{pts}
    </span>
  )
}

// ── LOGIN SCREEN ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleLogin() {
    const trimmed = name.trim()
    if (!trimmed) return setErr('Enter your name to continue')
    setLoading(true)
    setErr('')
    const { error } = await supabase
      .from('players')
      .upsert({ name: trimmed }, { onConflict: 'name' })
    if (error) { setErr('Connection error — check your Supabase setup'); setLoading(false); return }
    onLogin(trimmed)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(160deg, ${C.bg} 0%, #0a1628 60%, ${C.bg} 100%)`,
      fontFamily: font, padding: 24,
    }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>⚽</div>
      <div style={{ fontSize: 11, letterSpacing: 3, color: C.blueLight, fontWeight: 800, marginBottom: 6 }}>
        FIFA WORLD CUP 2026
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 4, textAlign: 'center' }}>
        Bracket Prediction Game
      </h1>
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 32, textAlign: 'center' }}>
        USA · Canada · Mexico · June 11 – July 19
      </p>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 360,
      }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>
          YOUR NAME
        </label>
        <input
          type="text" placeholder="e.g. Dhino"
          value={name}
          onChange={e => { setName(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px 14px',
            background: '#060f20', border: `1px solid ${C.borderBlue}`,
            borderRadius: 8, color: C.text, fontSize: 16,
            fontFamily: font, marginBottom: 16, outline: 'none',
          }}
        />
        {err && <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <Btn onClick={handleLogin} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Loading…' : 'Enter My Bracket →'}
        </Btn>
        <p style={{ color: C.textDim, fontSize: 11, marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
          Returning? Same name = same picks.<br />Share this URL with friends so they can enter theirs.
        </p>
      </div>
    </div>
  )
}

// ── MATCH CARD ─────────────────────────────────────────────────────────────

function MatchCard({ match, pick, onPick, results }) {
  const locked = LOCKED_IDS.includes(match.id)
  const result = results?.[match.id]
  const h = pick?.home
  const a = pick?.away
  const hasPick = h != null && a != null

  let badge = null
  if (locked) {
    badge = (
      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: C.green, color: C.greenDark }}>
        MAX ✓
      </span>
    )
  } else if (result && hasPick) {
    const pts = scoreGroupPick(pick, result)
    badge = <PtsBadge pts={pts} maxPts={POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS} />
  }

  return (
    <div style={{
      background: locked ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${locked ? 'rgba(0,230,118,0.15)' : C.border}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: C.green, fontWeight: 800, letterSpacing: 1 }}>
            MATCHDAY {match.md}
          </span>
          {MATCH_TIMES[match.id] && (
            <span style={{ fontSize: 9, color: C.textDim }}>
              {new Date(MATCH_TIMES[match.id]).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {result && <span style={{ fontSize: 10, color: C.green }}>RESULT: {result.home}–{result.away}</span>}
          {badge}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: locked ? C.textMuted : C.text, lineHeight: 1.3 }}>
          {match.home}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <ScoreInput value={h} onChange={v => onPick(match.id, { home: v, away: a ?? null })} disabled={locked} />
          <span style={{ color: C.textDim, fontWeight: 700, fontSize: 14 }}>–</span>
          <ScoreInput value={a} onChange={v => onPick(match.id, { home: h ?? null, away: v })} disabled={locked} />
        </div>
        <span style={{ flex: 1, fontSize: 13, color: locked ? C.textMuted : C.text, textAlign: 'right', lineHeight: 1.3 }}>
          {match.away}
        </span>
      </div>
    </div>
  )
}

// ── SCOREBOARD ─────────────────────────────────────────────────────────────

function Scoreboard({ currentPlayer, results }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: players } = await supabase.from('players').select('name')
      if (!players) return setLoading(false)
      const scored = await Promise.all(players.map(async ({ name }) => {
        const { data } = await supabase
          .from('picks')
          .select('match_id, home, away')
          .eq('player_name', name)
        const pickMap = {}
        ;(data || []).forEach(r => { pickMap[r.match_id] = { home: r.home, away: r.away } })
        return { name, pts: calcTotal(pickMap, results) }
      }))
      scored.sort((a, b) => b.pts - a.pts)
      setRows(scored)
      setLoading(false)
    }
    load()
  }, [results])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 2, color: C.textMuted, fontWeight: 800, marginBottom: 16 }}>
        🏆 LEADERBOARD
      </div>
      {loading ? (
        <p style={{ color: C.textMuted, fontSize: 13 }}>Loading scores…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: C.textMuted, fontSize: 13 }}>No players yet. Be the first!</p>
      ) : (
        rows.map((r, i) => (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', marginBottom: 8, borderRadius: 10,
            background: r.name === currentPlayer ? 'rgba(21,101,192,0.15)' : C.surface,
            border: `1px solid ${r.name === currentPlayer ? C.borderBlue : C.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{medals[i] || `${i + 1}.`}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: r.name === currentPlayer ? C.blueLight : C.text }}>
                  {r.name} {r.name === currentPlayer && '(you)'}
                </div>
                <div style={{ fontSize: 11, color: C.textDim }}>
                  {i === 0 ? 'Leading' : `${rows[0].pts - r.pts} pts behind`}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.green }}>{r.pts}</div>
          </div>
        ))
      )}
      <p style={{ fontSize: 11, color: C.textDim, marginTop: 12, textAlign: 'center' }}>
        Updates live as results come in · {Object.keys(results).length} of 72 matches played
      </p>
    </div>
  )
}

// ── RULES PANEL ────────────────────────────────────────────────────────────

function Rules() {
  return (
    <div style={{
      background: 'rgba(21,101,192,0.08)', border: `1px solid ${C.borderBlue}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 20,
      fontSize: 13, color: C.blueLight, lineHeight: 1.9,
    }}>
      <div style={{ fontWeight: 800, marginBottom: 6, color: '#b3d4ff', letterSpacing: 1, fontSize: 11 }}>
        📋 SCORING RULES
      </div>
      <div>🎯 Correct result (win or draw) → <b>+3 pts</b></div>
      <div>🔢 Exact scoreline bonus → <b>+2 pts</b> &nbsp;<span style={{ color: C.textDim, fontSize: 11 }}>(max 5 pts per match)</span></div>
      <div>❌ Wrong result → 0 pts</div>
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderBlue}`, fontSize: 12, color: C.textMuted }}>
        Knockout rounds: +5 correct · +2 exact bonus
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: C.green }}>
        ✓ First 3 matches (Mexico–SA, Korea–Czechia, Canada–Bosnia) locked — everyone gets max 5 pts
      </div>
    </div>
  )
}

// ── PICKS TAB ──────────────────────────────────────────────────────────────

function PicksTab({ playerName, results }) {
  const [activeGroup, setActiveGroup] = useState('A')
  const [picks, setPicks] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const groupKeys = Object.keys(GROUPS)

  useEffect(() => {
    async function loadPicks() {
      const { data } = await supabase
        .from('picks')
        .select('match_id, home, away')
        .eq('player_name', playerName)
      if (data) {
        const map = {}
        data.forEach(r => { map[r.match_id] = { home: r.home, away: r.away } })
        setPicks(map)
      }
    }
    loadPicks()
  }, [playerName])

  const savePick = useCallback(async (matchId, score) => {
    setSaving(true)
    await supabase.from('picks').upsert({
      player_name: playerName,
      match_id: matchId,
      home: score.home,
      away: score.away,
    }, { onConflict: 'player_name,match_id' })
    setSaving(false)
    setSavedAt(new Date())
  }, [playerName])

  function handlePick(matchId, score) {
    setPicks(prev => ({ ...prev, [matchId]: score }))
    savePick(matchId, score)
  }

  const groupMatches = getGroupMatches(activeGroup)
  const totalFilled = ALL_MATCHES.filter(m => {
    if (LOCKED_IDS.includes(m.id)) return true
    const p = picks[m.id]
    return p?.home != null && p?.away != null
  }).length

  return (
    <div>
      <Rules />

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, letterSpacing: 1 }}>PICKS ENTERED</span>
          <span style={{ fontSize: 11, color: C.green, fontWeight: 800 }}>
            {totalFilled} / {ALL_MATCHES.length}
            {saving && <span style={{ color: C.textDim, marginLeft: 8 }}>saving…</span>}
            {!saving && savedAt && <span style={{ color: C.textDim, marginLeft: 8 }}>saved ✓</span>}
          </span>
        </div>
        <div style={{ height: 4, background: C.surface, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${C.blue}, ${C.green})`,
            width: `${(totalFilled / ALL_MATCHES.length) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => generateBracketPDF(playerName, picks, results)}
          style={{
            width: '100%', padding: '11px 0',
            background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)',
            borderRadius: 8, cursor: 'pointer',
            color: C.green, fontWeight: 800, fontSize: 13,
            fontFamily: font, display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>⬇</span>
          Download My Bracket PDF
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>
            — snapshot of current picks
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {groupKeys.map(g => {
          const ms = getGroupMatches(g)
          const filled = ms.filter(m => {
            if (LOCKED_IDS.includes(m.id)) return true
            const p = picks[m.id]
            return p?.home != null && p?.away != null
          }).length
          const complete = filled === ms.length
          return (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 800, fontSize: 13,
              background: activeGroup === g
                ? C.blue
                : complete ? 'rgba(0,230,118,0.12)' : C.surface,
              color: activeGroup === g
                ? '#fff'
                : complete ? C.green : C.textMuted,
              outline: activeGroup === g ? `2px solid ${C.blueBright}` : 'none',
              outlineOffset: 1,
              position: 'relative',
              fontFamily: font,
            }}>
              {g}
              {complete && activeGroup !== g && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 8, height: 8, borderRadius: 99,
                  background: C.green, border: `1px solid ${C.bg}`,
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          background: `linear-gradient(135deg, ${C.blue}, #0d47a1)`,
          color: C.blueLight, fontWeight: 900, fontSize: 12,
          padding: '4px 10px', borderRadius: 6, letterSpacing: 2,
        }}>
          GROUP {activeGroup}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {GROUPS[activeGroup].map(t => t.split(' ').slice(1).join(' ')).join(' · ')}
        </span>
      </div>

      {groupMatches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          pick={picks[m.id]}
          onPick={handlePick}
          results={results}
        />
      ))}
    </div>
  )
}

// ── ADMIN PANEL ────────────────────────────────────────────────────────────

function AdminPanel({ results, onRefresh }) {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinErr, setPinErr] = useState('')
  const [adminView, setAdminView] = useState('results')

  // Results entry state
  const [activeGroup, setActiveGroup] = useState('A')
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState({})

  // All picks view state
  const [allPlayers, setAllPlayers] = useState([])
  const [allPicks, setAllPicks] = useState({})
  const [picksLoading, setPicksLoading] = useState(false)

  const groupKeys = Object.keys(GROUPS)

  function handleUnlock() {
    if (pin === 'wc2026') {
      setUnlocked(true)
      setPinErr('')
    } else {
      setPinErr('Incorrect PIN')
    }
  }

  useEffect(() => {
    if (!unlocked || adminView !== 'picks') return
    let cancelled = false
    async function loadAllPicks() {
      setPicksLoading(true)
      const { data: players } = await supabase.from('players').select('name').order('name')
      if (cancelled || !players) { setPicksLoading(false); return }
      const names = players.map(p => p.name)
      const { data: picksData } = await supabase.from('picks').select('player_name, match_id, home, away')
      if (cancelled) return
      const map = {}
      names.forEach(n => { map[n] = {} })
      ;(picksData || []).forEach(r => {
        if (map[r.player_name]) map[r.player_name][r.match_id] = { home: r.home, away: r.away }
      })
      setAllPlayers(names)
      setAllPicks(map)
      setPicksLoading(false)
    }
    loadAllPicks()
    return () => { cancelled = true }
  }, [unlocked, adminView])

  function getScore(matchId, side) {
    if (draft[matchId]?.[side] !== undefined) return draft[matchId][side]
    return results[matchId]?.[side] ?? null
  }

  function setScore(matchId, side, val) {
    setDraft(prev => ({ ...prev, [matchId]: { ...prev[matchId], [side]: val } }))
  }

  async function saveMatch(matchId) {
    const home = getScore(matchId, 'home')
    const away = getScore(matchId, 'away')
    if (home == null || away == null) return
    setSaving(prev => ({ ...prev, [matchId]: true }))
    await supabase.from('results').upsert(
      { match_id: matchId, home, away },
      { onConflict: 'match_id' }
    )
    setDraft(prev => { const next = { ...prev }; delete next[matchId]; return next })
    setSaving(prev => ({ ...prev, [matchId]: false }))
    onRefresh()
  }

  if (!unlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 24, textAlign: 'center' }}>
          Enter the admin PIN to manage match results
        </div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 24, width: '100%', maxWidth: 320,
        }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Enter PIN"
            style={{
              width: '100%', padding: '12px 14px',
              background: '#060f20', border: `1px solid ${pinErr ? C.red : C.borderBlue}`,
              borderRadius: 8, color: C.text, fontSize: 16,
              fontFamily: font, marginBottom: 12, outline: 'none',
            }}
          />
          {pinErr && <p style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{pinErr}</p>}
          <Btn onClick={handleUnlock} style={{ width: '100%' }}>Unlock</Btn>
        </div>
      </div>
    )
  }

  const viewToggle = (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {[
        { id: 'results', label: 'Enter Results' },
        { id: 'picks', label: 'View All Picks' },
      ].map(v => (
        <button key={v.id} onClick={() => setAdminView(v.id)} style={{
          flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
          cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: font,
          background: adminView === v.id ? C.blue : C.surface,
          color: adminView === v.id ? '#fff' : C.textMuted,
          outline: adminView === v.id ? `2px solid ${C.blueBright}` : 'none',
          outlineOffset: 1,
        }}>
          {v.label}
        </button>
      ))}
    </div>
  )

  if (adminView === 'picks') {
    const sn = t => t.split(' ').slice(1).join(' ')
    return (
      <div>
        {viewToggle}
        {picksLoading ? (
          <p style={{ color: C.textMuted, fontSize: 13 }}>Loading picks…</p>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 8, border: `1px solid ${C.border}` }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
              <thead>
                <tr style={{ background: C.surfaceHi }}>
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: C.surfaceHi, padding: '8px 10px',
                    textAlign: 'left', fontWeight: 800, fontSize: 10,
                    color: C.textMuted, letterSpacing: 1,
                    borderBottom: `1px solid ${C.border}`,
                    borderRight: `1px solid ${C.border}`,
                    whiteSpace: 'nowrap', minWidth: 140,
                  }}>
                    MATCH
                  </th>
                  {allPlayers.map(p => (
                    <th key={p} style={{
                      padding: '8px 8px', textAlign: 'center',
                      fontWeight: 700, fontSize: 11, color: C.blueLight,
                      borderBottom: `1px solid ${C.border}`,
                      borderRight: `1px solid ${C.border}`,
                      whiteSpace: 'nowrap', minWidth: 64,
                    }}>
                      {p.length > 8 ? p.slice(0, 7) + '…' : p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupKeys.map(g => {
                  const matches = getGroupMatches(g).filter(m => !LOCKED_IDS.includes(m.id))
                  if (matches.length === 0) return null
                  return [
                    <tr key={`hdr-${g}`} style={{ background: 'rgba(21,101,192,0.12)' }}>
                      <td
                        colSpan={1 + allPlayers.length}
                        style={{
                          padding: '5px 10px', fontSize: 10, fontWeight: 800,
                          color: C.blueLight, letterSpacing: 2,
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        GROUP {g}
                      </td>
                    </tr>,
                    ...matches.map((m, mi) => (
                      <tr key={m.id} style={{ background: mi % 2 === 0 ? C.surface : C.surfaceHi }}>
                        <td style={{
                          position: 'sticky', left: 0, zIndex: 1,
                          background: mi % 2 === 0 ? C.surface : C.surfaceHi,
                          padding: '7px 10px',
                          borderBottom: `1px solid ${C.border}`,
                          borderRight: `1px solid ${C.border}`,
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ fontWeight: 800, color: C.textMuted, fontSize: 10, marginRight: 6 }}>
                            {m.id}
                          </span>
                          <span style={{ color: C.text, fontSize: 11 }}>
                            {sn(m.home)} · {sn(m.away)}
                          </span>
                          {results[m.id] && (
                            <span style={{ color: C.green, fontSize: 10, marginLeft: 4 }}>
                              ({results[m.id].home}–{results[m.id].away})
                            </span>
                          )}
                        </td>
                        {allPlayers.map(p => {
                          const pick = allPicks[p]?.[m.id]
                          const hasPick = pick?.home != null && pick?.away != null
                          const result = results[m.id]
                          const pts = (hasPick && result) ? scoreGroupPick(pick, result) : null
                          return (
                            <td key={p} style={{
                              padding: '7px 8px', textAlign: 'center',
                              borderBottom: `1px solid ${C.border}`,
                              borderRight: `1px solid ${C.border}`,
                              color: hasPick ? C.text : C.textDim,
                              fontWeight: hasPick ? 700 : 400,
                              fontSize: 12, whiteSpace: 'nowrap',
                            }}>
                              {hasPick ? `${pick.home} – ${pick.away}` : '–'}
                              {pts !== null && (
                                <span style={{
                                  display: 'inline-block', marginLeft: 4,
                                  padding: '1px 4px', borderRadius: 99,
                                  fontSize: 9, fontWeight: 800,
                                  background: pts === 5 ? C.green : pts > 0 ? C.amber : C.red,
                                  color: pts === 5 ? C.greenDark : pts > 0 ? '#1a1000' : '#fff',
                                }}>
                                  {pts}
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )),
                  ]
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // Results entry view
  const groupMatches = getGroupMatches(activeGroup)
  return (
    <div>
      {viewToggle}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {groupKeys.map(g => {
          const ms = getGroupMatches(g)
          const done = ms.filter(m => results[m.id] != null).length
          const allDone = done === ms.length
          return (
            <button key={g} onClick={() => setActiveGroup(g)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer', fontWeight: 800, fontSize: 13,
              background: activeGroup === g
                ? C.blue
                : allDone ? 'rgba(0,230,118,0.12)' : C.surface,
              color: activeGroup === g ? '#fff' : allDone ? C.green : C.textMuted,
              outline: activeGroup === g ? `2px solid ${C.blueBright}` : 'none',
              outlineOffset: 1, fontFamily: font, position: 'relative',
            }}>
              {g}
              {allDone && activeGroup !== g && (
                <span style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 8, height: 8, borderRadius: 99,
                  background: C.green, border: `1px solid ${C.bg}`,
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          background: `linear-gradient(135deg, ${C.blue}, #0d47a1)`,
          color: C.blueLight, fontWeight: 900, fontSize: 12,
          padding: '4px 10px', borderRadius: 6, letterSpacing: 2,
        }}>
          GROUP {activeGroup}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {GROUPS[activeGroup].map(t => t.split(' ').slice(1).join(' ')).join(' · ')}
        </span>
      </div>

      {groupMatches.map(m => {
        const home = getScore(m.id, 'home')
        const away = getScore(m.id, 'away')
        const isDirty = draft[m.id] !== undefined
        const isSaving = saving[m.id]
        const hasSaved = results[m.id] != null && !isDirty
        return (
          <div key={m.id} style={{
            background: hasSaved ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${hasSaved ? 'rgba(0,230,118,0.2)' : isDirty ? C.borderBlue : C.border}`,
            borderRadius: 10, padding: '10px 12px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 800, letterSpacing: 1 }}>
                {m.id} · MD{m.md}
              </span>
              {hasSaved && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>SAVED ✓</span>}
              {isDirty && <span style={{ fontSize: 10, color: C.amber, fontWeight: 700 }}>UNSAVED</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.3 }}>{m.home}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <ScoreInput value={home} onChange={v => setScore(m.id, 'home', v)} />
                <span style={{ color: C.textDim, fontWeight: 700, fontSize: 14 }}>–</span>
                <ScoreInput value={away} onChange={v => setScore(m.id, 'away', v)} />
              </div>
              <span style={{ flex: 1, fontSize: 13, color: C.text, textAlign: 'right', lineHeight: 1.3 }}>{m.away}</span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <Btn
                onClick={() => saveMatch(m.id)}
                disabled={isSaving || (home == null || away == null)}
                variant={isDirty ? 'primary' : 'ghost'}
                style={{ padding: '7px 16px', fontSize: 12 }}
              >
                {isSaving ? 'Saving…' : 'Save Result'}
              </Btn>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ROOT APP ───────────────────────────────────────────────────────────────

export default function App() {
  const [player, setPlayer] = useState(() => localStorage.getItem('wc2026_player') || null)
  const [tab, setTab] = useState('picks')
  const [results, setResults] = useState({})

  useEffect(() => {
    fetchResults().then(setResults)
  }, [])

  function handleRefreshResults() {
    fetchResults().then(setResults)
  }

  function handleLogin(name) {
    localStorage.setItem('wc2026_player', name)
    setPlayer(name)
  }

  function handleLogout() {
    localStorage.removeItem('wc2026_player')
    setPlayer(null)
  }

  if (!player) return <LoginScreen onLogin={handleLogin} />

  return (
    <div style={{
      minHeight: '100vh', fontFamily: font, color: C.text,
      background: `linear-gradient(160deg, ${C.bg} 0%, #0a1628 60%, ${C.bg} 100%)`,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(90deg, ${C.surface}, #0d2a5e)`,
        borderBottom: `2px solid ${C.blue}`,
        padding: '14px 16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.blueLight, fontWeight: 800 }}>
            2026 WORLD CUP PREDICTION GAME
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              {player}
            </div>
            <button onClick={handleLogout} style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 6, padding: '5px 10px', color: C.textMuted,
              fontSize: 11, cursor: 'pointer', fontFamily: font,
            }}>
              Switch player
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{
        position: 'relative',
        backgroundImage: `url(https://i.imgur.com/vk7aIFj.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 'calc(100vh - 53px - 53px)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(3,11,26,0.62)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px 80px', position: 'relative', zIndex: 1 }}>
          {tab === 'picks' ? (
            <PicksTab playerName={player} results={results} />
          ) : tab === 'scores' ? (
            <Scoreboard currentPlayer={player} results={results} />
          ) : (
            <AdminPanel results={results} onRefresh={handleRefreshResults} />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        display: 'flex', zIndex: 10,
      }}>
        {[
          { id: 'picks', label: '🗳️ My Picks' },
          { id: 'scores', label: '🏆 Scoreboard' },
          { id: 'admin', label: '⚙️ Admin' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'rgba(21,101,192,0.2)' : 'transparent',
            color: tab === t.id ? C.blueLight : C.textMuted,
            fontWeight: tab === t.id ? 800 : 500,
            fontSize: 13, fontFamily: font,
            borderTop: tab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
