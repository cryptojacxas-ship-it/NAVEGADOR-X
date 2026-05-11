import { QuickStats } from './QuickStats';
import { ConnectionStatus } from './ConnectionStatus';
import { ThreatProtection } from './ThreatProtection';
import { AIActivityFeed } from './AIActivityFeed';

export function DashboardView() {
  return (
    <div className="grid grid-cols-12 gap-6 p-10 max-w-7xl mx-auto">
      {/* Left Column: 2/3 width */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <QuickStats />
        <div className="h-[460px]">
          <AIActivityFeed />
        </div>
      </div>

      {/* Right Column: 1/3 width */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <ConnectionStatus />
        <ThreatProtection />
      </div>
    </div>
  );
}
