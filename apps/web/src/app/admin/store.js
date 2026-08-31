/* src/app/admin/store.js */
import { create } from 'zustand';
import { initialTenants } from './data';

export const useTenantStore = create((set, get) => ({
  tenants: initialTenants,

  addTenant: (newTenant) =>
    set((state) => ({ tenants: [newTenant, ...state.tenants] })),

  updateTenant: (id, updater) =>
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id
          ? typeof updater === 'function'
            ? updater(t)
            : { ...t, ...updater }
          : t
      ),
    })),

  removeTenant: (id) =>
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== id),
    })),

  getTenantById: (id) => get().tenants.find((t) => t.id === id),

  getTenantBySubdomain: (subdomain) =>
    get().tenants.find((t) => t.subdomain === subdomain),

  setTenantStatus: (id, status) =>
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, status } : t
      ),
    })),

  setBillingStatus: (id, billingStatus) =>
    set((state) => ({
      tenants: state.tenants.map((t) =>
        t.id === id ? { ...t, billingStatus } : t
      ),
    })),
}));
