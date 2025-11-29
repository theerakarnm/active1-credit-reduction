// Mutex Class: จำลองการทำงานของ Row Locking ใน Database
// เพื่อให้แน่ใจว่ามีเพียง 1 Transaction เท่านั้นที่เข้าถึงข้อมูล User/Slot ได้ในเวลาเดียวกัน
export class Mutex {
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
