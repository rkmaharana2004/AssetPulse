import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Cpu, 
  Calendar, 
  Building, 
  Factory, 
  AlertCircle,
  X
} from 'lucide-react';
import { api } from '../api/apiClient';
import { Asset, AssetRequest } from '../types/asset.types';
import { PriorityBadge } from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';

interface AssetsPageProps {
  onOpenTicketForAsset?: (asset: Asset) => void;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({ onOpenTicketForAsset }) => {
  const { hasRole } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<AssetRequest>({
    assetCode: '',
    name: '',
    department: '',
    manufacturer: '',
    serviceIntervalDays: 90,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = '/api/v1/assets?';
      if (departmentFilter) query += `department=${encodeURIComponent(departmentFilter)}&`;
      if (statusFilter) query += `status=${encodeURIComponent(statusFilter)}&`;
      const data = await api.get<Asset[]>(query);
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [departmentFilter, statusFilter]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post<Asset>('/api/v1/assets', formData);
      setShowAddModal(false);
      setFormData({
        assetCode: '',
        name: '',
        department: '',
        manufacturer: '',
        serviceIntervalDays: 90,
      });
      fetchAssets();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFormError(e.message || 'Failed to register equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const departments = Array.from(new Set(assets.map((a) => a.department))).filter(Boolean);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      a.manufacturer.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const canRegister = hasRole(['ADMIN', 'ENGINEER']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-sky-400" />
            <span>Industrial Equipment Fleet</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Catalog of tracked manufacturing & lab machinery, scheduled service intervals, and operating states.
          </p>
        </div>

        {canRegister && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, machine name, manufacturer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading equipment registry...</div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
          No equipment matching the filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isDueSoon =
              asset.nextServiceDueDate &&
              new Date(asset.nextServiceDueDate) <= new Date(Date.now() + 15 * 86400000);

            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 bg-sky-950/80 rounded border border-sky-800">
                        {asset.assetCode}
                      </span>
                      <h3 className="font-bold text-base text-white mt-1.5 line-clamp-1">
                        {asset.name}
                      </h3>
                    </div>
                    <PriorityBadge value={asset.status} />
                  </div>

                  <div className="space-y-2 text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Dept:</span>
                      <span className="text-slate-200 font-medium">{asset.department}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <Factory className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Manufacturer:</span>
                      <span className="text-slate-200 font-medium">{asset.manufacturer}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Service Interval:</span>
                      <span className="text-slate-200 font-medium">Every {asset.serviceIntervalDays} days</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Last Serviced:</span>
                        <span className="text-xs font-mono text-slate-300">
                          {asset.lastServicedDate || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Next Due:</span>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isDueSoon ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {asset.nextServiceDueDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {onOpenTicketForAsset && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => onOpenTicketForAsset(asset)}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 py-1 px-2.5 rounded-lg bg-sky-950/40 hover:bg-sky-950 border border-sky-800/60 transition-colors"
                    >
                      + Raise Ticket
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register New Asset */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Register New Equipment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Add industrial machinery to the operations catalog with service interval tracking.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    value={formData.assetCode}
                    onChange={(e) => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. CNC-MILL-03"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service Interval (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.serviceIntervalDays}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceIntervalDays: parseInt(e.target.value) || 30 })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Machine Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Multi-Spindle Lathe 4000 RPM"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Precision Machining"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Haas, Trumpf, KUKA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
