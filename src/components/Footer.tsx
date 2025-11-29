import { Clock, AlertTriangle, Database } from 'lucide-react';

export const Footer = () => {
  return (
    <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2"><Clock size={16} /> 1. Check & Lock</h4>
        <p>ระบบจะสร้าง Mutex Lock ทันทีที่ request เข้ามา เพื่อเปลี่ยน Parallel Request ให้เป็น Serial (เข้าคิว) ป้องกันการอ่านค่า Balance เก่า</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16} /> 2. Validation</h4>
        <p>หลังจากได้ Lock ระบบจะอ่านค่าล่าสุด (Fresh Read) ถ้าเงินไม่พอหรือ Slot ไม่ว่าง จะ Throw Error ทันทีเพื่อ Trigger Rollback</p>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <h4 className="text-white font-bold mb-2 flex items-center gap-2"><Database size={16} /> 3. Commit/Rollback</h4>
        <p>หากทุกอย่างผ่าน จะตัดเงินและบันทึก หากไม่ผ่าน จะคืนค่าเดิมทั้งหมด (Atomic) และปลด Lock ให้คิวถัดไปเสมอ</p>
      </div>
    </div>
  );
};
