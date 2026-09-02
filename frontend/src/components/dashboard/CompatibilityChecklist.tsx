import React, { useState } from 'react';
import type { CompatibilityCheck } from '../../lib/types';
import { Check, AlertTriangle, X, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface CompatibilityChecklistProps {
  checks: CompatibilityCheck[];
  allPassed: boolean;
}

export const CompatibilityChecklist: React.FC<CompatibilityChecklistProps> = ({ checks, allPassed }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded bg-elevated overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-surface/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-3.5 h-3.5 ${allPassed ? 'text-signal' : 'text-thermal'}`} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">
            Compatibility Gate
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
              allPassed ? 'bg-signal/15 text-signal border border-signal/30' : 'bg-thermal/15 text-thermal border border-thermal/30'
            }`}
          >
            {allPassed ? '5/5 Validated' : 'Warnings Present'}
          </span>
          {isOpen ? <ChevronUp className="w-3 h-3 text-text-muted" /> : <ChevronDown className="w-3 h-3 text-text-muted" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 py-2 border-t border-border divide-y divide-border/60 bg-base/50">
          {checks.map((check) => (
            <div key={check.id} className="py-1.5 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                {check.status === 'pass' && <Check className="w-3 h-3 text-signal shrink-0" />}
                {check.status === 'warn' && <AlertTriangle className="w-3 h-3 text-thermal shrink-0" />}
                {check.status === 'fail' && <X className="w-3 h-3 text-alert shrink-0" />}
                <span className="text-text-secondary">{check.name}</span>
              </div>
              <span
                className={
                  check.status === 'pass'
                    ? 'text-text-primary'
                    : check.status === 'warn'
                    ? 'text-thermal font-medium'
                    : 'text-alert font-medium'
                }
              >
                {check.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
