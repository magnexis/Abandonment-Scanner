import type { AbandonmentStatus, ConfidenceLevel, RiskLevel, ScoreFactor } from "./types";

export interface ScoreInputs {
  yearsSinceSale: number;
  vegetationLevel: number;
  brokenWindowsLevel: number;
  activityAbsenceLevel: number;
  reportWeight: number;
  permitGapLevel: number;
}

export interface ScoreResult {
  score: number;
  status: AbandonmentStatus;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  factors: ScoreFactor[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatPercent = (value: number) => `${Math.round(value)}%`;

export const getStatus = (score: number): AbandonmentStatus => {
  if (score >= 70) return "Likely Abandoned";
  if (score >= 30) return "Suspicious";
  return "Active";
};

export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 75) return "High";
  if (score >= 45) return "Moderate";
  return "Low";
};

export const getConfidenceLevel = (score: number, factors: ScoreFactor[]): ConfidenceLevel => {
  const averageFactorConfidence =
    factors.reduce((total, factor) => total + factor.confidence, 0) / Math.max(factors.length, 1);

  if (score >= 70 && averageFactorConfidence >= 72) return "High";
  if (score >= 40 || averageFactorConfidence >= 64) return "Medium";
  return "Low";
};

export const calculateAbandonmentScore = (inputs: ScoreInputs): ScoreResult => {
  const factors: ScoreFactor[] = [
    {
      key: "last-sale",
      label: "Years Since Last Sale",
      impact: clamp(inputs.yearsSinceSale * 2.8, 0, 20),
      value: `${inputs.yearsSinceSale.toFixed(1)} years`,
      confidence: 84
    },
    {
      key: "vegetation",
      label: "Overgrown Vegetation",
      impact: clamp(inputs.vegetationLevel * 15, 0, 15),
      value: formatPercent(inputs.vegetationLevel * 100),
      confidence: 72
    },
    {
      key: "windows",
      label: "Broken Windows / Decay",
      impact: clamp(inputs.brokenWindowsLevel * 25, 0, 25),
      value: formatPercent(inputs.brokenWindowsLevel * 100),
      confidence: 78
    },
    {
      key: "activity",
      label: "Recent Activity Gap",
      impact: clamp(inputs.activityAbsenceLevel * 20, 0, 20),
      value: formatPercent(inputs.activityAbsenceLevel * 100),
      confidence: 81
    },
    {
      key: "reports",
      label: "Community Reports",
      impact: clamp(inputs.reportWeight, 0, 12),
      value: `${inputs.reportWeight.toFixed(0)} signal`,
      confidence: 69
    },
    {
      key: "permits",
      label: "Permit / Utility Silence",
      impact: clamp(inputs.permitGapLevel * 8, 0, 8),
      value: formatPercent(inputs.permitGapLevel * 100),
      confidence: 66
    }
  ];

  const rawScore = factors.reduce((total, factor) => total + factor.impact, 0);
  const score = Math.round(clamp(rawScore, 0, 100));
  const status = getStatus(score);
  const riskLevel = getRiskLevel(score);
  const confidence = getConfidenceLevel(score, factors);

  return { score, status, riskLevel, confidence, factors };
};
