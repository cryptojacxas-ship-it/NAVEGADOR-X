import { useRef, useState } from 'react';

export function useMiner() {
  const workerRef = useRef<Worker | null>(null);
  const [stats, setStats] = useState({ hashRate: 0, cpu: 0 });

  const start = (cpuCap: number) => {
    // In a production app, this would be a real worker file.
    // For this prototype, we'll use a Blob to simulate the worker
    // since public/miner.worker.js might not be easily accessible in all environments.
    const workerCode = `
      self.onmessage = (e) => {
        const { cmd, cpuCap } = e.data;
        if (cmd === 'start') {
          setInterval(() => {
            self.postMessage({
              hashRate: (Math.random() * 50 + 400) * (cpuCap / 30),
              cpu: cpuCap + (Math.random() * 5)
            });
          }, 2000);
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));
    workerRef.current.postMessage({ cmd: 'start', cpuCap });
    workerRef.current.onmessage = (e) => setStats(e.data);
  };

  const stop = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStats({ hashRate: 0, cpu: 0 });
  };

  return { start, stop, stats };
}
