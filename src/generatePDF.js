import { jsPDF } from 'jspdf'
import { GROUPS, getGroupMatches, LOCKED_IDS, POINTS, scoreGroupPick } from './data'

// ── COLOR HELPERS ──────────────────────────────────────────────────────────
function hex(h) {
  const r = parseInt(h.slice(1,3),16)
  const g = parseInt(h.slice(3,5),16)
  const b = parseInt(h.slice(5,7),16)
  return [r, g, b]
}

const NAVY     = hex('#030b1a')
const SURFACE  = hex('#0a1628')
const SURFACE2 = hex('#0d1e36')
const BLUE     = hex('#1565c0')
const BLUE_L   = hex('#90caf9')
const GREEN    = hex('#00e676')
const GREEN_BG = hex('#0d2a1a')
const GREEN_BD = hex('#1a5c3a')
const TEXT     = hex('#e8edf8')
const MUTED    = hex('#4a6fa5')
const DIM      = hex('#1a2a44')
const WHITE    = [255,255,255]
const AMBER    = hex('#ffb300')
const RED      = hex('#ef5350')

export function generateBracketPDF(playerName, picks, results = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const W = 612
  const H = 792

  function fill(rgb) { doc.setFillColor(...rgb) }
  function stroke(rgb) { doc.setDrawColor(...rgb) }
  function fillText(rgb) { doc.setTextColor(...rgb) }
  function lw(n) { doc.setLineWidth(n) }

  function rect(x, y, w, h, fillColor, strokeColor, lineWidth = 0.5) {
    if (fillColor) { fill(fillColor); doc.rect(x, y, w, h, 'F') }
    if (strokeColor) { stroke(strokeColor); lw(lineWidth); doc.rect(x, y, w, h, 'S') }
  }

  function txt(str, x, y, size, color, align = 'left', bold = false) {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    fillText(color)
    if (align === 'center') doc.text(str, x, y, { align: 'center' })
    else if (align === 'right') doc.text(str, x, y, { align: 'right' })
    else doc.text(str, x, y)
  }

  // ── BACKGROUND ──
  rect(0, 0, W, H, NAVY)

  // ── HEADER ──
  const HDR_H = 50
  rect(0, 0, W, HDR_H, SURFACE)
  // blue bottom rule
  stroke(BLUE); lw(2)
  doc.line(0, HDR_H, W, HDR_H)

  txt('FIFA WORLD CUP 2026  —  BRACKET PREDICTION SHEET',
      W/2, 20, 13, WHITE, 'center', true)
  txt(`Player:  ${playerName}     |     USA · Canada · Mexico  |  June 11 – July 19, 2026`,
      W/2, 36, 8.5, BLUE_L, 'center')

  // scoring bar
  const SB_Y = HDR_H
  const SB_H = 18
  rect(0, SB_Y, W, SB_H, hex('#060f20'))
  stroke(DIM); lw(0.5)
  doc.line(0, SB_Y + SB_H, W, SB_Y + SB_H)
  txt('SCORING:  Correct result = +3 pts   |   Exact scoreline bonus = +2 pts   |   Wrong = 0 pts   |   Max 5 pts per match   |   Locked matches (green) = MAX 5 pts auto',
      W/2, SB_Y + 12, 6.8, MUTED, 'center')

  // ── GROUPS GRID ──
  const MARGIN_X = 18
  const TOP_PAD = 8
  const BOT_PAD = 22
  const COL_GAP = 10
  const availW = W - 2 * MARGIN_X
  const colW = (availW - COL_GAP) / 2
  const startY = HDR_H + SB_H + TOP_PAD
  const availH = H - startY - BOT_PAD

  const N_ROWS = 6
  const groupH = availH / N_ROWS

  const G_HDR_H = 14
  const COL_LBL_H = 11
  const MATCH_ROW_H = (groupH - G_HDR_H - COL_LBL_H - 2) / 6

  const groupKeys = Object.keys(GROUPS)

  groupKeys.forEach((g, idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const x0 = MARGIN_X + col * (colW + COL_GAP)
    const y0 = startY + row * groupH

    const matches = getGroupMatches(g)
    const teams = GROUPS[g]

    // Group header
    rect(x0, y0, colW, G_HDR_H, BLUE)
    txt(`GROUP ${g}`, x0 + 5, y0 + G_HDR_H - 4, 8.5, WHITE, 'left', true)
    const teamStr = teams.map(t => t.split(' ')[0] === t ? t : t).join('  ·  ')
    // shorten for space
    const shortTeams = teams.map(t => t.length > 10 ? t.slice(0,9)+'.' : t).join(' · ')
    txt(shortTeams, x0 + 58, y0 + G_HDR_H - 4, 6.8, BLUE_L)

    // Column labels
    const CLY = y0 + G_HDR_H
    rect(x0, CLY, colW, COL_LBL_H, hex('#060f20'))
    stroke(DIM); lw(0.3)
    doc.line(x0, CLY + COL_LBL_H, x0 + colW, CLY + COL_LBL_H)
    txt('MD',    x0 + 14,          CLY + COL_LBL_H - 3, 6.5, MUTED, 'center')
    txt('Home',  x0 + 30,          CLY + COL_LBL_H - 3, 6.5, MUTED)
    txt('Pick',  x0 + colW * 0.58, CLY + COL_LBL_H - 3, 6.5, MUTED, 'center')
    txt('Away',  x0 + colW - 4,    CLY + COL_LBL_H - 3, 6.5, MUTED, 'right')

    // Match rows
    matches.forEach((m, mi) => {
      const { id: mid, md, home, away } = m
      const locked = LOCKED_IDS.includes(mid)
      const result = results[mid]
      const pick = picks?.[mid]

      const ry = CLY + COL_LBL_H + mi * MATCH_ROW_H
      const bg = locked ? GREEN_BG : (mi % 2 === 0 ? SURFACE : SURFACE2)
      rect(x0, ry, colW, MATCH_ROW_H, bg)

      if (locked) {
        stroke(GREEN_BD); lw(0.4)
        doc.rect(x0, ry, colW, MATCH_ROW_H, 'S')
      } else {
        stroke(DIM); lw(0.25)
        doc.line(x0, ry + MATCH_ROW_H, x0 + colW, ry + MATCH_ROW_H)
      }

      const ty = ry + MATCH_ROW_H * 0.68
      const tc = locked ? MUTED : TEXT

      // MD
      txt(String(md), x0 + 14, ty, 7.5, MUTED, 'center', true)

      // Home (truncated)
      const homeS = home.replace(/^[^\s]+ /, '').slice(0, 14) // strip emoji, trim
      txt(homeS, x0 + 26, ty, 7.5, tc)

      // Score / pick
      if (locked) {
        // determine pts label
        let ptsLabel = 'MAX  5 pts'
        if (result && pick) {
          const pts = scoreGroupPick(pick, result)
          const maxPts = POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS
          ptsLabel = `+${pts} pts${pts === maxPts ? ' ✓' : ''}`
          const ptsColor = pts === maxPts ? GREEN : pts > 0 ? AMBER : RED
          txt(ptsLabel, x0 + colW * 0.58, ty, 7.5, ptsColor, 'center', true)
        } else {
          txt(ptsLabel, x0 + colW * 0.58, ty, 7.5, GREEN, 'center', true)
        }
      } else if (pick?.home != null && pick?.away != null) {
        // Has a pick — show it
        const pickStr = `${pick.home}  –  ${pick.away}`
        // score it if result known
        if (result) {
          const pts = scoreGroupPick(pick, result)
          const maxPts = POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS
          const ptsColor = pts === maxPts ? GREEN : pts > 0 ? AMBER : RED
          txt(pickStr, x0 + colW * 0.5, ty, 8, TEXT, 'center', true)
          txt(`+${pts}`, x0 + colW * 0.76, ty, 7, ptsColor, 'center', true)
        } else {
          txt(pickStr, x0 + colW * 0.58, ty, 8, TEXT, 'center', true)
        }
      } else {
        // No pick entered
        txt('— — —', x0 + colW * 0.58, ty, 7.5, DIM, 'center')
      }

      // Away (truncated)
      const awayS = away.replace(/^[^\s]+ /, '').slice(0, 14)
      txt(awayS, x0 + colW - 4, ty, 7.5, tc, 'right')
    })

    // Outer border
    const totalH = G_HDR_H + COL_LBL_H + 6 * MATCH_ROW_H
    stroke(DIM); lw(0.5)
    doc.rect(x0, y0, colW, totalH, 'S')
  })

  // ── FOOTER ──
  const today = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  txt(`Picks recorded ${today}  ·  WC 2026 Bracket Game  ·  Locked matches auto-awarded max 5 pts`,
      W/2, H - 8, 6.8, MUTED, 'center')

  doc.save(`WC2026-${playerName.replace(/\s+/g,'-')}-bracket.pdf`)
}
