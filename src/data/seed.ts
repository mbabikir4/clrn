// ---------------------------------------------------------------------------
// Seeded demo data. Covers every role and department so all flows are testable
// out of the box. ALL data is fake — names, IDs, and figures are invented.
// ---------------------------------------------------------------------------

import type {
  AccessRequest,
  AuditEntry,
  Dataset,
  ModelRequest,
  User,
} from '../types';
import { generateAnalytics, generateInlineModels, generateSampleRows } from '../services/mocks';

// --- Users -----------------------------------------------------------------
// Password for every demo account is "demo".
export const seedUsers: User[] = [
  // Front-line employees (provider + consumer)
  {
    id: 'WID-1001',
    name: 'Sarah Al-Otaibi',
    email: 'sarah.alotaibi@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Retail Banking',
    supervisorId: 'WID-1010',
    clearance: 'Confidential',
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
    clearance: 'Confidential',
    offNetwork: true, // demo: flagged as off the corporate network
  },
  {
    id: 'WID-1004',
    name: 'Noura Al-Dossari',
    email: 'noura.aldossari@clr-bank.demo',
    password: 'demo',
    roles: ['Provider', 'Consumer'],
    department: 'Wealth Management',
    supervisorId: 'WID-1011',
    clearance: 'Restricted',
    offNetwork: false,
  },
  // Supervisors / managers (gate #1)
  {
    id: 'WID-1010',
    name: 'Faisal Al-Mutairi',
    email: 'faisal.almutairi@clr-bank.demo',
    password: 'demo',
    roles: ['Supervisor', 'Provider', 'Consumer'],
    department: 'Retail Banking',
    supervisorId: 'WID-1099',
    clearance: 'Confidential',
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
    clearance: 'Confidential',
    offNetwork: false,
  },
  // Risk Management (gate #2)
  {
    id: 'WID-2001',
    name: 'Omar Al-Zahrani',
    email: 'omar.alzahrani@clr-bank.demo',
    password: 'demo',
    roles: ['Risk', 'Provider', 'Consumer'],
    department: 'Risk Management',
    supervisorId: 'WID-1099',
    clearance: 'Restricted',
    offNetwork: false,
  },
  // Governance (heart of access control — sets ACLs, final approval)
  {
    id: 'WID-3001',
    name: 'Reem Al-Shehri',
    email: 'reem.alshehri@clr-bank.demo',
    password: 'demo',
    roles: ['Governance', 'Consumer'],
    department: 'Investment Banking',
    supervisorId: 'WID-1099',
    clearance: 'Restricted',
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
    clearance: 'Confidential',
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
    clearance: 'Restricted',
    offNetwork: false,
  },
  // Top-of-tree manager (supervisor of supervisors)
  {
    id: 'WID-1099',
    name: 'Abdullah Al-Faisal',
    email: 'abdullah.alfaisal@clr-bank.demo',
    password: 'demo',
    roles: ['Supervisor', 'Consumer'],
    department: 'Risk Management',
    supervisorId: null,
    clearance: 'Restricted',
    offNetwork: false,
  },
];

// --- Datasets --------------------------------------------------------------
// Helper to assemble a dataset with auto-generated mock artifacts.
function buildDataset(
  base: Omit<Dataset, 'analytics' | 'inlineModels' | 'sampleRows' | 'sampleColumns'> & {
    columns: string[];
  },
): Dataset {
  const { columns, ...rest } = base;
  const sample = generateSampleRows(base.id, columns);
  return {
    ...rest,
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
    sensitivity: 'Confidential',
    ownerId: 'WID-1001',
    stewardId: 'WID-3001',
    createdAt: '2026-05-02T09:00:00.000Z',
    tags: ['customers', 'accounts', 'loans', 'mortgages'],
    status: 'Published',
    acl: ['WID-1001', 'WID-1010', 'WID-3001'],
    heavyModelsEnabled: [],
    columns: ['customer_id', 'account_balance', 'loan_amount', 'credit_score', 'tenure_months'],
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
    acl: ['WID-1002', 'WID-3001'],
    heavyModelsEnabled: [],
    columns: ['company_id', 'credit_line', 'utilization', 'industry_code', 'risk_grade'],
  }),
  buildDataset({
    id: 'DS-003',
    name: 'M&A Deal Pipeline',
    description: 'Capital-markets and M&A advisory pipeline: deal stages, sectors and probabilities.',
    department: 'Investment Banking',
    sensitivity: 'Restricted',
    ownerId: 'WID-1003',
    stewardId: 'WID-3001',
    createdAt: '2026-05-18T09:00:00.000Z',
    tags: ['m&a', 'capital-markets', 'deals'],
    status: 'Published',
    acl: ['WID-1003', 'WID-3001'],
    heavyModelsEnabled: [],
    columns: ['deal_id', 'sector', 'deal_value_musd', 'stage', 'probability'],
  }),
  buildDataset({
    id: 'DS-004',
    name: 'HNW Portfolio Analytics',
    description:
      'High-net-worth client portfolios, AUM, risk appetite and estate-planning attributes for Wealth Management.',
    department: 'Wealth Management',
    sensitivity: 'Restricted',
    ownerId: 'WID-1004',
    stewardId: 'WID-3001',
    createdAt: '2026-06-01T09:00:00.000Z',
    tags: ['wealth', 'portfolio', 'hnw'],
    status: 'Published',
    acl: ['WID-1004', 'WID-3001'],
    heavyModelsEnabled: [],
    columns: ['client_id', 'aum_musd', 'risk_appetite', 'portfolio_return', 'advisor_id'],
  }),
  buildDataset({
    id: 'DS-005',
    name: 'Credit Risk Exposures',
    description: 'Credit and operational risk exposures with PD/LGD/EAD and capital charges.',
    department: 'Risk Management',
    sensitivity: 'Confidential',
    ownerId: 'WID-2001',
    stewardId: 'WID-3001',
    createdAt: '2026-06-08T09:00:00.000Z',
    tags: ['risk', 'credit', 'capital'],
    status: 'Published',
    acl: ['WID-2001', 'WID-3001'],
    heavyModelsEnabled: [],
    columns: ['exposure_id', 'pd', 'lgd', 'ead', 'capital_charge'],
  }),
  buildDataset({
    id: 'DS-006',
    name: 'Mortgage Default Signals',
    description:
      'Early-warning signals for mortgage defaults. Submitted by Retail Banking, awaiting Governance to define access.',
    department: 'Retail Banking',
    sensitivity: 'Confidential',
    ownerId: 'WID-1001',
    stewardId: 'WID-3001',
    createdAt: '2026-06-20T09:00:00.000Z',
    tags: ['mortgages', 'default', 'early-warning'],
    status: 'PendingGovernance', // demonstrates the pre-publish governance gate
    acl: [],
    heavyModelsEnabled: [],
    columns: ['loan_id', 'months_delinquent', 'ltv', 'dti', 'default_flag'],
  }),
];

// --- An in-flight access request (demonstrates the clearance queue) ---------
export const seedRequests: AccessRequest[] = [
  {
    id: 'REQ-001',
    datasetId: 'DS-003', // Khalid (Commercial) wants the M&A pipeline
    requesterId: 'WID-1002',
    reason: 'Cross-sell analysis between commercial clients and active M&A targets.',
    currentStage: 'Risk',
    createdAt: '2026-06-22T08:00:00.000Z',
    steps: [
      {
        stage: 'Supervisor',
        decidedBy: 'WID-1010',
        decision: 'approved',
        note: 'Legitimate business need — approved.',
        decidedAt: '2026-06-22T10:00:00.000Z',
      },
      { stage: 'Risk', decidedBy: null, decision: 'pending', note: '', decidedAt: null },
      { stage: 'Governance', decidedBy: null, decision: 'pending', note: '', decidedAt: null },
    ],
  },
];

// --- A pending heavy-model request (demonstrates the Data Dept queue) -------
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
    at: '2026-06-22T10:00:00.000Z',
    actorId: 'WID-1010',
    action: 'Approved supervisor sign-off',
    target: 'REQ-001',
  },
];
