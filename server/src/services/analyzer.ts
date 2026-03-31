import type { SignalAnalysis } from "../../../shared/src/index.js";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toRiskLevel = (score: number): SignalAnalysis["risk_level"] => {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
};

const positiveSignals = [
  { pattern: /\bbroken window|broken windows|boarded window|boarded windows\b/i, impact: 28, label: "broken or boarded windows" },
  { pattern: /\bovergrown|overgrown yard|overgrown vegetation|tall grass|heavy weeds|vegetation\b/i, impact: 16, label: "overgrown vegetation" },
  { pattern: /\bgraffiti|vandalized|vandalism\b/i, impact: 12, label: "visible vandalism" },
  { pattern: /\bempty|vacant|vacancy|no activity|inactive\b/i, impact: 14, label: "extended inactivity" },
  { pattern: /\bcollapsed|roof damage|roof leak|structural damage\b/i, impact: 24, label: "structural distress" },
  { pattern: /\btrash|dumping|debris|litter\b/i, impact: 8, label: "site neglect" },
  { pattern: /\bdark|no lights|shut down\b/i, impact: 7, label: "reduced active use" }
] as const;

const negativeSignals = [
  { pattern: /\bmaintained|well maintained|fresh paint|renovated|recently repaired\b/i, impact: -22, label: "recent maintenance" },
  { pattern: /\boccupied|active|open business|in use|vehicles present\b/i, impact: -18, label: "clear active use" },
  { pattern: /\bmowed|trimmed|clean yard|landscaped\b/i, impact: -10, label: "ongoing upkeep" },
  { pattern: /\bsecure|gated and active|staff on site\b/i, impact: -12, label: "active site control" }
] as const;

export const analyzeSignal = (description: string, confidence: number): SignalAnalysis => {
  const normalizedDescription = description.trim();
  const normalizedConfidence = clamp(Math.round(confidence), 0, 100);

  const matchedPositive = positiveSignals.filter((signal) => signal.pattern.test(normalizedDescription));
  const matchedNegative = negativeSignals.filter((signal) => signal.pattern.test(normalizedDescription));

  const positiveScore = matchedPositive.reduce((sum, signal) => sum + signal.impact, 0);
  const negativeScore = matchedNegative.reduce((sum, signal) => sum + signal.impact, 0);
  const confidenceWeight = normalizedConfidence * 0.22;
  const score = clamp(Math.round(10 + confidenceWeight + positiveScore + negativeScore), 0, 100);
  const riskLevel = toRiskLevel(score);

  const signalNotes = [
    ...matchedPositive.map((signal) => signal.label),
    ...matchedNegative.map((signal) => signal.label)
  ];

  const leadingReason =
    signalNotes.length > 0
      ? signalNotes.slice(0, 2).join(" and ")
      : "limited evidence from the submitted description";

  const reasoning =
    matchedNegative.length > 0 && matchedPositive.length > 0
      ? `The report shows mixed conditions. ${leadingReason} were noted, and the ${normalizedConfidence}% confidence level supports a cautious ${riskLevel}-risk interpretation.`
      : matchedPositive.length > 0
        ? `The score is driven mainly by ${leadingReason}. With ${normalizedConfidence}% confidence, the report suggests a realistic ${riskLevel}-risk abandonment pattern.`
        : `The description points to ${leadingReason}. With ${normalizedConfidence}% confidence, the evidence is not strong enough to justify an exaggerated score.`;

  return {
    abandonment_score: score,
    risk_level: riskLevel,
    reasoning
  };
};
