// ---------------------------------------------------------------------------
// Domain types for the CLR Data Marketplace PoC.
// Everything here is dummy/demo data — no production semantics.
// ---------------------------------------------------------------------------

/** Roles in the platform. Every employee is implicitly provider + consumer. */
export type Role =
  | 'Provider' // can publish datasets (every employee has this)
  | 'Consumer' // can browse + request datasets (every employee has this)
  | 'Risk' // Risk Management — gate #2 in the clearance flow
  | 'Governance' // owns ACLs + final approval — heart of access control
  | 'DataDept' // Data Department — approves heavy AI models
  | 'Supervisor' // Supervisor/Manager — gate #1 in the clearance flow
  | 'Admin'; // platform administration

/** Business departments used to tag both users and datasets. */
export type Department =
  | 'Retail Banking'
  | 'Commercial Banking'
  | 'Investment Banking'
  | 'Wealth Management'
  | 'Risk Management';

/** Clearance / data-sensitivity classification levels (low → high). */
export type ClearanceLevel = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export interface User {
  id: string; // Work ID, e.g. "WID-1001"
  name: string;
  email: string;
  password: string; // dummy only — plaintext is fine for a demo
  roles: Role[];
  department: Department;
  supervisorId: string | null; // Work ID of the user's manager
  clearance: ClearanceLevel;
  /** Demo toggle: simulate the user being off the corporate network. */
  offNetwork: boolean;
}

/** Sensitivity declared by the provider when publishing. */
export type Sensitivity = ClearanceLevel;

/** A request for someone to be added to a dataset's ACL. */
export type RequestStage =
  | 'Supervisor' // awaiting supervisor/manager sign-off
  | 'Risk' // awaiting Risk Management review
  | 'Governance' // awaiting Governance approval (will set ACL)
  | 'Granted' // approved end-to-end → on the ACL
  | 'Denied'; // rejected at some stage

export interface ClearanceStep {
  stage: RequestStage;
  decidedBy: string | null; // Work ID of the approver
  decision: 'pending' | 'approved' | 'denied';
  note: string;
  decidedAt: string | null; // ISO timestamp
}

export interface AccessRequest {
  id: string;
  datasetId: string;
  requesterId: string;
  reason: string;
  currentStage: RequestStage;
  steps: ClearanceStep[]; // ordered: Supervisor → Risk → Governance
  createdAt: string;
}

/** A heavy/large AI-model run request routed to the Data Department. */
export interface ModelRequest {
  id: string;
  datasetId: string;
  requesterId: string;
  modelName: string;
  status: 'pending' | 'approved' | 'denied';
  decidedBy: string | null;
  note: string;
  createdAt: string;
}

/** Mocked auto-generated analytics for a dataset. */
export interface DatasetAnalytics {
  rowCount: number;
  columnCount: number;
  completeness: number; // 0..1 — share of non-null cells
  summary: string;
  /** Per-column quick stats for the stats table. */
  columns: { name: string; type: string; nulls: number; sample: string }[];
  /** Generic bar/line series for charts. */
  distribution: { label: string; value: number }[];
  trend: { period: string; value: number }[];
  categories: { name: string; value: number }[];
}

/** Mocked inline AI-model result attached to a dataset. */
export interface InlineModelResult {
  name: 'Clustering' | 'Regression' | 'Anomaly Detection';
  headline: string;
  detail: string;
  points: { x: number; y: number; group?: string }[];
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  department: Department;
  sensitivity: Sensitivity;
  ownerId: string; // Work ID of the publishing provider
  stewardId: string; // named person responsible for clearing access
  createdAt: string;
  /** Tags for search/filtering. */
  tags: string[];
  /**
   * Governance lifecycle:
   *  - 'PendingGovernance': submitted, awaiting Governance to define the ACL
   *  - 'Published': Governance has defined access; visible in catalog
   */
  status: 'PendingGovernance' | 'Published';
  /** Per-person ACL — Work IDs explicitly allowed to view the data. */
  acl: string[];
  /** Mocked artifacts generated automatically on upload. */
  analytics: DatasetAnalytics;
  inlineModels: InlineModelResult[];
  /** Heavy models that the Data Department has approved for this dataset. */
  heavyModelsEnabled: string[];
  /** A few rows of dummy sample data to preview once access is granted. */
  sampleRows: Record<string, string | number>[];
  sampleColumns: string[];
}

/** Mocked regulatory/compliance check result. */
export interface ComplianceCheck {
  control: string;
  result: 'pass' | 'flag';
  detail: string;
}

export interface ComplianceReport {
  region: string;
  profile: string; // e.g. "SAMA / PDPL"
  generatedAt: string;
  checks: ComplianceCheck[];
}

/** Lightweight audit-log entry to demonstrate security awareness. */
export interface AuditEntry {
  id: string;
  at: string;
  actorId: string;
  action: string;
  target: string;
}
