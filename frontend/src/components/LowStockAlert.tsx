import React from 'react';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { SparePart } from '../types/asset.types';

interface LowStockAlertProps {
  lowStockParts: SparePart[];
  onNavigateToParts?: () => void;
  onQuickRestock?: (part: SparePart) => void;
}

export const LowStockAlert: React.FC<LowStockAlertProps> = ({
  lowStockParts,
  onNavigateToParts,
  onQuickRestock,
}) => {
  if (!lowStockParts || lowStockParts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-amber-300">
                Low Spare-Part Inventory Alert
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/30 text-amber-200 rounded-full border border-amber-500/40">
                {lowStockParts.length} {lowStockParts.length === 1 ? 'part' : 'parts'} below threshold
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              The following spare parts have reached or fallen below their designated reorder level and require replenishment:
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {lowStockParts.map((part) => (
                <div
                  key={part.id}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs shadow-sm"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-medium text-slate-200">{part.partNumber}</span>
                  <span className="text-slate-400">({part.name})</span>
                  <span className="text-rose-400 font-semibold">
                    {part.stockQuantity} / {part.reorderLevel} min
                  </span>
                  <span className="text-slate-500">[{part.locationBin}]</span>

                  {onQuickRestock && (
                    <button
                      onClick={() => onQuickRestock(part)}
                      className="ml-1 text-sky-400 hover:text-sky-300 font-medium underline"
                    >
                      Restock
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {onNavigateToParts && (
          <button
            onClick={onNavigateToParts}
            className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors shrink-0 ml-4"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
