import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Package, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { api } from '../api/apiClient';
import { Asset, MaintenanceTicket, SparePart, DowntimeSummaryDTO } from '../types/asset.types';
import { LowStockAlert } from '../components/LowStockAlert';
import { PriorityBadge } from '../components/PriorityBadge';

interface OverviewPageProps {
  onNavigateToTab: (tab: 'assets' | 'parts' | 'tickets') => void;
  onQuickRestockPart: (part: SparePart) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigateToTab,
  onQuickRestockPart,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [lowStockParts, setLowStockParts] = useState<SparePart[]>([]);
  const [downtimeMetrics, setDowntimeMetrics] = useState<DowntimeSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [assetsData, ticketsData, partsData, lowStockData, analyticsData] = await Promise.all([
        api.get<Asset[]>('/api/v1/assets'),
        api.get<MaintenanceTicket[]>('/api/v1/tickets'),
        api.get<SparePart[]>('/api/v1/parts'),
        api.get<SparePart[]>('/api/v1/parts/low-stock'),
        api.get<DowntimeSummaryDTO[]>('/api/v1/tickets/analytics/downtime'),
      ]);

      setAssets(assetsData);
      setTickets(ticketsData);
      setParts(partsData);
      setLowStockParts(lowStockData);
      setDowntimeMetrics(analyticsData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalAssets = assets.length;
  const operationalAssets = assets.filter((a) => a.status === 'OPERATIONAL').length;
  const underMaintenanceAssets = assets.filter((a) => a.status === 'UNDER_MAINTENANCE').length;
  const openBreakdownTickets = tickets.filter(
    (t) => t.status === 'OPEN' && t.type === 'BREAKDOWN'
  ).length;

  const totalDowntimeHours = downtimeMetrics.reduce((acc, m) => acc + m.totalDowntimeHours, 0);
  const totalPartsCost = downtimeMetrics.reduce((acc, m) => acc + m.totalPartsCost, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Plant Operations & Downtime Analytics</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of industrial equipment, critical spares, and active maintenance tickets.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Low Stock Alert Component */}
      <LowStockAlert
        lowStockParts={lowStockParts}
        onNavigateToParts={() => onNavigateToTab('parts')}
        onQuickRestock={onQuickRestockPart}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Equipment Fleet */}
        <div 
          onClick={() => onNavigateToTab('assets')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Status</span>
            <Cpu className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{totalAssets}</span>
            <span className="text-xs text-slate-400">Total Units</span>
          </div>
          <div className="mt-3 flex items-center space-x-3 text-xs">
            <span className="text-emerald-400 font-medium">● {operationalAssets} Operational</span>
            {underMaintenanceAssets > 0 && (
              <span className="text-rose-400 font-medium">● {underMaintenanceAssets} Under Repair</span>
            )}
          </div>
        </div>

        {/* Card 2: Active Breakdown Tickets */}
        <div 
          onClick={() => onNavigateToTab('tickets')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Breakdowns</span>
            <AlertTriangle className={`w-5 h-5 ${openBreakdownTickets > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{openBreakdownTickets}</span>
            <span className="text-xs text-slate-400">Active Unresolved</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {openBreakdownTickets > 0 ? (
              <span className="text-rose-400 font-medium">Auto-synced to equipment offline</span>
            ) : (
              <span className="text-emerald-400 font-medium">No critical breakdowns</span>
            )}
          </p>
        </div>

        {/* Card 3: Aggregate Downtime */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recorded Downtime</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{totalDowntimeHours.toFixed(1)}</span>
            <span className="text-xs text-slate-400">Hours</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400 mr-1" />
            <span>Across all closed repair tickets</span>
          </div>
        </div>

        {/* Card 4: Spare Parts Inventory Value */}
        <div 
          onClick={() => onNavigateToTab('parts')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Parts & Consumables</span>
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">{parts.length}</span>
            <span className="text-xs text-slate-400">Catalog SKUs</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Repair Cost:</span>
            <span className="text-slate-200 font-mono font-semibold">₹{totalPartsCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* MongoDB Downtime Aggregation Analytics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <span>Downtime & Maintenance Cost by Asset</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Powered by MongoDB Aggregation Pipeline ($match, $project with $reduce/$multiply, $group)
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-sky-400 px-2.5 py-1 rounded-lg border border-slate-700 self-start sm:self-auto">
            /api/v1/tickets/analytics/downtime
          </span>
        </div>

        {downtimeMetrics.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No closed maintenance tickets with recorded downtime yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-400 bg-slate-800/50 border-y border-slate-800">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="px-4 py-3 text-right">Breakdowns</th>
                  <th className="px-4 py-3 text-right">Downtime (Minutes)</th>
                  <th className="px-4 py-3 text-right">Downtime (Hours)</th>
                  <th className="px-4 py-3 text-right">Parts Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {downtimeMetrics.map((item) => (
                  <tr key={item.assetId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-sky-400">
                      {item.assetCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {item.assetName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-400">
                      {item.breakdownCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {item.totalDowntimeMinutes} min
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-amber-400">
                      {item.totalDowntimeHours} hrs
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                      ₹{item.totalPartsCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Maintenance Tickets Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Recent Maintenance Tickets</h3>
          <button
            onClick={() => onNavigateToTab('tickets')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
          >
            View All Tickets &rarr;
          </button>
        </div>

        <div className="space-y-3">
          {tickets.slice(0, 4).map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-800/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-all gap-2"
            >
              <div className="flex items-start space-x-3">
                <PriorityBadge value={ticket.priority} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-sky-400">{ticket.ticketCode}</span>
                    <span className="text-xs text-slate-400 font-medium">on {ticket.assetCode}</span>
                    <PriorityBadge value={ticket.type} size="sm" />
                  </div>
                  <p className="text-sm text-slate-200 mt-1 line-clamp-1">{ticket.issueDescription}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <PriorityBadge value={ticket.status} />
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(ticket.openedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
