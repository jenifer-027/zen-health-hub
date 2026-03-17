import { useEffect, useRef } from "react";

const sendNotification = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
};

export const useHabitReminders = () => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Request permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      const waterOn = localStorage.getItem("fitzen-water-reminder") !== "false";
      const mealOn = localStorage.getItem("fitzen-meal-reminder") !== "false";
      const sleepOn = localStorage.getItem("fitzen-sleep-reminder") === "true";

      // Water reminder every 2 hours (8am-8pm)
      if (waterOn && hour >= 8 && hour <= 20 && hour % 2 === 0 && minute === 0) {
        sendNotification("💧 Water Reminder", "Time to drink a glass of water!");
      }

      // Meal reminders
      if (mealOn) {
        if (hour === 8 && minute === 0) sendNotification("🍳 Breakfast Time", "Don't skip breakfast — fuel your morning!");
        if (hour === 13 && minute === 0) sendNotification("🍽️ Lunch Time", "Time for a healthy lunch!");
        if (hour === 19 && minute === 0) sendNotification("🥗 Dinner Time", "Keep dinner light and nutritious!");
      }

      // Sleep reminder
      if (sleepOn && hour === 22 && minute === 0) {
        sendNotification("😴 Bedtime", "Wind down — 7-8 hours of sleep keeps you healthy!");
      }
    }, 60000); // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
};
