import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  RefreshCw, 
  MapPin, 
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/apiClient';
import { SparePart, SparePartRequest } from '../types/asset.types';
import { useAuth } from '../context/AuthContext';

interface SparePartsPageProps {
  initialRestockPart?: SparePart | null;
  onClearInitialRestock?: () => void;
}

export const SparePartsPage: React.FC<SparePartsPageProps> = ({
  initialRestockPart,
  onClearInitialRestock,
}) => {
  const { hasRole } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Restock Modal State
  const [selectedPartForRestock, setSelectedPartForRestock] = useState<SparePart | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [restockSubmitting, setRestockSubmitting] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  // Add Part Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<SparePartRequest>({
    partNumber: '',
    name: '',
    stockQuantity: 10,
    reorderLevel: 5,
    unitCost: 1000.0,
    locationBin: '',
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    if (initialRestockPart) {
      setSelectedPartForRestock(initialRestockPart);
      if (onClearInitialRestock) onClearInitialRestock();
    }
  }, [initialRestockPart, onClearInitialRestock]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const endpoint = showOnlyLowStock ? '/api/v1/parts/low-stock' : '/api/v1/parts';
      const data = await api.get<SparePart[]>(endpoint);
      setParts(data);
    } catch (err) {
      console.error('Failed to load spare parts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [showOnlyLowStock]);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForRestock) return;
    setRestockError(null);
    setRestockSubmitting(true);
    try {
      await api.patch<SparePart>(`/api/v1/parts/${selectedPartForRestock.id}/restock`, {
        quantity: restockAmount,
      });
      setSelectedPartForRestock(null);
      setRestockAmount(10);
      fetchParts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setRestockError(e.message || 'Restock failed.');
    } finally {
      setRestockSubmitting(false);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSubmitting(true);
    try {
      await api.post<SparePart>('/api/v1/parts', formData);
      setShowAddModal(false);
      setFormData({
        partNumber: '',
        name: '',
        stockQuantity: 10,
        reorderLevel: 5,
        unitCost: 1000.0,
        locationBin: '',
      });
      fetchParts();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setAddError(e.message || 'Failed to add spare part.');
    } finally {
      setAddSubmitting(false);
    }
  };

  const filteredParts = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.locationBin.toLowerCase().includes(search.toLowerCase())
  );

  const canAddPart = hasRole('ADMIN');
  const canRestock = hasRole(['ADMIN', 'ENGINEER']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Spare Parts Inventory & Restock</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Maintain inventory levels, location bins, reorder thresholds, and unit costs.
          </p>
        </div>

        {canAddPart && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spare Part</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search part number, description, bin location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyLowStock}
              onChange={(e) => setShowOnlyLowStock(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400 w-4 h-4"
            />
            <span>Show Only Low-Stock Spares</span>
          </label>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading parts inventory...</div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No spare parts match the current search or threshold filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-400 bg-slate-800/60 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Part #</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Location Bin</th>
                  <th className="px-5 py-3.5 text-right">Unit Cost</th>
                  <th className="px-5 py-3.5">Stock Level vs Reorder</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredParts.map((part) => {
                  const isLow = part.stockQuantity <= part.reorderLevel;
                  const ratio = Math.min(
                    100,
                    Math.round((part.stockQuantity / (part.reorderLevel * 2 || 1)) * 100)
                  );

                  return (
                    <tr key={part.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-sky-400">
                        {part.partNumber}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-200">
                        {part.name}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{part.locationBin}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-slate-300">
                        ₹{part.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 w-48">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={isLow ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {part.stockQuantity} units
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Min: {part.reorderLevel}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLow ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canRestock && (
                          <button
                            onClick={() => setSelectedPartForRestock(part)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Quick Restock */}
      {selectedPartForRestock && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPartForRestock(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-sky-400" />
              <span>Restock Spare Part</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Receive shipments and replenish bin inventory for this SKU.
            </p>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Part Number:</span>
                <span className="font-mono font-bold text-sky-400">
                  {selectedPartForRestock.partNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Description:</span>
                <span className="text-slate-200">{selectedPartForRestock.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stock:</span>
                <span className="font-semibold text-slate-200">
                  {selectedPartForRestock.stockQuantity} units (Min: {selectedPartForRestock.reorderLevel})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-mono text-slate-300">
                  {selectedPartForRestock.locationBin}
                </span>
              </div>
            </div>

            {restockError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{restockError}</span>
              </div>
            )}

            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPartForRestock(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restockSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {restockSubmitting ? 'Updating...' : `Add +${restockAmount} to Stock`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Spare Part */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add Spare Part to Catalog</h3>
            <p className="text-xs text-slate-400 mb-4">
              Register a new part number, storage bin, unit cost, and restock threshold.
            </p>

            {addError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddPart} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Part Number (SKU)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, partNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. BRG-7208-AC"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Location Bin
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.locationBin}
                    onChange={(e) =>
                      setFormData({ ...formData, locationBin: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. RACK-B2"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Part Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Angular Contact Spindle Bearing"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.unitCost}
                    onChange={(e) =>
                      setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })
                    }
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
                  disabled={addSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {addSubmitting ? 'Saving...' : 'Register Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
