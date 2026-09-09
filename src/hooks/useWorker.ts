import { useEffect, useRef, useCallback } from "react";
import { useDashboardStore } from "../store/dashboardStore";
import type { WorkerOutMessage } from "../types";

/**
 * useWorker — manages the Web Worker lifecycle.
 * Spawns the worker, loads the CSV, wires up message handling,
 * and triggers an initial filter pass once data is ready.
 */
export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const {
    setWorker,
    setWorkerReady,
    applyWorkerResult,
    setCsvLoading,
    setLoading,
  } = useDashboardStore.getState();

  const handleMessage = useCallback(
    (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;

      if (msg.type === "READY") {
        setWorkerReady(true, msg.totalRows);
        // Trigger initial full-dataset filter
        workerRef.current?.postMessage({
          type: "FILTER",
          filters: useDashboardStore.getState().filters,
        });
        setCsvLoading(false);
      } else if (msg.type === "RESULT") {
        applyWorkerResult(msg.result);
      } else if (msg.type === "ERROR") {
        console.error("[Worker Error]", msg.message);
        setLoading(false);
        setCsvLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    // Spawn worker
    const worker = new Worker(
      new URL("../workers/filterWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    setWorker(worker);

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", (e) => {
      console.error("[Worker uncaught error]", e.message);
    });

    // Fetch CSV and send to worker
    const loadData = async () => {
      try {
        const response = await fetch("/sales_data.csv");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        worker.postMessage({ type: "INIT", csvText });
      } catch (err) {
        console.error("[CSV Load Error]", err);
        setCsvLoading(false);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.terminate();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return workerRef;
}
