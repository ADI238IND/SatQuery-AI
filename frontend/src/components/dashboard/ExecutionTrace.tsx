import React, { useState } from 'react';
import type { TraceStep } from '../../lib/types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

interface ExecutionTraceProps {
  trace: TraceStep[];
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({ trace }) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    'step-2': true,
    'step-3': true,
  });

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusIcon = (status: TraceStep['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-signal shrink-0" />;
      case 'running':
        return <Clock className="w-3.5 h-3.5 text-thermal animate-spin shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-thermal shrink-0" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-alert shrink-0" />;
    }
  };

  return (
    <div className="border border-border-strong rounded bg-surface/80 overflow-hidden my-2">
      <div className="px-3 py-1.5 bg-elevated border-b border-border flex items-center justify-between text-[11px] font-mono">
        <span className="text-text-muted flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-signal" />
          EXECUTION PIPELINE TRACE
        </span>
        <span className="text-signal">{trace.filter((s) => s.status === 'done').length}/{trace.length} COMPLETE</span>
      </div>

      <div className="divide-y divide-border/60">
        {trace.map((step) => {
          const isExpanded = expandedSteps[step.id];
          return (
            <div key={step.id} className="text-xs">
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-elevated/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {getStatusIcon(step.status)}
                  <span className="font-mono text-text-muted text-[11px] shrink-0">0{step.stepNumber}</span>
                  <span className="font-medium text-text-primary truncate">{step.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-text-secondary truncate max-w-[140px]">
                    {step.summary}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-text-muted" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && step.details && (
                <div className="px-3 py-2 bg-base/80 border-t border-border/40 font-mono text-[11px] text-text-secondary">
                  <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] text-text-muted bg-elevated/40 p-2 rounded border border-border">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
