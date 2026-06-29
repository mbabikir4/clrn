// ---------------------------------------------------------------------------
// Deterministic mock generators.
// Used both to seed demo datasets and to "auto-generate" artifacts when a
// provider publishes a new dataset. No real computation happens here — the
// numbers are plausible-looking dummies derived from a string seed so the same
// dataset always renders the same charts.
// ---------------------------------------------------------------------------

import type {
  ComplianceReport,
  DatasetAnalytics,
  Department,
  InlineModelResult,
} from '../types';

/** Tiny deterministic PRNG so charts are stable per dataset (no Math.random). */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Build mocked auto-analytics for a dataset id + column hints. */
export function generateAnalytics(seedKey: string, columns: string[]): DatasetAnalytics {
  const rnd = seeded(seedKey);
  const rowCount = 2_000 + Math.floor(rnd() * 48_000);
  const completeness = 0.9 + rnd() * 0.099;

  const columnStats = columns.map((name) => {
    const types = ['string', 'number', 'date', 'boolean', 'currency'];
    const type = types[Math.floor(rnd() * types.length)];
    return {
      name,
      type,
      nulls: Math.floor(rnd() * rowCount * 0.05),
      sample:
        type === 'number' || type === 'currency'
          ? (rnd() * 10000).toFixed(2)
          : type === 'date'
            ? '2025-0' + (1 + Math.floor(rnd() * 9)) + '-15'
            : type === 'boolean'
              ? rnd() > 0.5
                ? 'true'
                : 'false'
              : 'sample-' + Math.floor(rnd() * 999),
    };
  });

  const distribution = ['0-25%', '25-50%', '50-75%', '75-100%'].map((label) => ({
    label,
    value: Math.floor(20 + rnd() * 80),
  }));

  const trend = MONTHS.slice(0, 8).map((period) => ({
    period,
    value: Math.floor(1000 + rnd() * 9000),
  }));

  const categories = ['Segment A', 'Segment B', 'Segment C', 'Segment D'].map((name) => ({
    name,
    value: Math.floor(10 + rnd() * 90),
  }));

  return {
    rowCount,
    columnCount: columns.length,
    completeness,
    summary: `Auto-profiled ${rowCount.toLocaleString()} rows across ${columns.length} columns. Data completeness ${(completeness * 100).toFixed(1)}%. No critical schema anomalies detected (mocked).`,
    columns: columnStats,
    distribution,
    trend,
    categories,
  };
}

/** Build mocked inline AI-model results that "run automatically". */
export function generateInlineModels(seedKey: string): InlineModelResult[] {
  const rnd = seeded(seedKey + ':models');

  const clusterPoints = Array.from({ length: 40 }, (_, i) => {
    const group = i % 3;
    return {
      x: Math.round(group * 30 + rnd() * 25),
      y: Math.round(group * 20 + rnd() * 25),
      group: ['Cluster 1', 'Cluster 2', 'Cluster 3'][group],
    };
  });

  const regPoints = Array.from({ length: 24 }, (_, i) => ({
    x: i,
    y: Math.round(i * (2 + rnd()) + rnd() * 8),
  }));

  const anomalyPoints = Array.from({ length: 30 }, (_, i) => {
    const spike = rnd() > 0.88;
    return {
      x: i,
      y: spike ? Math.round(80 + rnd() * 40) : Math.round(20 + rnd() * 20),
      group: spike ? 'Anomaly' : 'Normal',
    };
  });

  const r2 = (0.7 + rnd() * 0.28).toFixed(2);
  const anomalies = anomalyPoints.filter((p) => p.group === 'Anomaly').length;

  return [
    {
      name: 'Clustering',
      headline: '3 customer segments detected',
      detail: 'K-means (k=3) over normalized features. Segments are well-separated (silhouette ≈ 0.6, mocked).',
      points: clusterPoints,
    },
    {
      name: 'Regression',
      headline: `Linear trend fit, R² = ${r2}`,
      detail: 'Ordinary least squares over the primary numeric column vs. time index (mocked).',
      points: regPoints,
    },
    {
      name: 'Anomaly Detection',
      headline: `${anomalies} anomalies flagged`,
      detail: 'Isolation-forest style scoring; points above the 95th percentile are flagged (mocked).',
      points: anomalyPoints,
    },
  ];
}

/** A handful of dummy sample rows for the data preview (post-access). */
export function generateSampleRows(
  seedKey: string,
  columns: string[],
): { columns: string[]; rows: Record<string, string | number>[] } {
  const rnd = seeded(seedKey + ':rows');
  const rows = Array.from({ length: 6 }, (_, r) => {
    const row: Record<string, string | number> = { id: 1000 + r };
    columns.forEach((c) => {
      row[c] = Math.round(rnd() * 10000) / 100;
    });
    return row;
  });
  return { columns: ['id', ...columns], rows };
}

// ---------------------------------------------------------------------------
// Regulatory & Compliance — mocked, region-configurable (KSA default).
// ---------------------------------------------------------------------------

export interface RegionProfile {
  region: string;
  profile: string;
  controls: string[];
}

export const REGION_PROFILES: Record<string, RegionProfile> = {
  KSA: {
    region: 'Saudi Arabia',
    profile: 'SAMA / PDPL',
    controls: [
      'PDPL: lawful basis for processing personal data',
      'PDPL: data subject consent recorded',
      'PDPL: cross-border transfer restriction respected',
      'SAMA: data residency within the Kingdom',
      'SAMA: customer data encryption at rest',
      'SAMA: access logging & audit trail enabled',
    ],
  },
  EU: {
    region: 'European Union',
    profile: 'GDPR',
    controls: [
      'GDPR: lawful basis (Art. 6) documented',
      'GDPR: data minimization applied',
      'GDPR: right-to-erasure supported',
      'GDPR: international transfer safeguards (SCCs)',
    ],
  },
  US: {
    region: 'United States',
    profile: 'GLBA / CCPA',
    controls: [
      'GLBA: safeguards rule controls',
      'CCPA: consumer opt-out honored',
      'GLBA: privacy notice provided',
    ],
  },
};

/** Run mocked compliance checks for a dataset under a region profile. */
export function runComplianceChecks(datasetId: string, regionKey: string): ComplianceReport {
  const profile = REGION_PROFILES[regionKey] ?? REGION_PROFILES.KSA;
  const rnd = seeded(datasetId + ':' + regionKey);
  // All data is classified Internal — small, uniform chance of a flagged control.
  const flagBias = 0.1;

  const checks = profile.controls.map((control) => {
    const flagged = rnd() < flagBias;
    return {
      control,
      result: flagged ? ('flag' as const) : ('pass' as const),
      detail: flagged
        ? 'Manual review recommended before broad access (mocked finding).'
        : 'Control satisfied (mocked).',
    };
  });

  return {
    region: profile.region,
    profile: profile.profile,
    generatedAt: new Date().toISOString(),
    checks,
  };
}

/** Suggested sample columns per department for the publish form. */
export function sampleColumnsFor(dept: Department): string[] {
  switch (dept) {
    case 'Retail Banking':
      return ['customer_id', 'account_balance', 'loan_amount', 'credit_score', 'tenure_months'];
    case 'Commercial Banking':
      return ['company_id', 'credit_line', 'utilization', 'industry_code', 'risk_grade'];
    case 'Investment Banking':
      return ['deal_id', 'sector', 'deal_value_musd', 'stage', 'probability'];
    case 'Wealth Management':
      return ['client_id', 'aum_musd', 'risk_appetite', 'portfolio_return', 'advisor_id'];
    case 'Risk Management':
      return ['exposure_id', 'pd', 'lgd', 'ead', 'capital_charge'];
    default:
      return ['col_a', 'col_b', 'col_c'];
  }
}
