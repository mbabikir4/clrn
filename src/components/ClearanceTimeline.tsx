// Visual progress of a clearance request through Supervisor → Risk → Governance.
import type { AccessRequest, User } from '../types';

const STAGE_LABEL: Record<string, string> = {
  Supervisor: 'Supervisor / Manager sign-off',
  Risk: 'Risk Management review',
  Governance: 'Governance approval (sets ACL)',
};

export function ClearanceTimeline({
  request,
  users,
}: {
  request: AccessRequest;
  users: User[];
}) {
  const name = (id: string | null) => users.find((u) => u.id === id)?.name ?? id ?? '';
  return (
    <ol className="space-y-3">
      {request.steps.map((step, i) => {
        const isCurrent = request.currentStage === step.stage;
        const done = step.decision !== 'pending';
        const color =
          step.decision === 'approved'
            ? 'bg-emerald-500'
            : step.decision === 'denied'
              ? 'bg-rose-500'
              : isCurrent
                ? 'bg-brand-500'
                : 'bg-slate-300';
        return (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs text-white ${color}`}>
                {step.decision === 'approved' ? '✓' : step.decision === 'denied' ? '✕' : i + 1}
              </span>
              {i < request.steps.length - 1 && <span className="h-full w-px flex-1 bg-slate-200" />}
            </div>
            <div className="pb-1">
              <div className="text-sm font-medium text-slate-800">{STAGE_LABEL[step.stage]}</div>
              {done ? (
                <div className="text-xs text-slate-500">
                  {step.decision} by {name(step.decidedBy)}
                  {step.note ? ` — “${step.note}”` : ''}
                </div>
              ) : isCurrent ? (
                <div className="text-xs text-brand-600">Awaiting decision…</div>
              ) : (
                <div className="text-xs text-slate-400">Pending earlier stages</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
