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
