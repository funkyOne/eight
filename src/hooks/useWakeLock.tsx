import { useState, useCallback, useEffect, useRef } from "preact/hooks";

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<any>(null);
  // Track whether wake lock should be active
  const shouldBeActive = useRef(false);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === "undefined") return;

    // Mark that wake lock should be active
    shouldBeActive.current = true;

    try {
      if ("wakeLock" in navigator) {
        const lock = await navigator.wakeLock.request("screen");

        // Listen for wake lock release (e.g., when tab becomes hidden)
        lock.addEventListener("release", () => {
          console.log("Wake Lock was released");
        });

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
    // Mark that wake lock should no longer be active
    shouldBeActive.current = false;

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

  // Handle visibility changes - re-acquire wake lock when page becomes visible
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && shouldBeActive.current) {
        console.log("Page became visible, re-acquiring wake lock...");

        try {
          if ("wakeLock" in navigator) {
            const lock = await navigator.wakeLock.request("screen");

            lock.addEventListener("release", () => {
              console.log("Wake Lock was released");
            });

            setWakeLock(lock);
            console.log("Wake Lock re-acquired!");
          } else if ("mozWakeLock" in navigator) {
            const lock = (navigator as any).mozWakeLock.request("screen");
            setWakeLock(lock);
            console.log("Firefox Wake Lock re-acquired!");
          }
        } catch (err) {
          console.log(`Wake Lock re-acquisition error: ${err.name}, ${err.message}`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
}
