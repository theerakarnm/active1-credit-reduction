import { useState, useEffect, useRef } from 'react';
import { Mutex } from '../lib/Mutex';
import { Log, Slot } from '../types/booking';

// Global Mutex instances (to persist across re-renders)
const userMutex = new Mutex();
const slotMutex = new Map<number, Mutex>();

export const useBookingSystem = () => {
  // Database State (Simulated with Ref to bypass closure staleness)
  const dbUserCredit = useRef(1000);
  const dbSlots = useRef<Slot[]>([
    { id: 1, time: '10:00 - 11:00', price: 500, status: 'available' },
    { id: 2, time: '13:00 - 14:00', price: 500, status: 'available' },
    { id: 3, time: '15:00 - 16:00', price: 500, status: 'available' },
  ]);

  // UI State (Sync with DB)
  const [userCredit, setUserCredit] = useState(dbUserCredit.current);
  const [slots, setSlots] = useState<Slot[]>(dbSlots.current);

  // UI State
  const [logs, setLogs] = useState<Log[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkDelay, setNetworkDelay] = useState(1500); // ms

  // Initial Lock setup for slots
  useEffect(() => {
    slots.forEach(slot => {
      if (!slotMutex.has(slot.id)) {
        slotMutex.set(slot.id, new Mutex());
      }
    });
  }, []);

  const addLog = (txId: string, step: Log['step'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('th-TH', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 1
    } as any);
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), step, message, timestamp, txId }]);
  };

  const clearLogs = () => setLogs([]);

  const resetSystem = () => {
    // Reset DB
    dbUserCredit.current = 1000;
    dbSlots.current = dbSlots.current.map(s => ({ ...s, status: 'available', bookedBy: undefined }));

    // Sync UI
    setUserCredit(dbUserCredit.current);
    setSlots([...dbSlots.current]);
    setLogs([]);
    setIsProcessing(false);
  };

  // --- CORE LOGIC: THE SAFE BOOKING FLOW ---
  const handleBooking = async (slotId: number, isSimulatedConcurrency = false) => {
    const txId = Math.random().toString(36).substring(7).toUpperCase();

    // UI Feedback
    if (!isSimulatedConcurrency) setIsProcessing(true);

    addLog(txId, 'INIT', `🚀 เริ่มต้น Transaction ขอจอง Slot ID: ${slotId}`);

    try {
      // STEP 1: LOCK (Atomic Operation Simulation)
      addLog(txId, 'LOCK', `🔒 กำลังขอ Lock Resource (User & Slot ${slotId})...`);

      // Lock User
      await userMutex.lock();
      // Lock Slot
      const sMutex = slotMutex.get(slotId);
      if (sMutex) await sMutex.lock();

      addLog(txId, 'LOCK', `🔑 Lock สำเร็จ! Transaction อื่นต้องรอ`);

      // Simulate Network Latency
      await new Promise(r => setTimeout(r, networkDelay));

      // STEP 2: CHECK (Availability & Balance)
      addLog(txId, 'CHECK', `👀 ตรวจสอบสถานะล่าสุด...`);

      // Read from DB (Ref) to get latest state
      const currentSlots = dbSlots.current;
      const currentCredit = dbUserCredit.current;
      const currentSlot = currentSlots.find(s => s.id === slotId);

      // Validation 1: Slot Availability
      if (!currentSlot || currentSlot.status !== 'available') {
        throw new Error('❌ Slot ไม่ว่าง หรือถูกจองไปแล้ว (Race Condition Prevented)');
      }

      // Validation 2: Balance Check
      if (currentCredit < currentSlot.price) {
        throw new Error(`❌ เครดิตไม่พอ (ต้องการ ${currentSlot.price}, มี ${currentCredit})`);
      }

      addLog(txId, 'CHECK', `✅ ผ่านการตรวจสอบ (Slot ว่าง, เงินพอ)`);

      // STEP 3: EXECUTE (Deduct & Reserve)
      addLog(txId, 'EXECUTE', `💸 กำลังตัดเครดิต ${currentSlot.price} และเปลี่ยนสถานะ...`);

      // Update DB (Ref)
      dbUserCredit.current = currentCredit - currentSlot.price;
      dbSlots.current = currentSlots.map(s => s.id === slotId ? { ...s, status: 'booked', bookedBy: 'User (You)' } : s);

      // Sync UI
      setUserCredit(dbUserCredit.current);
      setSlots([...dbSlots.current]);

      // STEP 4: COMMIT
      addLog(txId, 'COMMIT', `💾 COMMIT COMPLETED: จองสำเร็จ!`);

    } catch (error: any) {
      // STEP 5: ROLLBACK
      addLog(txId, 'ROLLBACK', `⚠️ ROLLBACK: ${error.message}`);
    } finally {
      // ALWAYS RELEASE LOCK
      addLog(txId, 'COMMIT', `🔓 ปลด Lock Resource`);

      const sMutex = slotMutex.get(slotId);
      if (sMutex) sMutex.unlock();
      userMutex.unlock();

      if (!isSimulatedConcurrency) setIsProcessing(false);
    }
  };

  const simulateRaceCondition = (slotId: number) => {
    addLog('SYSTEM', 'INIT', `🔥 SIMULATION: ยิง Request จอง Slot ${slotId} พร้อมกัน 3 threads`);
    handleBooking(slotId, true);
    handleBooking(slotId, true);
    handleBooking(slotId, true);
  };

  return {
    userCredit,
    slots,
    logs,
    isProcessing,
    networkDelay,
    setNetworkDelay,
    handleBooking,
    simulateRaceCondition,
    clearLogs,
    resetSystem,
  };
};
