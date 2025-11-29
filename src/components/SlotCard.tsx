import { CheckCircle, Zap } from 'lucide-react';
import { Slot } from '../types/booking';

interface SlotCardProps {
  slot: Slot;
  isProcessing: boolean;
  handleBooking: (id: number) => void;
  simulateRaceCondition: (id: number) => void;
}

export const SlotCard = ({ slot, isProcessing, handleBooking, simulateRaceCondition }: SlotCardProps) => {
  return (
    <div
      className={`relative overflow-hidden p-4 rounded-lg border transition-all duration-300 ${slot.status === 'booked'
        ? 'bg-slate-900 border-slate-800 opacity-75'
        : 'bg-slate-700/50 border-slate-600 hover:border-blue-500 hover:bg-slate-700'
        }`}
    >
      <div className="flex justify-between items-center relative z-10">
        <div>
          <p className="font-bold text-lg text-white">{slot.time}</p>
          <p className="text-sm text-slate-400">Price: {slot.price} THB</p>
        </div>

        <div className="flex gap-2">
          {slot.status === 'booked' ? (
            <span className="flex items-center gap-1 text-red-400 font-bold bg-red-400/10 px-3 py-1 rounded">
              <CheckCircle size={16} /> BOOKED
            </span>
          ) : (
            <>
              {/* Normal Booking Button */}
              <button
                onClick={() => handleBooking(slot.id)}
                disabled={isProcessing}
                className={`px-4 py-2 rounded font-semibold text-sm transition ${isProcessing
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                  }`}
              >
                {isProcessing ? 'Processing...' : 'จองปกติ'}
              </button>

              {/* Chaos Button */}
              <button
                onClick={() => simulateRaceCondition(slot.id)}
                disabled={isProcessing}
                className="p-2 rounded bg-purple-900/50 hover:bg-purple-800 text-purple-300 border border-purple-700/50 transition"
                title="Test Race Condition (Spam Click)"
              >
                <Zap size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
