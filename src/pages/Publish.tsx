// Provider experience: publish a dataset with metadata. On submit it goes to
// Governance (PendingGovernance) before it becomes broadly accessible.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUser, useStore } from '../db/store';
import type { Department } from '../types';
import { DEPARTMENTS } from '../lib/labels';
import { sampleColumnsFor } from '../services/mocks';
import { SectionTitle } from '../components/ui';

export function Publish() {
  const store = useStore();
  const user = currentUser(store)!;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>(user.department);
  const [stewardId, setStewardId] = useState('WID-3001'); // default: Governance
  const [tags, setTags] = useState('');
  const [columns, setColumns] = useState(sampleColumnsFor(user.department).join(', '));

  function loadSample() {
    setColumns(sampleColumnsFor(department).join(', '));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = store.publishDataset(user.id, {
      name: name.trim(),
      description: description.trim(),
      department,
      sensitivity: 'Internal', // all data is classified Internal
      stewardId,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      columns: columns
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    });
    navigate(`/dataset/${id}`);
  }

  const canSubmit = name.trim() && description.trim() && columns.trim();

  return (
    <div className="mx-auto max-w-3xl">
      <SectionTitle
        title="Publish a dataset"
        subtitle="Add metadata. Governance defines access before it goes live."
      />

      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <label className="label">Dataset name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Retail Term Deposits 2026"
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's in the data and what it's useful for…"
          />
        </div>

        <div>
          <label className="label">Owning department</label>
          <select
            className="input"
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">All data is classified Internal.</p>
        </div>

        <div>
          <label className="label">Person responsible for clearing (steward)</label>
          <select className="input" value={stewardId} onChange={(e) => setStewardId(e.target.value)}>
            {store.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.id}) — {u.department}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Person accountable for clearing access.
          </p>
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="deposits, retail, 2026"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label">Columns (comma-separated)</label>
            <button type="button" className="text-xs text-brand-600 hover:underline" onClick={loadSample}>
              Use sample columns for {department}
            </button>
          </div>
          <input className="input" value={columns} onChange={(e) => setColumns(e.target.value)} />
          <p className="mt-1 text-xs text-slate-500">
            Analytics and AI are auto-generated from these columns (mocked).
          </p>
        </div>

        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">
          On submit, this goes to <strong>Governance</strong> to set access before it's published.
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate('/marketplace')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            Submit to Governance
          </button>
        </div>
      </form>
    </div>
  );
}
