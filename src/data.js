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

export function calcTotal(picks, results) {
  let total = 0
  ALL_MATCHES.forEach((m) => {
    const pick = picks?.[m.id]
    if (LOCKED_IDS.includes(m.id)) {
      total += POINTS.GROUP_CORRECT + POINTS.GROUP_EXACT_BONUS
    } else {
      total += scoreGroupPick(pick, results?.[m.id])
    }
  })
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
