// ── ALL 12 GROUPS ──────────────────────────────────────────────────────────
export const GROUPS = {
  A: ['🇲🇽 Mexico', '🇿🇦 South Africa', '🇰🇷 South Korea', '🇨🇿 Czechia'],
  B: ['🇨🇦 Canada', '🇧🇦 Bosnia-Herz.', '🇶🇦 Qatar', '🇨🇭 Switzerland'],
  C: ['🇧🇷 Brazil', '🇲🇦 Morocco', '🇭🇹 Haiti', '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland'],
  D: ['🇺🇸 USA', '🇵🇾 Paraguay', '🇦🇺 Australia', '🇹🇷 Turkey'],
  E: ['🇩🇪 Germany', '🇨🇼 Curaçao', '🇨🇮 Ivory Coast', '🇪🇨 Ecuador'],
  F: ['🇳🇱 Netherlands', '🇯🇵 Japan', '🇸🇪 Sweden', '🇹🇳 Tunisia'],
  G: ['🇧🇪 Belgium', '🇪🇬 Egypt', '🇮🇷 Iran', '🇳🇿 New Zealand'],
  H: ['🇪🇸 Spain', '🇨🇻 Cape Verde', '🇸🇦 Saudi Arabia', '🇺🇾 Uruguay'],
  I: ['🇫🇷 France', '🇸🇳 Senegal', '🇮🇶 Iraq', '🇳🇴 Norway'],
  J: ['🇦🇷 Argentina', '🇩🇿 Algeria', '🇦🇹 Austria', '🇯🇴 Jordan'],
  K: ['🇵🇹 Portugal', '🇨🇩 DR Congo', '🇺🇿 Uzbekistan', '🇨🇴 Colombia'],
  L: ['🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', '🇭🇷 Croatia', '🇬🇭 Ghana', '🇵🇦 Panama'],
}

// Each group: matchday 1 → 0v1, 2v3 | matchday 2 → 0v2, 1v3 | matchday 3 → 0v3, 1v2
export function getGroupMatches(group) {
  const [t0, t1, t2, t3] = GROUPS[group]
  return [
    { id: `${group}1`, group, md: 1, home: t0, away: t1 },
    { id: `${group}2`, group, md: 1, home: t2, away: t3 },
    { id: `${group}3`, group, md: 2, home: t0, away: t2 },
    { id: `${group}4`, group, md: 2, home: t1, away: t3 },
    { id: `${group}5`, group, md: 3, home: t0, away: t3 },
    { id: `${group}6`, group, md: 3, home: t1, away: t2 },
  ]
}

export const ALL_MATCHES = Object.keys(GROUPS).flatMap(getGroupMatches)

// Matches locked before picks opened — everyone gets max points automatically
export const LOCKED_IDS = ['A1', 'A2', 'B1']

// ── SCORING ────────────────────────────────────────────────────────────────
export const POINTS = {
  GROUP_CORRECT: 3,
  GROUP_EXACT_BONUS: 2,
  KNOCKOUT_CORRECT: 5,
  KNOCKOUT_EXACT_BONUS: 2,
}

export function scoreGroupPick(pick, result) {
  if (!pick || !result) return 0
  const pickOutcome = Math.sign(pick.home - pick.away)
  const realOutcome = Math.sign(result.home - result.away)
  if (pickOutcome !== realOutcome) return 0
  const exact = pick.home === result.home && pick.away === result.away
  return POINTS.GROUP_CORRECT + (exact ? POINTS.GROUP_EXACT_BONUS : 0)
}

export function calcTotal(picks, results, knockoutPicks, knockoutResults) {
  let total = 0
  ALL_MATCHES.forEach((m) => {
    const pick = picks?.[m.id]
    if (LOCKED_IDS.includes(m.id)) {
      total += POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS
    } else {
      total += scoreGroupPick(pick, results?.[m.id])
    }
  })
  total += calcKnockoutTotal(knockoutPicks, knockoutResults)
  return total
}

export const MATCH_TIMES = {
  A1: '2026-06-11T19:00:00Z', A2: '2026-06-11T21:00:00Z',
  B1: '2026-06-12T19:00:00Z', D1: '2026-06-12T22:00:00Z',
  B2: '2026-06-13T19:00:00Z', C1: '2026-06-13T22:00:00Z',
  C2: '2026-06-13T23:30:00Z',
  E1: '2026-06-14T18:00:00Z', F1: '2026-06-14T21:00:00Z',
  E2: '2026-06-14T23:00:00Z', F2: '2026-06-15T01:00:00Z',
  H1: '2026-06-15T18:00:00Z', G1: '2026-06-15T21:00:00Z',
  H2: '2026-06-15T22:00:00Z', G2: '2026-06-16T01:00:00Z',
  I1: '2026-06-16T19:00:00Z', I2: '2026-06-16T22:00:00Z',
  J1: '2026-06-17T01:00:00Z', J2: '2026-06-17T04:00:00Z',
  K1: '2026-06-17T17:00:00Z', L1: '2026-06-17T20:00:00Z',
  L2: '2026-06-17T23:00:00Z', K2: '2026-06-18T02:00:00Z',
  A3: '2026-06-18T16:00:00Z', B3: '2026-06-18T19:00:00Z',
  B4: '2026-06-18T22:00:00Z', A4: '2026-06-19T01:00:00Z',
  D2: '2026-06-19T19:00:00Z', C3: '2026-06-19T22:00:00Z',
  C4: '2026-06-20T00:30:00Z', D3: '2026-06-20T03:00:00Z',
  F3: '2026-06-20T17:00:00Z', E3: '2026-06-20T20:00:00Z',
  E4: '2026-06-21T00:00:00Z', F4: '2026-06-21T04:00:00Z',
  H3: '2026-06-21T16:00:00Z', G3: '2026-06-21T19:00:00Z',
  H4: '2026-06-21T22:00:00Z', G4: '2026-06-22T01:00:00Z',
  J3: '2026-06-22T17:00:00Z', I3: '2026-06-22T21:00:00Z',
  I4: '2026-06-23T00:00:00Z', J4: '2026-06-23T03:00:00Z',
  K3: '2026-06-23T17:00:00Z', L3: '2026-06-23T20:00:00Z',
  L4: '2026-06-23T23:00:00Z', K4: '2026-06-24T02:00:00Z',
  B5: '2026-06-24T19:00:00Z', B6: '2026-06-24T19:00:00Z',
  C5: '2026-06-24T22:00:00Z', C6: '2026-06-24T22:00:00Z',
  A5: '2026-06-25T01:00:00Z', A6: '2026-06-25T01:00:00Z',
  E5: '2026-06-25T20:00:00Z', E6: '2026-06-25T20:00:00Z',
  F5: '2026-06-25T23:00:00Z', F6: '2026-06-25T23:00:00Z',
  D4: '2026-06-26T02:00:00Z', D5: '2026-06-26T02:00:00Z',
  I5: '2026-06-26T19:00:00Z', I6: '2026-06-26T19:00:00Z',
  H5: '2026-06-27T00:00:00Z', H6: '2026-06-27T00:00:00Z',
  G5: '2026-06-27T03:00:00Z', G6: '2026-06-27T03:00:00Z',
  L5: '2026-06-27T21:00:00Z', L6: '2026-06-27T21:00:00Z',
  K5: '2026-06-27T23:30:00Z', K6: '2026-06-27T23:30:00Z',
  J5: '2026-06-28T02:00:00Z', J6: '2026-06-28T02:00:00Z',
}

export const KNOCKOUT_SCHEDULE = {
  // ── ROUND OF 32 ──
  R32_1:  { label: 'Round of 32', home: 'South Africa', away: 'Canada',       time: '2026-06-28T22:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  R32_2:  { label: 'Round of 32', home: 'Brazil',       away: 'Japan',        time: '2026-06-29T17:00:00Z', venue: 'NRG Stadium, Houston' },
  R32_3:  { label: 'Round of 32', home: 'Germany',      away: 'Paraguay',     time: '2026-06-29T20:30:00Z', venue: 'Gillette Stadium, Foxborough' },
  R32_4:  { label: 'Round of 32', home: 'Netherlands',  away: 'Morocco',      time: '2026-06-30T01:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  R32_5:  { label: 'Round of 32', home: 'Ivory Coast',  away: 'Norway',       time: '2026-06-30T17:00:00Z', venue: 'AT&T Stadium, Arlington' },
  R32_6:  { label: 'Round of 32', home: 'France',       away: 'Sweden',       time: '2026-06-30T21:00:00Z', venue: 'MetLife Stadium, East Rutherford' },
  R32_7:  { label: 'Round of 32', home: 'Mexico',       away: 'Ecuador',      time: '2026-07-01T01:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  R32_8:  { label: 'Round of 32', home: 'England',      away: 'DR Congo',     time: '2026-07-01T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  R32_9:  { label: 'Round of 32', home: 'Belgium',      away: 'Senegal',      time: '2026-07-01T20:00:00Z', venue: 'Lumen Field, Seattle' },
  R32_10: { label: 'Round of 32', home: 'USA',          away: 'Bosnia-Herz.', time: '2026-07-02T00:00:00Z', venue: "Levi's Stadium, Santa Clara" },
  R32_11: { label: 'Round of 32', home: 'Spain',        away: 'Austria',      time: '2026-07-02T19:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  R32_12: { label: 'Round of 32', home: 'Portugal',     away: 'Croatia',      time: '2026-07-02T23:00:00Z', venue: 'BMO Field, Toronto' },
  R32_13: { label: 'Round of 32', home: 'Switzerland',  away: 'Algeria',      time: '2026-07-03T03:00:00Z', venue: 'BC Place, Vancouver' },
  R32_14: { label: 'Round of 32', home: 'Australia',    away: 'Egypt',        time: '2026-07-03T18:00:00Z', venue: 'AT&T Stadium, Dallas' },
  R32_15: { label: 'Round of 32', home: 'Argentina',    away: 'Cape Verde',   time: '2026-07-03T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  R32_16: { label: 'Round of 32', home: 'Colombia',     away: 'Ghana',        time: '2026-07-04T01:30:00Z', venue: 'Arrowhead Stadium, Kansas City' },

  // ── ROUND OF 16 ──
  R16_1: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-04T17:00:00Z', venue: 'NRG Stadium, Houston' },
  R16_2: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-04T21:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  R16_3: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-05T20:00:00Z', venue: 'MetLife Stadium, East Rutherford' },
  R16_4: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-06T00:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  R16_5: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-06T19:00:00Z', venue: 'AT&T Stadium, Arlington' },
  R16_6: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-07T00:00:00Z', venue: 'Lumen Field, Seattle' },
  R16_7: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-07T16:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  R16_8: { label: 'Round of 16', home: 'TBD', away: 'TBD', time: '2026-07-07T20:00:00Z', venue: 'BC Place, Vancouver' },

  // ── QUARTERFINALS ──
  QF_1: { label: 'Quarterfinal', home: 'TBD', away: 'TBD', time: '2026-07-09T20:00:00Z', venue: 'Gillette Stadium, Foxborough' },
  QF_2: { label: 'Quarterfinal', home: 'TBD', away: 'TBD', time: '2026-07-10T19:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  QF_3: { label: 'Quarterfinal', home: 'TBD', away: 'TBD', time: '2026-07-11T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  QF_4: { label: 'Quarterfinal', home: 'TBD', away: 'TBD', time: '2026-07-12T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },

  // ── SEMIFINALS ──
  SF_1: { label: 'Semifinal', home: 'TBD', away: 'TBD', time: '2026-07-14T19:00:00Z', venue: 'AT&T Stadium, Arlington' },
  SF_2: { label: 'Semifinal', home: 'TBD', away: 'TBD', time: '2026-07-15T19:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },

  // ── THIRD PLACE ──
  TP_1: { label: 'Third Place', home: 'TBD', away: 'TBD', time: '2026-07-18T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
}

export const KNOCKOUT_ROUNDS = ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Third Place']

export const POINTS_KNOCKOUT = {
  CORRECT: 5,
  EXACT_BONUS: 2,
}

export function scoreKnockoutPick(pick, result) {
  if (!pick || !result) return 0
  // winner: whoever has more goals (or away on penalties if tied - treat as away win)
  const pickWinner = pick.home > pick.away ? 'home' : 'away'
  const realWinner = result.home > result.away ? 'home' : 'away'
  if (pickWinner !== realWinner) return 0
  const exact = pick.home === result.home && pick.away === result.away
  return POINTS_KNOCKOUT.CORRECT + (exact ? POINTS_KNOCKOUT.EXACT_BONUS : 0)
}

export function calcKnockoutTotal(knockoutPicks, knockoutResults) {
  let total = 0
  Object.keys(KNOCKOUT_SCHEDULE).forEach(id => {
    const result = knockoutResults?.[id]
    const pick = knockoutPicks?.[id]
    if (result && pick) total += scoreKnockoutPick(pick, result)
  })
  return total
}
