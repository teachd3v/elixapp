export const SA_SCALE_MIN = 1;
export const SA_SCALE_MAX = 4;

// ELIX blends Self Assessment and Mentor Assessment.
export const SA_WEIGHT = 0.4;
export const MA_WEIGHT = 0.6;

// Compute per-dimension averages and the overall SA score (0-4 scale) from a
// { statementId: rating } map, using the dimension weights. Weights sum to 1.0.
export function computeSaScores(responses, dimensionsList, statementsList) {
  const dimensionScores = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of dimensionsList) {
    const items = statementsList.filter((s) => s.dimensionId === dim.id);
    if (items.length === 0) continue;
    const sum = items.reduce((acc, s) => acc + (Number(responses[s.id]) || 0), 0);
    const avg = sum / items.length;
    dimensionScores[dim.id] = parseFloat(avg.toFixed(4));
    weightedSum += avg * dim.weight;
    totalWeight += dim.weight;
  }

  const saScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { dimensionScores, saScore: parseFloat(saScore.toFixed(4)) };
}

// Every statement must have an integer rating within [1,4]. Returns first error or null.
export function validateSaResponses(responses, statementsList) {
  if (!responses || typeof responses !== 'object') return 'Jawaban tidak valid.';
  for (const s of statementsList) {
    const v = Number(responses[s.id]);
    if (!Number.isInteger(v) || v < SA_SCALE_MIN || v > SA_SCALE_MAX) {
      return `Pernyataan "${s.code}" belum diisi (nilai harus 1-4).`;
    }
  }
  return null;
}


// ELIX index (0-100) from a 0-4 score.
export function toElixIndex(score) {
  return parseFloat(((score / SA_SCALE_MAX) * 100).toFixed(1));
}

export function elixCategory(index) {
  if (index >= 86) return 'Excellent Leader';
  if (index >= 66) return 'Growing Leader';
  if (index >= 46) return 'Developing Leader';
  return 'Emerging Leader';
}

// SA and MA share identical scoring math (average by dimension, weight).
export const computeScores = computeSaScores;
export const validateResponses = validateSaResponses;

// Blended raw score (0-4) from SA and MA aggregates. Falls back to whichever
// one is present so a partial ELIX can still be shown.
export function blendedScore(saScore, maScore, hasSA, hasMA) {
  if (hasSA && hasMA) return SA_WEIGHT * saScore + MA_WEIGHT * maScore;
  if (hasSA) return saScore;
  if (hasMA) return maScore;
  return 0;
}
