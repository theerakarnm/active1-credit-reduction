import { Shield, RefreshCw } from 'lucide-react';

interface HeaderProps {
  userCredit: number;
  resetSystem: () => void;
}

export const Header = ({ userCredit, resetSystem }: HeaderProps) => {
  return (
    <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="text-green-400" />
          Booking System MVP
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Credit Deduction Logic with Race Condition Protection (ACID Simulation)
        </p>
      </div>

      <div className="flex items-center gap-4 mt-4 md:mt-0 bg-slate-900 p-3 rounded-lg border border-slate-700">
        <div className="text-right mr-2">
          <p className="text-xs text-slate-400 uppercase font-semibold">My Credits</p>
          <p className={`text-2xl font-mono font-bold ${userCredit < 500 ? 'text-red-400' : 'text-emerald-400'}`}>
            {userCredit.toLocaleString()} THB
          </p>
        </div>
        <div className="h-10 w-px bg-slate-700 mx-2"></div>
        <button
          onClick={resetSystem}
          className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition"
          title="Reset System"
        >
          <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};
