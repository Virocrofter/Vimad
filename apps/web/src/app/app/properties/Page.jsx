/* apps/web/src/app/app/properties/page.jsx — C1
 * Administration → Properties: chain cards, every property in the tenant,
 * and per-row chain assignment. This is the chain-admin home surface.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Link2, Plus, RefreshCw } from 'lucide-react';
import { listChains, createChain, attachProperty, detachProperty } from '../../../api/chains';
import { listProperties } from '../../../api/properties';

export default function PropertiesDashboardPage() {
  const queryClient = useQueryClient();
  const [newChain, setNewChain] = useState({ name: '', slug: '' });

  const chainsQuery = useQuery({ queryKey: ['chains'], queryFn: listChains });
  const propertiesQuery = useQuery({ queryKey: ['properties'], queryFn: listProperties });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['chains'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['property-scope'] }),
    ]);

  const createMutation = useMutation({
    mutationFn: () =>
      createChain({
        name: newChain.name,
        slug: newChain.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }),
    onSuccess: () => {
      setNewChain({ name: '', slug: '' });
      return invalidate();
    },
  });

  const attachMutation = useMutation({
    mutationFn: ({ chainId, propertyId }) => attachProperty(chainId, propertyId),
    onSuccess: invalidate,
  });

  const detachMutation = useMutation({
    mutationFn: ({ chainId, propertyId }) => detachProperty(chainId, propertyId),
    onSuccess: invalidate,
  });

  const chains = chainsQuery.data ?? [];
  const properties = propertiesQuery.data ?? [];
  const chainById = Object.fromEntries(chains.map((c) => [c.id, c]));

  const handleChainChange = (property, nextChainId) => {
    if (nextChainId === (property.chainId ?? '')) return;
    if (property.chainId) {
      detachMutation.mutate(
        { chainId: property.chainId, propertyId: property.id },
        {
          onSuccess: () => {
            if (nextChainId) {
              attachMutation.mutate({ chainId: nextChainId, propertyId: property.id });
            }
          },
        }
      );
    } else if (nextChainId) {
      attachMutation.mutate({ chainId: nextChainId, propertyId: property.id });
    }
  };

  const error = chainsQuery.error || propertiesQuery.error;
  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        Failed to load properties: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Properties</h1>
          <p className="text-sm text-text-muted">
            {properties.length} properties · {chains.length} chain
            {chains.length === 1 ? '' : 's'} — one login operates the whole group.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            chainsQuery.refetch();
            propertiesQuery.refetch();
          }}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* ─── Chains ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Chains
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {chains.map((chain) => (
            <div key={chain.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-text-primary">{chain.name}</h3>
              </div>
              <p className="mt-1 text-xs text-text-muted">{chain.slug}</p>
              <p className="mt-3 text-sm text-text-secondary">
                {chain._count?.properties ?? chain.properties?.length ?? 0} properties
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(chain.properties ?? []).map((p) => (
                  <span
                    key={p.id}
                    className="rounded bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary"
                  >
                    {p.code}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* Create chain */}
          <div className="rounded-lg border border-dashed border-border bg-surface p-4">
            <h3 className="flex items-center gap-2 font-semibold text-text-primary">
              <Plus className="h-4 w-4" /> New chain
            </h3>
            <div className="mt-3 space-y-2">
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                placeholder="Chain name"
                value={newChain.name}
                onChange={(e) => setNewChain((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
                placeholder="slug-demo-coast"
                value={newChain.slug}
                onChange={(e) => setNewChain((s) => ({ ...s, slug: e.target.value }))}
              />
              <button
                type="button"
                disabled={!newChain.name || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create chain'}
              </button>
              {createMutation.error && (
                <p className="text-xs text-danger">{createMutation.error.message}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── All properties ─── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
          All properties
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Chain</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-surface-elevated/50"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">{p.code}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-text-primary">
                      <Building2 className="h-4 w-4 text-text-muted" /> {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.status === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-elevated text-text-muted'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm text-text-primary"
                      value={p.chainId ?? ''}
                      onChange={(e) => handleChainChange(p, e.target.value)}
                    >
                      <option value="">— No chain —</option>
                      {chains.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && !propertiesQuery.isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No properties yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {(attachMutation.error || detachMutation.error) && (
          <p className="mt-2 text-xs text-danger">
            {(attachMutation.error || detachMutation.error).message}
          </p>
        )}
      </section>

      {chainById && null}
    </div>
  );
}
