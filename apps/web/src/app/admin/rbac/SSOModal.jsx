// src/app/admin/rbac/SSOModal.jsx — wired: async onSave + saving state (Phase 3D)
import React, { useState } from 'react';
import { X, Copy, Check, Shield, Link2 } from 'lucide-react';

const PROVIDER_TYPES = [
  { id: 'google', label: 'Google', color: '#4285F4', icon: 'G' },
  { id: 'microsoft', label: 'Microsoft', color: '#0078D4', icon: 'M' },
  { id: 'okta', label: 'Okta', color: '#1da1f2', icon: 'O' },
  { id: 'saml', label: 'SAML', color: '#635BFF', icon: 'S' },
  { id: 'custom', label: 'Custom', color: '#34495e', icon: 'C' },
];

const LOCAL_FIELDS = ['email', 'username', 'full_name', 'first_name', 'last_name', 'role'];

export default function SSOModal({
  isOpen,
  onClose,
  ssoConfig = null,
  onSave,
  saving = false,
  appDomain = 'https://app.example.com',
}) {
  const isEditing = !!ssoConfig;
  const [formData, setFormData] = useState({
    providerType: 'google',
    displayName: '',
    clientId: '',
    clientSecret: '',
    issuerUrl: '',
    attributeMapping: [
      { ssoAttr: 'email', localField: 'email' },
      { ssoAttr: 'name', localField: 'full_name' },
    ],
    isEnabled: true,
  });
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  const [prevResetKey, setPrevResetKey] = useState();
  const resetKey = ssoConfig ?? (isOpen ? 'open' : 'closed');
  if (prevResetKey === undefined || prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    if (ssoConfig) {
      setFormData({
        providerType: ssoConfig.providerType || 'google',
        displayName: ssoConfig.displayName || '',
        clientId: ssoConfig.clientId || '',
        clientSecret: ssoConfig.clientSecret || '',
        issuerUrl: ssoConfig.issuerUrl || '',
        attributeMapping: ssoConfig.attributeMapping || [
          { ssoAttr: 'email', localField: 'email' },
          { ssoAttr: 'name', localField: 'full_name' },
        ],
        isEnabled: ssoConfig.isEnabled ?? true,
      });
    } else {
      setFormData({
        providerType: 'google',
        displayName: '',
        clientId: '',
        clientSecret: '',
        issuerUrl: '',
        attributeMapping: [
          { ssoAttr: 'email', localField: 'email' },
          { ssoAttr: 'name', localField: 'full_name' },
        ],
        isEnabled: true,
      });
    }
    setErrors({});
    setCopied(false);
  }

  if (!isOpen) return null;

  const getRedirectUri = () => `${appDomain}/api/auth/callback/${formData.providerType}`;

  const validate = () => {
    const newErrors = {};
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (!formData.clientId.trim()) newErrors.clientId = 'Client ID is required';
    if (!isEditing && !formData.clientSecret.trim())
      newErrors.clientSecret = 'Client Secret is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Parent calls createSSOConfig/updateSSOConfig via useApiMutation and closes on success.
    await onSave?.({ ...formData, id: ssoConfig?.id });
  };

  const updateMapping = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      attributeMapping: prev.attributeMapping.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const addMapping = () => {
    setFormData((prev) => ({
      ...prev,
      attributeMapping: [...prev.attributeMapping, { ssoAttr: '', localField: 'email' }],
    }));
  };

  const removeMapping = (index) => {
    setFormData((prev) => ({
      ...prev,
      attributeMapping: prev.attributeMapping.filter((_, i) => i !== index),
    }));
  };

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(getRedirectUri());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const selectedProvider = PROVIDER_TYPES.find((p) => p.id === formData.providerType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[720px] rounded-xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit SSO Provider' : 'Configure SSO Provider'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Provider Type Grid */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Provider Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {PROVIDER_TYPES.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, providerType: provider.id }))}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                    formData.providerType === provider.id
                      ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: provider.color }}
                  >
                    {provider.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {provider.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="e.g., Company Google SSO"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-white ${
                errors.displayName ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.displayName && (
              <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>
            )}
          </div>

          {/* Client ID & Secret */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
                placeholder="Enter Client ID"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-white ${
                  errors.clientId ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.clientId && <p className="mt-1 text-xs text-red-500">{errors.clientId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Client Secret {isEditing ? '' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData((p) => ({ ...p, clientSecret: e.target.value }))}
                placeholder={isEditing ? '•••••••• (leave blank to keep)' : 'Enter Client Secret'}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:text-white ${
                  errors.clientSecret ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.clientSecret && (
                <p className="mt-1 text-xs text-red-500">{errors.clientSecret}</p>
              )}
            </div>
          </div>

          {/* Issuer URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Issuer URL / Domain
            </label>
            <input
              type="text"
              value={formData.issuerUrl}
              onChange={(e) => setFormData((p) => ({ ...p, issuerUrl: e.target.value }))}
              placeholder="https://accounts.google.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Redirect URI */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Redirect URI <span className="text-gray-400">(copy to provider)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={getRedirectUri()}
                readOnly
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 font-mono text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
              />
              <button
                type="button"
                onClick={copyRedirectUri}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Attribute Mapping */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attribute Mapping
              </label>
              <button
                type="button"
                onClick={addMapping}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                + Add mapping
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 px-4 py-2.5 dark:bg-gray-800/50">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  SSO Attribute
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Local Field
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {formData.attributeMapping.map((mapping, idx) => (
                  <div key={idx} className="grid grid-cols-2 items-center gap-3 px-4 py-2.5">
                    <input
                      type="text"
                      value={mapping.ssoAttr}
                      onChange={(e) => updateMapping(idx, 'ssoAttr', e.target.value)}
                      placeholder="e.g., email"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={mapping.localField}
                        onChange={(e) => updateMapping(idx, 'localField', e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        {LOCAL_FIELDS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      {formData.attributeMapping.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMapping(idx)}
                          className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable SSO
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Allow users to sign in via this provider.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, isEnabled: !p.isEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-indigo-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
