import { useState, useCallback, useEffect } from "preact/hooks";

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      if ("wakeLock" in navigator) {
        const lock = await navigator.wakeLock.request("screen");
        setWakeLock(lock);
        console.log("Wake Lock is active!");
      } else if ("mozWakeLock" in navigator) {
        // Firefox-specific wake lock
        const lock = (navigator as any).mozWakeLock.request("screen");
        setWakeLock(lock);
        console.log("Firefox Wake Lock is active!");
      } else {
        console.log("Wake Lock API not supported in this browser.");
      }
    } catch (err) {
      console.log(`Wake Lock error: ${err.name}, ${err.message}`);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLock) {
      if ("release" in wakeLock) {
        wakeLock.release();
      } else if ("unlock" in wakeLock) {
        // Firefox-specific release
        wakeLock.unlock();
      }
      setWakeLock(null);
      console.log("Wake Lock released.");
    }
  }, [wakeLock]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
}
