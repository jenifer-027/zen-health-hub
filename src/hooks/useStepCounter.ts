import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useStepCounter = (userId: string | undefined) => {
  const [steps, setSteps] = useState(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const stepThreshold = 1.2;

  useEffect(() => {
    if (!userId) return;
    const enabled = localStorage.getItem("fitzen-step-tracking") === "true";
    if (!enabled) return;

    // Load today's steps
    const today = new Date().toISOString().split("T")[0];
    supabase.from("daily_logs").select("steps").eq("user_id", userId).eq("date", today).maybeSingle()
      .then(({ data }) => { if (data?.steps) setSteps(data.steps); });

    let stepCount = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;

      const delta = Math.abs(
        Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2) -
        Math.sqrt(lastAccel.current.x ** 2 + lastAccel.current.y ** 2 + lastAccel.current.z ** 2)
      );

      lastAccel.current = { x: a.x, y: a.y, z: a.z };

      if (delta > stepThreshold) {
        stepCount++;
        setSteps((prev) => prev + 1);
      }
    };

    // Request permission on iOS
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      (DeviceMotionEvent as any).requestPermission().then((res: string) => {
        if (res === "granted") window.addEventListener("devicemotion", handleMotion);
      });
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    // Persist steps every 30 seconds
    const saveInterval = setInterval(async () => {
      if (stepCount > 0 && userId) {
        await supabase.from("daily_logs").update({ steps: stepCount } as any).eq("user_id", userId).eq("date", today);
      }
    }, 30000);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearInterval(saveInterval);
    };
  }, [userId]);

  return steps;
};
