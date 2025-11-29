import { useBookingSystem } from './hooks/useBookingSystem';
import { Header } from './components/Header';
import { SettingsPanel } from './components/SettingsPanel';
import { SlotList } from './components/SlotList';
import { TransactionLogs } from './components/TransactionLogs';
import { Footer } from './components/Footer';

export default function BookingSystemMVP() {
  const {
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
  } = useBookingSystem();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* HEADER & CONTROLS */}
        <Header userCredit={userCredit} resetSystem={resetSystem} />

        {/* LEFT COLUMN: BOOKING UI */}
        <div className="lg:col-span-5 space-y-6">
          <SettingsPanel networkDelay={networkDelay} setNetworkDelay={setNetworkDelay} />
          <SlotList
            slots={slots}
            isProcessing={isProcessing}
            handleBooking={handleBooking}
            simulateRaceCondition={simulateRaceCondition}
          />
        </div>

        {/* RIGHT COLUMN: TRANSACTION LOGS */}
        <TransactionLogs logs={logs} clearLogs={clearLogs} />

      </div>

      {/* FOOTER EXPLANATION */}
      <Footer />
    </div>
  );
}