import React, { useState, useEffect } from 'react';
import {
  X,
  UserX,
  Shuffle,
  Hash,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileJson,
  Table,
  ArrowRight,
  Play,
  RotateCcw,
  Download,
  Info,
  Mail,
  User,
  Phone,
  Fingerprint,
  MapPin,
  Calendar,
  Globe,
  FileText,
} from 'lucide-react';

const AnonymizeModal = ({ isOpen, onClose, onRun, datasetInfo = null }) => {
  const [config, setConfig] = useState({
    strategy: 'pseudonymize',
    fields: [],
    previewMode: true,
    preserveStructure: true,
    maintainRelationships: true,
    deterministic: false,
    salt: '',
    algorithms: {
      email: 'hash',
      name: 'faker',
      phone: 'mask',
      id: 'uuid',
      address: 'generalize',
      date: 'perturb',
      numeric: 'noise',
    },
    customRules: [],
    outputFormat: 'in-place',
    outputLocation: '',
  });

  const [preview, setPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newRule, setNewRule] = useState({ field: '', method: 'hash', params: '' });
  const [activeTab, setActiveTab] = useState('configure');

  const fieldTypes = [
    { value: 'email', label: 'Email Address', icon: Mail, sensitive: true },
    { value: 'name', label: 'Full Name', icon: User, sensitive: true },
    { value: 'phone', label: 'Phone Number', icon: Phone, sensitive: true },
    { value: 'id', label: 'User ID / UUID', icon: Fingerprint, sensitive: true },
    { value: 'address', label: 'Physical Address', icon: MapPin, sensitive: true },
    { value: 'date', label: 'Date / Timestamp', icon: Calendar, sensitive: false },
    { value: 'numeric', label: 'Numeric Values', icon: Hash, sensitive: false },
    { value: 'ip', label: 'IP Address', icon: Globe, sensitive: true },
    { value: 'text', label: 'Free Text', icon: FileText, sensitive: false },
  ];

  const anonymizationMethods = {
    hash: { label: 'SHA-256 Hash', description: 'One-way cryptographic hash', reversible: false },
    faker: {
      label: 'Synthetic Data',
      description: 'Generate realistic fake values',
      reversible: false,
    },
    mask: {
      label: 'Partial Masking',
      description: 'Show first/last N characters only',
      reversible: true,
    },
    uuid: { label: 'UUID Replace', description: 'Replace with random UUID', reversible: false },
    generalize: {
      label: 'Generalization',
      description: 'Reduce precision (e.g., city instead of street)',
      reversible: false,
    },
    perturb: { label: 'Perturbation', description: 'Add statistical noise', reversible: false },
    noise: {
      label: 'Add Noise',
      description: 'Random variance for numeric data',
      reversible: false,
    },
    redact: { label: 'Full Redaction', description: 'Replace with [REDACTED]', reversible: false },
    tokenize: {
      label: 'Tokenization',
      description: 'Replace with reversible token',
      reversible: true,
    },
  };

  const [sampleData] = useState([
    {
      id: 'usr_8f92a1',
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1-555-0123',
      age: 34,
      city: 'San Francisco',
      salary: 95000,
      last_login: '2024-01-15T09:30:00Z',
    },
    {
      id: 'usr_3b71c4',
      name: 'Sarah Johnson',
      email: 'sarah.j@enterprise.org',
      phone: '+1-555-0456',
      age: 28,
      city: 'New York',
      salary: 82000,
      last_login: '2024-01-14T16:45:00Z',
    },
    {
      id: 'usr_9e55d2',
      name: 'Michael Chen',
      email: 'mchen@tech.io',
      phone: '+1-555-0789',
      age: 42,
      city: 'Austin',
      salary: 115000,
      last_login: '2024-01-13T11:20:00Z',
    },
    {
      id: 'usr_2a88f7',
      name: 'Emily Davis',
      email: 'emily.d@startup.co',
      phone: '+1-555-0321',
      age: 31,
      city: 'Seattle',
      salary: 88000,
      last_login: '2024-01-12T08:15:00Z',
    },
  ]);

  const [prevSchema, setPrevSchema] = useState(null);
  if (datasetInfo?.schema !== prevSchema) {
    setPrevSchema(datasetInfo?.schema);
    if (datasetInfo?.schema) {
      const detectedFields = datasetInfo.schema
        .filter((col) => fieldTypes.some((ft) => ft.value === col.type))
        .map((col) => ({
          name: col.name,
          type: col.type,
          method: config.algorithms[col.type] || 'hash',
          enabled: col.sensitive !== false,
        }));
      setConfig((prev) => ({ ...prev, fields: detectedFields }));
    }
  }

  if (!isOpen) return null;

  const toggleField = (fieldName) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.name === fieldName ? { ...f, enabled: !f.enabled } : f)),
    }));
  };

  const updateFieldMethod = (fieldName, method) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.name === fieldName ? { ...f, method } : f)),
    }));
  };

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const anonymized = sampleData.map((row) => {
      const newRow = { ...row };
      config.fields
        .filter((f) => f.enabled)
        .forEach((field) => {
          if (field.name === 'name') newRow[field.name] = '***REDACTED***';
          if (field.name === 'email') newRow[field.name] = '***@***.com';
          if (field.name === 'phone') newRow[field.name] = '+1-555-****';
          if (field.name === 'id')
            newRow[field.name] = 'usr_' + Math.random().toString(36).substr(2, 6);
          if (field.name === 'salary')
            newRow[field.name] = Math.round(row[field.name] * (0.9 + Math.random() * 0.2));
        });
      return newRow;
    });

    setPreview(anonymized);
    setIsGeneratingPreview(false);
    setActiveTab('preview');
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      await onRun(config);
      setActiveTab('results');
    } catch (error) {
      console.error('Anonymization failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const addCustomRule = () => {
    if (!newRule.field) return;
    setConfig((prev) => ({
      ...prev,
      customRules: [...prev.customRules, { ...newRule, id: Date.now() }],
    }));
    setNewRule({ field: '', method: 'hash', params: '' });
  };

  const removeCustomRule = (id) => {
    setConfig((prev) => ({
      ...prev,
      customRules: prev.customRules.filter((r) => r.id !== id),
    }));
  };

  const getMethodBadgeColor = (method) => {
    const info = anonymizationMethods[method];
    if (!info) return 'bg-gray-100 text-gray-700';
    if (info.reversible) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserX className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Anonymization</h2>
              <p className="text-sm text-gray-500">
                {datasetInfo
                  ? `Dataset: ${datasetInfo.name} (${datasetInfo.recordCount?.toLocaleString()} records)`
                  : 'Configure anonymization rules'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('configure')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'configure'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Configure
              </button>
              <button
                onClick={() => preview && setActiveTab('preview')}
                disabled={!preview}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${!preview ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('results')}
                disabled={activeTab !== 'results'}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'results'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${activeTab !== 'results' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Results
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'configure' && (
            <div className="space-y-6">
              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Anonymization Strategy
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: 'pseudonymize',
                      label: 'Pseudonymize',
                      desc: 'Replace identifiers while preserving structure',
                      icon: Shuffle,
                    },
                    {
                      value: 'anonymize',
                      label: 'Anonymize',
                      desc: 'Irreversible transformation',
                      icon: UserX,
                    },
                    {
                      value: 'synthesize',
                      label: 'Synthesize',
                      desc: 'Generate entirely fake dataset',
                      icon: Database,
                    },
                  ].map((strategy) => (
                    <button
                      key={strategy.value}
                      onClick={() => setConfig((prev) => ({ ...prev, strategy: strategy.value }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        config.strategy === strategy.value
                          ? 'border-purple-500 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <strategy.icon
                        className={`w-6 h-6 ${config.strategy === strategy.value ? 'text-purple-600' : 'text-gray-400'}`}
                      />
                      <span className="font-medium">{strategy.label}</span>
                      <span className="text-xs text-center opacity-75">{strategy.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Field Mapping</label>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Reversible
                    <span className="w-2 h-2 rounded-full bg-green-400 ml-2"></span> Irreversible
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 w-12">
                          <input
                            type="checkbox"
                            checked={config.fields.every((f) => f.enabled)}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                fields: prev.fields.map((f) => ({
                                  ...f,
                                  enabled: e.target.checked,
                                })),
                              }))
                            }
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Field</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          Detected Type
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Method</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {config.fields.length > 0 ? (
                        config.fields.map((field) => (
                          <tr
                            key={field.name}
                            className={field.enabled ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={field.enabled}
                                onChange={() => toggleField(field.name)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{field.name}</td>
                            <td className="px-4 py-3 text-gray-600 capitalize">{field.type}</td>
                            <td className="px-4 py-3">
                              <select
                                value={field.method}
                                onChange={(e) => updateFieldMethod(field.name, e.target.value)}
                                disabled={!field.enabled}
                                className={`text-xs font-medium px-2 py-1 rounded-full border outline-none ${getMethodBadgeColor(
                                  field.method
                                )} ${!field.enabled ? 'opacity-50' : ''}`}
                              >
                                {Object.entries(anonymizationMethods).map(([key, info]) => (
                                  <option key={key} value={key}>
                                    {info.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                              {field.enabled ? (
                                field.method === 'mask' ? (
                                  'j***@***.com'
                                ) : field.method === 'hash' ? (
                                  'a3f7...'
                                ) : field.method === 'uuid' ? (
                                  'usr_9x2...'
                                ) : field.method === 'redact' ? (
                                  '[REDACTED]'
                                ) : (
                                  '...'
                                )
                              ) : (
                                <span className="italic">unchanged</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No fields detected. Upload a dataset or add fields manually.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors mb-3"
                >
                  <RotateCcw
                    className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  />
                  Advanced Options
                </button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Preserve Structure
                          </span>
                          <p className="text-xs text-gray-500">Maintain table schema</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.preserveStructure}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, preserveStructure: e.target.checked }))
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Maintain Relationships
                          </span>
                          <p className="text-xs text-gray-500">Keep foreign key integrity</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.maintainRelationships}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              maintainRelationships: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-pointer">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Deterministic</span>
                          <p className="text-xs text-gray-500">Same input → same output</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={config.deterministic}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, deterministic: e.target.checked }))
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                      </label>

                      <div
                        className={`p-3 bg-white border border-gray-200 rounded-lg ${!config.deterministic ? 'opacity-50' : ''}`}
                      >
                        <span className="text-sm font-medium text-gray-700">Salt Key</span>
                        <input
                          type="text"
                          value={config.salt}
                          onChange={(e) => setConfig((prev) => ({ ...prev, salt: e.target.value }))}
                          disabled={!config.deterministic}
                          placeholder="Enter salt for deterministic hashing"
                          className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Custom Rules */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Rules
                      </label>
                      <div className="space-y-2">
                        {config.customRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-700">{rule.field}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getMethodBadgeColor(rule.method)}`}
                            >
                              {anonymizationMethods[rule.method]?.label || rule.method}
                            </span>
                            <button
                              onClick={() => removeCustomRule(rule.id)}
                              className="ml-auto p-1 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Field pattern (e.g., *.email)"
                            value={newRule.field}
                            onChange={(e) =>
                              setNewRule((prev) => ({ ...prev, field: e.target.value }))
                            }
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          />
                          <select
                            value={newRule.method}
                            onChange={(e) =>
                              setNewRule((prev) => ({ ...prev, method: e.target.value }))
                            }
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                          >
                            {Object.entries(anonymizationMethods).map(([key, info]) => (
                              <option key={key} value={key}>
                                {info.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={addCustomRule}
                            disabled={!newRule.field}
                            className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Output Options */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Output Format
                        </label>
                        <select
                          value={config.outputFormat}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, outputFormat: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                        >
                          <option value="in-place">Update In-Place</option>
                          <option value="new-table">New Table</option>
                          <option value="file-csv">Export CSV</option>
                          <option value="file-json">Export JSON</option>
                          <option value="file-parquet">Export Parquet</option>
                        </select>
                      </div>
                      {config.outputFormat !== 'in-place' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Output Location
                          </label>
                          <input
                            type="text"
                            value={config.outputLocation}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, outputLocation: e.target.value }))
                            }
                            placeholder="s3://bucket/path/"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'preview' && preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  This is a preview using sample data. Actual results may vary based on full dataset
                  characteristics.
                </span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {Object.keys(preview[0] || {}).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left font-medium text-gray-700 capitalize"
                        >
                          {key.replace('_', ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.values(row).map((val, vidx) => (
                          <td key={vidx} className="px-4 py-3 text-gray-600 font-mono text-xs">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Original records: {sampleData.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  <span>Fields modified: {config.fields.filter((f) => f.enabled).length}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymization Complete</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                The dataset has been successfully processed. All configured fields have been
                anonymized according to your rules.
              </p>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab !== 'results' && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Info className="w-4 h-4" />
              <span>
                {config.fields.filter((f) => f.enabled).length} fields configured for anonymization
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {activeTab === 'configure' && (
                <button
                  onClick={generatePreview}
                  disabled={
                    isGeneratingPreview || config.fields.filter((f) => f.enabled).length === 0
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGeneratingPreview ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Generate Preview
                    </>
                  )}
                </button>
              )}
              {activeTab === 'preview' && (
                <button
                  onClick={() => setActiveTab('configure')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Back to Config
                </button>
              )}
              <button
                onClick={activeTab === 'preview' ? handleRun : () => setActiveTab('preview')}
                disabled={isRunning || config.fields.filter((f) => f.enabled).length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : activeTab === 'preview' ? (
                  <>
                    <Play className="w-4 h-4" />
                    Run Anonymization
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Continue to Preview
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnonymizeModal;
