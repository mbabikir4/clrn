// ---------------------------------------------------------------------------
// Seeded demo data. Covers every role and department so all flows are testable
// out of the box. ALL data is fake — names, IDs, and figures are invented.
// ---------------------------------------------------------------------------

import type {
  AccessRequest,
  AuditEntry,
  ChecklistItem,
  Dataset,
  ModelRequest,
  User,
} from '../types';
import { GOVERNANCE_CHECKLIST } from '../lib/access';
import { generateAnalytics, generateInlineModels, generateSampleRows } from '../services/mocks';

// --- Users -----------------------------------------------------------------
// Password for every demo account is "demo".
export const seedUsers: User[] = [
  {
    id: 'WID-1001',
    name: 'Sarah Al-Otaibi',
    email: 'sarah.alotaibi@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Retail Banking',
    supervisorId: 'WID-1010',
    clearance: 'Internal',
    offNetwork: false,
  },
  {
    id: 'WID-1002',
    name: 'Khalid Al-Harbi',
    email: 'khalid.alharbi@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Commercial Banking',
    supervisorId: 'WID-1010',
    clearance: 'Internal',
    offNetwork: false,
  },
  {
    id: 'WID-1003',
    name: 'Maha Al-Qahtani',
    email: 'maha.alqahtani@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Investment Banking',
    supervisorId: 'WID-1011',
    clearance: 'Internal',
    offNetwork: true, // demo: flagged off the corporate network
  },
  {
    id: 'WID-1004',
    name: 'Noura Al-Dossari',
    email: 'noura.aldossari@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Wealth Management',
    supervisorId: 'WID-1011',
    clearance: 'Internal',
    offNetwork: false,
  },
  // Managers (org structure only — no longer an approval gate)
  {
    id: 'WID-1010',
    name: 'Faisal Al-Mutairi',
    email: 'faisal.almutairi@clr-bank.demo',
    password: 'demo',
    roles: ['Supervisor', 'Provider', 'Consumer'],
    department: 'Retail Banking',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  {
    id: 'WID-1011',
    name: 'Layla Al-Ghamdi',
    email: 'layla.alghamdi@clr-bank.demo',
    password: 'demo',
    roles: ['Supervisor', 'Provider', 'Consumer'],
    department: 'Investment Banking',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  // Risk Management (a department/role that data can be shared with)
  {
    id: 'WID-2001',
    name: 'Omar Al-Zahrani',
    email: 'omar.alzahrani@clr-bank.demo',
    password: 'demo',
    roles: ['Risk', 'Provider', 'Consumer'],
    department: 'Risk Management',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  // Governance (defines access groups + checklist; approves requests)
  {
    id: 'WID-3001',
    name: 'Reem Al-Shehri',
    email: 'reem.alshehri@clr-bank.demo',
    password: 'demo',
    roles: ['Governance', 'Consumer'],
    department: 'Investment Banking',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  // Data Department (approves heavy AI models)
  {
    id: 'WID-4001',
    name: 'Yousef Al-Anazi',
    email: 'yousef.alanazi@clr-bank.demo',
    password: 'demo',
    roles: ['DataDept', 'Consumer'],
    department: 'Wealth Management',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  // Admin
  {
    id: 'WID-9001',
    name: 'Huda Al-Rashid',
    email: 'huda.alrashid@clr-bank.demo',
    password: 'demo',
    roles: ['Admin', 'Consumer'],
    department: 'Retail Banking',
    supervisorId: 'WID-1099',
    clearance: 'Internal',
    offNetwork: false,
  },
  {
    id: 'WID-1099',
    name: 'Abdullah Al-Faisal',
    email: 'abdullah.alfaisal@clr-bank.demo',
    password: 'demo',
    roles: ['Supervisor', 'Consumer'],
    department: 'Risk Management',
    supervisorId: null,
    clearance: 'Internal',
    offNetwork: false,
  },
];

// --- Datasets --------------------------------------------------------------
function checklist(done: boolean): ChecklistItem[] {
  return GOVERNANCE_CHECKLIST.map((c) => ({ ...c, done }));
}

function buildDataset(
  base: Omit<
    Dataset,
    'analytics' | 'inlineModels' | 'sampleRows' | 'sampleColumns' | 'governance'
  > & {
    columns: string[];
    governanceDone: boolean;
  },
): Dataset {
  const { columns, governanceDone, ...rest } = base;
  const sample = generateSampleRows(base.id, columns);
  return {
    ...rest,
    governance: checklist(governanceDone),
    analytics: generateAnalytics(base.id, columns),
    inlineModels: generateInlineModels(base.id),
    sampleColumns: sample.columns,
    sampleRows: sample.rows,
  };
}

export const seedDatasets: Dataset[] = [
  buildDataset({
    id: 'DS-001',
    name: 'Retail Customer 360',
    description:
      'Unified view of individual customers: accounts, loans, mortgages and engagement signals across Retail Banking.',
    department: 'Retail Banking',
    sensitivity: 'Internal',
    ownerId: 'WID-1001',
    stewardId: 'WID-3001',
    createdAt: '2026-05-02T09:00:00.000Z',
    tags: ['customers', 'accounts', 'loans', 'mortgages'],
    status: 'Published',
    allowedDepartments: ['Retail Banking', 'Risk Management'],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['customer_id', 'account_balance', 'loan_amount', 'credit_score', 'tenure_months'],
    governanceDone: true,
  }),
  buildDataset({
    id: 'DS-002',
    name: 'Commercial Credit Lines',
    description: 'Business loans and revolving credit lines with utilization and risk grading.',
    department: 'Commercial Banking',
    sensitivity: 'Internal',
    ownerId: 'WID-1002',
    stewardId: 'WID-3001',
    createdAt: '2026-05-10T09:00:00.000Z',
    tags: ['credit', 'business', 'loans'],
    status: 'Published',
    allowedDepartments: ['Commercial Banking', 'Risk Management'],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['company_id', 'credit_line', 'utilization', 'industry_code', 'risk_grade'],
    governanceDone: true,
  }),
  buildDataset({
    id: 'DS-003',
    name: 'M&A Deal Pipeline',
    description: 'Capital-markets and M&A advisory pipeline: deal stages, sectors and probabilities.',
    department: 'Investment Banking',
    sensitivity: 'Internal',
    ownerId: 'WID-1003',
    stewardId: 'WID-3001',
    createdAt: '2026-05-18T09:00:00.000Z',
    tags: ['m&a', 'capital-markets', 'deals'],
    status: 'Published',
    allowedDepartments: ['Investment Banking'],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['deal_id', 'sector', 'deal_value_musd', 'stage', 'probability'],
    governanceDone: true,
  }),
  buildDataset({
    id: 'DS-004',
    name: 'HNW Portfolio Analytics',
    description:
      'High-net-worth client portfolios, AUM, risk appetite and estate-planning attributes for Wealth Management.',
    department: 'Wealth Management',
    sensitivity: 'Internal',
    ownerId: 'WID-1004',
    stewardId: 'WID-3001',
    createdAt: '2026-06-01T09:00:00.000Z',
    tags: ['wealth', 'portfolio', 'hnw'],
    status: 'Published',
    allowedDepartments: ['Wealth Management'],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['client_id', 'aum_musd', 'risk_appetite', 'portfolio_return', 'advisor_id'],
    governanceDone: true,
  }),
  buildDataset({
    id: 'DS-005',
    name: 'Credit Risk Exposures',
    description: 'Credit and operational risk exposures with PD/LGD/EAD and capital charges.',
    department: 'Risk Management',
    sensitivity: 'Internal',
    ownerId: 'WID-2001',
    stewardId: 'WID-3001',
    createdAt: '2026-06-08T09:00:00.000Z',
    tags: ['risk', 'credit', 'capital'],
    status: 'Published',
    allowedDepartments: ['Risk Management'],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['exposure_id', 'pd', 'lgd', 'ead', 'capital_charge'],
    governanceDone: true,
  }),
  buildDataset({
    id: 'DS-006',
    name: 'Mortgage Default Signals',
    description:
      'Early-warning signals for mortgage defaults. Submitted by Retail Banking, awaiting Governance to define access.',
    department: 'Retail Banking',
    sensitivity: 'Internal',
    ownerId: 'WID-1001',
    stewardId: 'WID-3001',
    createdAt: '2026-06-20T09:00:00.000Z',
    tags: ['mortgages', 'default', 'early-warning'],
    status: 'PendingGovernance', // demonstrates the pre-publish governance gate
    allowedDepartments: [],
    allowedRoles: [],
    heavyModelsEnabled: [],
    columns: ['loan_id', 'months_delinquent', 'ltv', 'dti', 'default_flag'],
    governanceDone: false,
  }),
];

// --- A pending one-step access request (Governance queue) -------------------
export const seedRequests: AccessRequest[] = [
  {
    id: 'REQ-001',
    datasetId: 'DS-003', // Commercial wants the (Investment-only) M&A pipeline
    requesterId: 'WID-1002',
    requesterDepartment: 'Commercial Banking',
    reason: 'Cross-sell analysis between commercial clients and active M&A targets.',
    status: 'pending',
    decidedBy: null,
    note: '',
    createdAt: '2026-06-22T08:00:00.000Z',
  },
];

// --- A pending heavy-model request (Data Dept queue) -----------------------
export const seedModelRequests: ModelRequest[] = [
  {
    id: 'MRQ-001',
    datasetId: 'DS-001',
    requesterId: 'WID-1001',
    modelName: 'Deep Churn Predictor (GPU)',
    status: 'pending',
    decidedBy: null,
    note: '',
    createdAt: '2026-06-24T08:00:00.000Z',
  },
];

export const seedAudit: AuditEntry[] = [
  {
    id: 'AUD-001',
    at: '2026-06-22T08:00:00.000Z',
    actorId: 'WID-1002',
    action: 'Requested access',
    target: 'DS-003',
  },
];