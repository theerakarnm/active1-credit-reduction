import { Clock, Zap } from 'lucide-react';
import { Slot } from '../types/booking';
import { SlotCard } from './SlotCard';

interface SlotListProps {
  slots: Slot[];
  isProcessing: boolean;
  handleBooking: (id: number) => void;
  simulateRaceCondition: (id: number) => void;
}

export const SlotList = ({ slots, isProcessing, handleBooking, simulateRaceCondition }: SlotListProps) => {
  return (
    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
        <Clock size={16} /> Available Slots
      </h3>

      <div className="space-y-3">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            isProcessing={isProcessing}
            handleBooking={handleBooking}
            simulateRaceCondition={simulateRaceCondition}
          />
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-200 flex gap-2">
        <Zap size={16} className="shrink-0" />
        <p>ลองกดปุ่มสายฟ้า (⚡) เพื่อจำลองการยิง Request พร้อมกัน 3 ครั้ง ระบบ Lock จะทำให้ผ่านแค่ 1 Request เท่านั้น</p>
      </div>
    </div>
  );
};
