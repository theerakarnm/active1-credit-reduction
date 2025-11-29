export interface Log {
  id: number;
  step: 'INIT' | 'LOCK' | 'CHECK' | 'EXECUTE' | 'COMMIT' | 'ROLLBACK' | 'ERROR';
  message: string;
  timestamp: string;
  txId: string; // Transaction ID
}

export interface Slot {
  id: number;
  time: string;
  price: number;
  status: 'available' | 'booked';
  bookedBy?: string;
}
