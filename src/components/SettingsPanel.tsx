import { Server } from 'lucide-react';

interface SettingsPanelProps {
  networkDelay: number;
  setNetworkDelay: (delay: number) => void;
}

export const SettingsPanel = ({ networkDelay, setNetworkDelay }: SettingsPanelProps) => {
  return (
    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
        <Server size={16} /> Environment Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label className="flex justify-between text-sm mb-2">
            <span>Network Latency (Simulated)</span>
            <span className="text-yellow-400 font-mono">{networkDelay}ms</span>
          </label>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={networkDelay}
            onChange={(e) => setNetworkDelay(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            *ยิ่ง Delay เยอะ ยิ่งเห็นความสำคัญของ Lock ชัดเจน
          </p>
        </div>
      </div>
    </div>
  );
};
