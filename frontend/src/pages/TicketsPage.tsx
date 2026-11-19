import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Trash2, 
  X, 
  Package, 
  Cpu, 
  Info,
  Check
} from 'lucide-react';
import { api } from '../api/apiClient';
import { 
  MaintenanceTicket, 
  Asset, 
  SparePart, 
  TicketCreateRequest, 
  TicketCloseRequest, 
  PartUsageRequest,
  TicketType,
  TicketPriority 
} from '../types/asset.types';
import { PriorityBadge } from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';

interface TicketsPageProps {
  preselectedAsset?: Asset | null;
  onClearPreselectedAsset?: () => void;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({
  preselectedAsset,
  onClearPreselectedAsset,
}) => {
  const { hasRole } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Open Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState<TicketCreateRequest>({
    assetId: '',
    type: 'BREAKDOWN',
    priority: 'HIGH',
    issueDescription: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Close Ticket Modal State
  const [ticketToClose, setTicketToClose] = useState<MaintenanceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState(60);
  const [partsUsed, setPartsUsed] = useState<PartUsageRequest[]>([]);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Toast / Status Message
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = '/api/v1/tickets?';
      if (statusFilter) query += `status=${statusFilter}&`;
      if (typeFilter) query += `type=${typeFilter}&`;

      const [ticketsData, assetsData, partsData] = await Promise.all([
        api.get<MaintenanceTicket[]>(query),
        api.get<Asset[]>('/api/v1/assets'),
        api.get<SparePart[]>('/api/v1/parts'),
      ]);

      setTickets(ticketsData);
      setAssets(assetsData);
      setParts(partsData);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (preselectedAsset) {
      setCreateData((prev) => ({ ...prev, assetId: preselectedAsset.id }));
      setShowCreateModal(true);
      if (onClearPreselectedAsset) onClearPreselectedAsset();
    }
  }, [preselectedAsset, onClearPreselectedAsset]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      await api.post<MaintenanceTicket>('/api/v1/tickets', createData);
      setShowCreateModal(false);
      setCreateData({
        assetId: '',
        type: 'BREAKDOWN',
        priority: 'HIGH',
        issueDescription: '',
      });
      setActionSuccessMessage(
        createData.type === 'BREAKDOWN'
          ? 'Breakdown ticket opened! Linked equipment status synchronized to UNDER_MAINTENANCE.'
          : 'Preventative maintenance ticket scheduled successfully.'
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
      fetchData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCreateError(e.message || 'Failed to open maintenance ticket.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAddPartUsage = () => {
    if (parts.length > 0) {
      setPartsUsed([...partsUsed, { partId: parts[0].id, quantityUsed: 1 }]);
    }
  };

  const handleRemovePartUsage = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const handlePartUsageChange = (index: number, field: 'partId' | 'quantityUsed', value: string | number) => {
    const updated = [...partsUsed];
    if (field === 'partId') {
      updated[index].partId = value as string;
    } else {
      updated[index].quantityUsed = Number(value) || 1;
    }
    setPartsUsed(updated);
  };

  const handleCloseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToClose) return;
    setCloseError(null);
    setCloseSubmitting(true);

    const closePayload: TicketCloseRequest = {
      resolutionNotes,
      downtimeMinutes,
      partsUsed,
    };

    try {
      await api.patch<MaintenanceTicket>(`/api/v1/tickets/${ticketToClose.id}/close`, closePayload);
      setTicketToClose(null);
      setResolutionNotes('');
      setDowntimeMinutes(60);
      setPartsUsed([]);
      setActionSuccessMessage(
        'Ticket closed! Stock deducted, downtime recorded, and equipment restored to OPERATIONAL.'
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
      fetchData();
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number };
      if (e.status === 409) {
        setCloseError(`Atomic Stock Check Failed (HTTP 409 Conflict): ${e.message}`);
      } else {
        setCloseError(e.message || 'Failed to close maintenance ticket.');
      }
    } finally {
      setCloseSubmitting(false);
    }
  };

  const canManageTickets = hasRole(['ADMIN', 'ENGINEER']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Wrench className="w-6 h-6 text-sky-400" />
            <span>Maintenance & Repair Tickets</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track equipment downtime, breakdown events, preventative work, and spare-parts consumption.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Maintenance Ticket</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-300 text-sm shadow-md animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: '', label: 'All Statuses' },
            { id: 'OPEN', label: 'Open' },
            { id: 'CLOSED', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Types</option>
            <option value="BREAKDOWN">Breakdown</option>
            <option value="PREVENTATIVE">Preventative</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm">
          No maintenance tickets found for the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isClosed = ticket.status === 'CLOSED';

            return (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Metadata & Issue */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 bg-sky-950/80 rounded border border-sky-800">
                        {ticket.ticketCode}
                      </span>
                      <PriorityBadge value={ticket.type} size="sm" />
                      <PriorityBadge value={ticket.priority} size="sm" />
                      <PriorityBadge value={ticket.status} size="sm" />

                      <span className="text-xs font-medium text-slate-400 flex items-center space-x-1">
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-200">{ticket.assetCode}</span>
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-100">
                      {ticket.issueDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span>Opened by: <strong className="text-slate-300 font-mono">{ticket.openedBy}</strong></span>
                      <span>Date: <strong className="text-slate-300">{new Date(ticket.openedAt).toLocaleString()}</strong></span>
                      {ticket.closedAt && (
                        <span>Closed: <strong className="text-slate-300">{new Date(ticket.closedAt).toLocaleString()}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Downtime & Action */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 lg:border-l lg:border-slate-800 lg:pl-6">
                    {isClosed ? (
                      <div className="text-left sm:text-right">
                        <div className="flex items-center space-x-1 text-xs text-slate-400 sm:justify-end">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Recorded Downtime:</span>
                        </div>
                        <p className="text-sm font-mono font-bold text-amber-300">
                          {ticket.downtimeMinutes} min ({(ticket.downtimeMinutes / 60).toFixed(1)} hrs)
                        </p>
                      </div>
                    ) : (
                      canManageTickets && (
                        <button
                          onClick={() => {
                            setTicketToClose(ticket);
                            setResolutionNotes('');
                            setPartsUsed([]);
                            setCloseError(null);
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Close Ticket</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Resolution & Parts Used Banner (if Closed) */}
                {isClosed && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl space-y-2">
                    {ticket.resolutionNotes && (
                      <p className="text-xs text-slate-300">
                        <strong className="text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                          Resolution Notes:
                        </strong>
                        {ticket.resolutionNotes}
                      </p>
                    )}

                    {ticket.partsUsed && ticket.partsUsed.length > 0 && (
                      <div>
                        <strong className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                          Parts Deducted from Stock:
                        </strong>
                        <div className="flex flex-wrap gap-2">
                          {ticket.partsUsed.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-300 border border-slate-700"
                            >
                              <Package className="w-3 h-3 text-sky-400" />
                              <span className="font-semibold text-sky-300">{p.partNumber}</span>
                              <span className="text-slate-400">×{p.quantityUsed}</span>
                              <span className="text-emerald-400 text-[11px]">
                                (@ ₹{p.unitCostAtTime})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Open Maintenance Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Open Maintenance Ticket</h3>
            <p className="text-xs text-slate-400 mb-4">
              Schedule preventative servicing or log an equipment breakdown.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Equipment / Machine
                </label>
                <select
                  required
                  value={createData.assetId}
                  onChange={(e) => setCreateData({ ...createData, assetId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Equipment --</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} — {a.name} ({a.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ticket Type
                  </label>
                  <select
                    value={createData.type}
                    onChange={(e) =>
                      setCreateData({ ...createData, type: e.target.value as TicketType })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="BREAKDOWN">Breakdown</option>
                    <option value="PREVENTATIVE">Preventative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={createData.priority}
                    onChange={(e) =>
                      setCreateData({ ...createData, priority: e.target.value as TicketPriority })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Informative Rule Badge */}
              {createData.type === 'BREAKDOWN' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
                  <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Automatic State Synchronization:</strong> Opening a BREAKDOWN ticket will automatically transition the machine status from OPERATIONAL to <strong>UNDER_MAINTENANCE</strong>.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Issue Description & Symptoms
                </label>
                <textarea
                  required
                  rows={3}
                  value={createData.issueDescription}
                  onChange={(e) => setCreateData({ ...createData, issueDescription: e.target.value })}
                  placeholder="Detail the failure mode, error codes, vibration, or preventative checklist..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {createSubmitting ? 'Opening Ticket...' : 'Open Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Ticket & Deduct Parts */}
      {ticketToClose && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setTicketToClose(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Close Maintenance Ticket</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Record repair notes, downtime duration, and consumed spare parts for atomic stock deduction.
            </p>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 mb-4 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ticket Code:</span>
                <span className="font-mono font-bold text-sky-400">{ticketToClose.ticketCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Equipment:</span>
                <span className="text-slate-200">{ticketToClose.assetCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Original Issue:</span>
                <span className="text-slate-300 italic">{ticketToClose.issueDescription}</span>
              </div>
            </div>

            {closeError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{closeError}</span>
              </div>
            )}

            <form onSubmit={handleCloseTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resolution & Work Performed
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced front bearing assembly, balanced spindle, performed test cycle..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Equipment Downtime (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={downtimeMinutes}
                  onChange={(e) => setDowntimeMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Equivalent to {(downtimeMinutes / 60).toFixed(1)} hours of machine downtime.
                </span>
              </div>

              {/* Spare Parts Consumed Section */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Spare Parts Consumed (Atomic Inventory Deduction)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPartUsage}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Part</span>
                  </button>
                </div>

                {partsUsed.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No spare parts added. (Click "+ Add Part" if inventory was consumed)
                  </p>
                ) : (
                  <div className="space-y-2">
                    {partsUsed.map((usage, idx) => {
                      const selectedPart = parts.find((p) => p.id === usage.partId);
                      const isStockDeficit =
                        selectedPart && selectedPart.stockQuantity < usage.quantityUsed;

                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700"
                        >
                          <div className="flex-1">
                            <select
                              value={usage.partId}
                              onChange={(e) => handlePartUsageChange(idx, 'partId', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                            >
                              {parts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.partNumber} — {p.name} (Stock: {p.stockQuantity})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              min="1"
                              value={usage.quantityUsed}
                              onChange={(e) =>
                                handlePartUsageChange(idx, 'quantityUsed', e.target.value)
                              }
                              className={`w-full px-2 py-1.5 bg-slate-900 border rounded-lg text-white text-xs text-center focus:outline-none ${
                                isStockDeficit
                                  ? 'border-rose-500 text-rose-300'
                                  : 'border-slate-700'
                              }`}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePartUsage(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTicketToClose(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closeSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {closeSubmitting ? 'Validating & Closing...' : 'Confirm Ticket Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
