import { useState, useEffect, useRef } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle, Database, Server, RefreshCw, Zap } from 'lucide-react';

// --- MOCK BACKEND SIMULATION ---

// Mutex Class: จำลองการทำงานของ Row Locking ใน Database
// เพื่อให้แน่ใจว่ามีเพียง 1 Transaction เท่านั้นที่เข้าถึงข้อมูล User/Slot ได้ในเวลาเดียวกัน
class Mutex {
  private queue: Array<(value: unknown) => void> = [];
  private locked = false;

  async lock() {
    if (this.locked) {
      // ถ้าติด Lock อยู่ ให้รอใน Queue
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.locked = true;
  }

  unlock() {
    if (this.queue.length > 0) {
      // ปล่อยคิวถัดไปเข้ามา
      const next = this.queue.shift();
      if (next) next(true);
    } else {
      this.locked = false;
    }
  }
}

// สร้าง Mutex แยกสำหรับ User (Wallet) และ Slots (Inventory)
const userMutex = new Mutex();
const slotMutex = new Map<number, Mutex>(); // Lock เฉพาะ Slot ID นั้นๆ

// --- TYPES ---
interface Log {
  id: number;
  step: 'INIT' | 'LOCK' | 'CHECK' | 'EXECUTE' | 'COMMIT' | 'ROLLBACK' | 'ERROR';
  message: string;
  timestamp: string;
  txId: string; // Transaction ID
}

interface Slot {
  id: number;
  time: string;
  price: number;
  status: 'available' | 'booked';
  bookedBy?: string;
}

// --- MAIN COMPONENT ---
export default function BookingSystemMVP() {
  // Database State (จำลอง Data ใน DB)
  const [userCredit, setUserCredit] = useState(1000);
  const [slots, setSlots] = useState<Slot[]>([
    { id: 1, time: '10:00 - 11:00', price: 500, status: 'available' },
    { id: 2, time: '13:00 - 14:00', price: 500, status: 'available' },
    { id: 3, time: '15:00 - 16:00', price: 500, status: 'available' },
  ]);

  // UI State
  const [logs, setLogs] = useState<Log[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkDelay, setNetworkDelay] = useState(1500); // ms

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initial Lock setup for slots
  useEffect(() => {
    slots.forEach(slot => {
      if (!slotMutex.has(slot.id)) {
        slotMutex.set(slot.id, new Mutex());
      }
    });
  }, []);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (txId: string, step: Log['step'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 1 } as any);
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), step, message, timestamp, txId }]);
  };

  const clearLogs = () => setLogs([]);

  const resetSystem = () => {
    setUserCredit(1000);
    setSlots(prev => prev.map(s => ({ ...s, status: 'available', bookedBy: undefined })));
    setLogs([]);
    setIsProcessing(false);
  };

  // --- CORE LOGIC: THE SAFE BOOKING FLOW ---
  const handleBooking = async (slotId: number, isSimulatedConcurrency = false) => {
    const txId = Math.random().toString(36).substring(7).toUpperCase();

    // UI Feedback (เฉพาะการกดครั้งแรก ถ้าเป็น Simulation รัวๆ จะไม่ block UI ทั้งหมดเพื่อให้เห็นภาพ)
    if (!isSimulatedConcurrency) setIsProcessing(true);

    addLog(txId, 'INIT', `🚀 เริ่มต้น Transaction ขอจอง Slot ID: ${slotId}`);

    try {
      // STEP 1: LOCK (Atomic Operation Simulation)
      // จำลองการ Lock Row ของ User และ Slot เพื่อกัน Race Condition
      addLog(txId, 'LOCK', `🔒 กำลังขอ Lock Resource (User & Slot ${slotId})...`);

      // Lock User (กันเงินหาย/ตัดซ้อน)
      await userMutex.lock();
      // Lock Slot (กันจองซ้อน)
      const sMutex = slotMutex.get(slotId);
      if (sMutex) await sMutex.lock();

      addLog(txId, 'LOCK', `🔑 Lock สำเร็จ! Transaction อื่นต้องรอ`);

      // จำลอง Network Latency (เพื่อให้เห็นภาพชัดขึ้นเวลากดแย่งกัน)
      await new Promise(r => setTimeout(r, networkDelay));

      // STEP 2: CHECK (Availability & Balance)
      // อ่านข้อมูลล่าสุดหลังจากได้ Lock แล้ว (Clean Read)
      addLog(txId, 'CHECK', `👀 ตรวจสอบสถานะล่าสุด...`);

      const currentSlot = slots.find(s => s.id === slotId);

      // Validation 1: Slot ว่างไหม?
      if (!currentSlot || currentSlot.status !== 'available') {
        throw new Error('❌ Slot ไม่ว่าง หรือถูกจองไปแล้ว (Race Condition Prevented)');
      }

      // Validation 2: เงินพอไหม?
      if (userCredit < currentSlot.price) {
        throw new Error(`❌ เครดิตไม่พอ (ต้องการ ${currentSlot.price}, มี ${userCredit})`);
      }

      addLog(txId, 'CHECK', `✅ ผ่านการตรวจสอบ (Slot ว่าง, เงินพอ)`);

      // STEP 3: EXECUTE (Deduct & Reserve)
      addLog(txId, 'EXECUTE', `💸 กำลังตัดเครดิต ${currentSlot.price} และเปลี่ยนสถานะ...`);

      // Update State (จำลองการเขียนลง DB)
      setUserCredit(prev => prev - currentSlot.price);
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'booked', bookedBy: 'User (You)' } : s));

      // STEP 4: COMMIT
      // ถ้ามาถึงตรงนี้แปลว่าทุกอย่างผ่าน บันทึกถาวร
      addLog(txId, 'COMMIT', `💾 COMMIT COMPLETED: จองสำเร็จ!`);

    } catch (error: any) {
      // STEP 5: ROLLBACK
      // คืนค่าทุกอย่าง (ใน State React เราไม่ได้แก้ค่าจนกว่าจะมั่นใจ แต่ใน DB จริงคือการสั่ง ROLLBACK transaction)
      addLog(txId, 'ROLLBACK', `⚠️ ROLLBACK: ${error.message}`);
    } finally {
      // ALWAYS RELEASE LOCK
      // ไม่ว่าจะสำเร็จหรือล้มเหลว ต้องปลด Lock เสมอเพื่อให้ Transaction อื่นทำงานต่อได้
      addLog(txId, 'COMMIT', `🔓 ปลด Lock Resource`);

      const sMutex = slotMutex.get(slotId);
      if (sMutex) sMutex.unlock();
      userMutex.unlock();

      if (!isSimulatedConcurrency) setIsProcessing(false);
    }
  };

  // ฟังก์ชันจำลองการกดรัวๆ (Race Condition Attack)
  const simulateRaceCondition = (slotId: number) => {
    addLog('SYSTEM', 'INIT', `🔥 SIMULATION: ยิง Request จอง Slot ${slotId} พร้อมกัน 3 threads`);
    // ยิง 3 Requests พร้อมกันโดยไม่รอให้จบก่อน
    handleBooking(slotId, true);
    handleBooking(slotId, true);
    handleBooking(slotId, true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* HEADER & CONTROLS */}
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

        {/* LEFT COLUMN: BOOKING UI */}
        <div className="lg:col-span-5 space-y-6">

          {/* Settings Panel */}
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

          {/* Slots Grid */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Clock size={16} /> Available Slots
            </h3>

            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
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
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-200 flex gap-2">
              <Zap size={16} className="shrink-0" />
              <p>ลองกดปุ่มสายฟ้า (⚡) เพื่อจำลองการยิง Request พร้อมกัน 3 ครั้ง ระบบ Lock จะทำให้ผ่านแค่ 1 Request เท่านั้น</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TRANSACTION LOGS */}
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
                    <span className={`${colorClass} flex-1 break-words`}>{log.message}</span>
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>

      {/* FOOTER EXPLANATION */}
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
    </div>
  );
}