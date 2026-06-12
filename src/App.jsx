import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import {
  GROUPS, getGroupMatches, ALL_MATCHES,
  COMPLETED, LOCKED_IDS, POINTS, scoreGroupPick, calcTotal
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
    // Upsert player row
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

function MatchCard({ match, pick, onPick }) {
  const locked = LOCKED_IDS.includes(match.id)
  const result = COMPLETED[match.id]
  const h = pick?.home
  const a = pick?.away
  const hasPick = h != null && a != null

  let badge = null
  if (result && hasPick) {
    const pts = scoreGroupPick(pick, result)
    badge = <PtsBadge pts={pts} maxPts={POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS} />
  } else if (locked && !result) {
    badge = (
      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: C.green, color: C.greenDark }}>
        MAX ✓
      </span>
    )
  }

  return (
    <div style={{
      background: locked ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${locked ? 'rgba(0,230,118,0.15)' : C.border}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
    }}>
      {/* MD label + badge row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: C.green, fontWeight: 800, letterSpacing: 1 }}>
          MATCHDAY {match.md}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {result && <span style={{ fontSize: 10, color: C.green }}>RESULT: {result.home}–{result.away}</span>}
          {badge}
        </div>
      </div>

      {/* Teams + score inputs */}
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

function Scoreboard({ currentPlayer }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: players } = await supabase.from('players').select('name')
      if (!players) return setLoading(false)
      const results = await Promise.all(players.map(async ({ name }) => {
        const { data } = await supabase
          .from('picks')
          .select('match_id, home, away')
          .eq('player_name', name)
        const pickMap = {}
        ;(data || []).forEach(r => { pickMap[r.match_id] = { home: r.home, away: r.away } })
        return { name, pts: calcTotal(pickMap) }
      }))
      results.sort((a, b) => b.pts - a.pts)
      setRows(results)
      setLoading(false)
    }
    load()
  }, [])

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
        Updates live as results come in · {Object.keys(COMPLETED).length} of 72 matches played
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

function PicksTab({ playerName }) {
  const [activeGroup, setActiveGroup] = useState('A')
  const [picks, setPicks] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const groupKeys = Object.keys(GROUPS)

  // Load existing picks from Supabase
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

  // Debounced save to Supabase
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

      {/* Progress bar */}
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

      {/* Download PDF button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => generateBracketPDF(playerName, picks)}
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

      {/* Group tab strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20,
      }}>
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

      {/* Group header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
      }}>
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

      {/* Match cards */}
      {groupMatches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          pick={picks[m.id]}
          onPick={handlePick}
        />
      ))}
    </div>
  )
}

// ── ADMIN TAB ──────────────────────────────────────────────────────────────

function AdminTab() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [picks, setPicks] = useState({})
  const [activeGroup, setActiveGroup] = useState('A')
  const [loading, setLoading] = useState(true)
  const groupKeys = Object.keys(GROUPS)

  useEffect(() => {
    async function loadPlayers() {
      const { data } = await supabase.from('players').select('name').order('name')
      if (data) {
        const names = data.map(p => p.name)
        setPlayers(names)
        if (names.length > 0) setSelectedPlayer(names[0])
      }
      setLoading(false)
    }
    loadPlayers()
  }, [])

  useEffect(() => {
    if (!selectedPlayer) return
    async function loadPicks() {
      const { data } = await supabase
        .from('picks').select('match_id, home, away').eq('player_name', selectedPlayer)
      const map = {}
      ;(data || []).forEach(r => { map[r.match_id] = { home: r.home, away: r.away } })
      setPicks(map)
    }
    loadPicks()
  }, [selectedPlayer])

  const groupMatches = getGroupMatches(activeGroup)
  const totalFilled = ALL_MATCHES.filter(m => {
    if (LOCKED_IDS.includes(m.id)) return true
    const p = picks[m.id]
    return p?.home != null && p?.away != null
  }).length

  return (
    <div>
      <div style={{
        background: C.surface, borderRadius: 10, padding: '14px 16px',
        border: `1px solid ${C.border}`, marginBottom: 20,
      }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 8 }}>
          VIEWING PICKS FOR
        </label>
        {loading ? (
          <p style={{ color: C.textMuted, fontSize: 13 }}>Loading players…</p>
        ) : (
          <select
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px',
              background: '#060f20', border: `1px solid ${C.borderBlue}`,
              borderRadius: 8, color: C.text, fontSize: 15,
              fontFamily: font, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        <div style={{ marginTop: 10, fontSize: 11, color: C.textMuted }}>
          {totalFilled} / {ALL_MATCHES.length} picks entered
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {groupKeys.map(g => (
          <button key={g} onClick={() => setActiveGroup(g)} style={{
            padding: '6px 12px', borderRadius: 8, border: 'none',
            cursor: 'pointer', fontWeight: 800, fontSize: 13,
            background: activeGroup === g ? C.blue : C.surface,
            color: activeGroup === g ? '#fff' : C.textMuted,
            outline: activeGroup === g ? `2px solid ${C.blueBright}` : 'none',
            outlineOffset: 1, fontFamily: font,
          }}>
            {g}
          </button>
        ))}
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
        const pick = picks[m.id]
        const result = COMPLETED[m.id]
        const hasPick = pick?.home != null && pick?.away != null
        let badge = null
        if (result && hasPick) {
          const pts = scoreGroupPick(pick, result)
          badge = <PtsBadge pts={pts} maxPts={POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS} />
        }
        return (
          <div key={m.id} style={{
            background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '10px 12px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.green, fontWeight: 800, letterSpacing: 1 }}>
                MATCHDAY {m.md}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {result && <span style={{ fontSize: 10, color: C.green }}>RESULT: {result.home}–{result.away}</span>}
                {badge}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.3 }}>{m.home}</span>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, flexShrink: 0, minWidth: 80,
                background: '#060f20', border: `1px solid ${C.textDim}`,
                borderRadius: 6, padding: '5px 14px',
                fontSize: 18, fontWeight: 700,
                color: hasPick ? C.text : C.textDim,
              }}>
                {hasPick ? `${pick.home} – ${pick.away}` : '· – ·'}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: C.text, textAlign: 'right', lineHeight: 1.3 }}>{m.away}</span>
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

  function handleLogin(name) {
    localStorage.setItem('wc2026_player', name)
    setPlayer(name)
  }

  function handleLogout() {
    localStorage.removeItem('wc2026_player')
    setPlayer(null)
  }

  if (!player) return <LoginScreen onLogin={handleLogin} />

  const pts = 0 // real-time pts shown in scoreboard

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

      {/* Content area with full background image */}
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
            <PicksTab playerName={player} />
          ) : tab === 'admin' ? (
            <AdminTab />
          ) : (
            <Scoreboard currentPlayer={player} />
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
          ...(player === 'Dhino' ? [{ id: 'admin', label: '👁️ Admin' }] : []),
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
