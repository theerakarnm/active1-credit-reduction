import { useEffect, useRef } from 'react';
import { Database } from 'lucide-react';
import { Log } from '../types/booking';

interface TransactionLogsProps {
  logs: Log[];
  clearLogs: () => void;
}

export const TransactionLogs = ({ logs, clearLogs }: TransactionLogsProps) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="lg:col-span-7 flex flex-col h-[600px] bg-black rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono">
      <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Database size={16} /> Backend Transaction Logs
        </h3>
        <button onClick={clearLogs} className="text-xs text-slate-500 hover:text-white">Clear Logs</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
            <Database size={48} className="mb-4" />
            <p>Waiting for transactions...</p>
          </div>
        )}

        {logs.map((log) => {
          // Log Styling Logic
          let colorClass = 'text-slate-300';
          let borderClass = 'border-l-2 border-slate-700';

          if (log.step === 'LOCK') { colorClass = 'text-yellow-400'; borderClass = 'border-l-2 border-yellow-500'; }
          if (log.step === 'CHECK') { colorClass = 'text-blue-300'; borderClass = 'border-l-2 border-blue-500'; }
          if (log.step === 'EXECUTE') { colorClass = 'text-purple-300'; borderClass = 'border-l-2 border-purple-500'; }
          if (log.step === 'COMMIT') { colorClass = 'text-emerald-400'; borderClass = 'border-l-2 border-emerald-500 bg-emerald-900/10'; }
          if (log.step === 'ROLLBACK' || log.step === 'ERROR') { colorClass = 'text-red-400'; borderClass = 'border-l-2 border-red-500 bg-red-900/10'; }

          return (
            <div key={log.id} className={`pl-3 py-1 ${borderClass} text-sm transition-all animate-in fade-in slide-in-from-left-2`}>
              <div className="flex gap-3">
                <span className="text-slate-500 text-xs w-16 shrink-0">{log.timestamp}</span>
                <span className="text-slate-500 text-xs w-16 shrink-0 font-bold">[{log.txId}]</span>
                <span className={`font-bold w-20 shrink-0 ${colorClass}`}>{log.step}</span>
                <span className={`${colorClass} flex-1 wrap-break-word`}>{log.message}</span>
              </div>
            </div>
          );
        })}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
