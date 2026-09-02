import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, ShieldCheck } from "lucide-react";

function getMissionTargetTime(mission: any): number | null {
  if (mission) {
    const arr = Array.isArray(mission.legs) ? mission.legs : [];
    let dateVal =
      mission.raw_payload?.executionDate || mission.raw_payload?.date;
    let timeVal = mission.raw_payload?.time;
    if (arr.length > 0) {
      if (arr[0]?.date) {
        dateVal = arr[0].date;
        timeVal = arr[0].time || timeVal;
      }
    }
    if (dateVal) {
      let combined = dateVal;
      if (timeVal) {
        // ensure time format allows Date.parse to use local time properly
        combined = `${dateVal}T${timeVal.length === 5 ? timeVal + ":00" : timeVal}`;
      }
      const t = Date.parse(combined);
      if (!isNaN(t)) return t;
    }
  }
  return null;
}

export function MissionClockWidget({ mission }: { mission: any }) {
  const [timeLeft, setTimeLeft] = useState<{
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [targetTime, setTargetTime] = useState<number | null>(null);

  useEffect(() => {
    if (!mission) return;

    let isMounted = true;
    let clockInterval: NodeJS.Timeout;

    // API Contract for Mission Clocks DO
    const syncWithClockDO = async () => {
      try {
        // Fetch authoritative time from Edge DO
        const res = await fetch(
          `/api/clock/${mission.id}`,
        );
        if (res.ok) {
          const data = (await res.json()) as { target_time?: number };
          if (data?.target_time && isMounted) {
            setTargetTime(data.target_time);
            return;
          }
        }
      } catch (err) {
        console.warn(
          "Charter Clocks DO sync unavailable, falling back to local heuristic calculation.",
        );
      }

      // Fallback to local robust heuristic
      if (isMounted) {
        setTargetTime(getMissionTargetTime(mission));
      }
    };

    syncWithClockDO();

    return () => {
      isMounted = false;
    };
  }, [mission]);

  useEffect(() => {
    if (!targetTime) return;

    const updateClock = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });
        return;
      }

      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(
        (diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24),
      );
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({
        weeks,
        days,
        hours: hrs,
        minutes: mins,
        seconds: secs,
        expired: false,
      });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (!mission || !targetTime || timeLeft.expired) return null;

  const isUrgent = timeLeft.hours < 48 && !timeLeft.expired;
  const isCritical = timeLeft.hours < 72 && timeLeft.hours >= 48;

  return (
    <div className="bg-white/95 border border-purple-200/90 shadow-xl rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-sync tracking-widest text-gray-900 uppercase font-bold">
            Time to Flight
          </span>
        </div>
        {mission.status === "CANCELLED" ? (
          <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-0.5 flex items-center h-6 border border-red-200 rounded-md font-bold uppercase">
            Cancelled
          </span>
        ) : (
          <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-0.5 flex items-center h-6 border border-purple-200 rounded-md font-bold uppercase">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {timeLeft.expired ? (
          <span className="text-3xl font-sync tracking-tighter text-red-600 font-bold uppercase">
            EXPIRED
          </span>
        ) : (
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-4xl font-lexend tracking-tighter text-gray-950 font-bold">
                {timeLeft.weeks.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-purple-700 uppercase tracking-widest font-sync font-bold">
                w
              </span>
            </div>
            <div className="text-purple-400 font-lexend text-2xl md:text-4xl font-bold">
              :
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-4xl font-lexend tracking-tighter text-gray-950 font-bold">
                {timeLeft.days.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-purple-700 uppercase tracking-widest font-sync font-bold">
                d
              </span>
            </div>
            <div className="text-purple-400 font-lexend text-2xl md:text-4xl font-bold">
              :
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-4xl font-lexend tracking-tighter text-gray-950 font-bold">
                {timeLeft.hours.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-purple-700 uppercase tracking-widest font-sync font-bold">
                h
              </span>
            </div>
            <div className="text-purple-400 font-lexend text-2xl md:text-4xl font-bold">
              :
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-4xl font-lexend tracking-tighter text-gray-950 font-bold">
                {timeLeft.minutes.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-purple-700 uppercase tracking-widest font-sync font-bold">
                m
              </span>
            </div>
            <div className="text-purple-400 font-lexend text-2xl md:text-4xl font-bold">
              :
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl md:text-4xl font-lexend tracking-tighter text-gray-950 font-bold">
                {timeLeft.seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-purple-700 uppercase tracking-widest font-sync font-bold">
                s
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-purple-100 space-y-4">
        {isUrgent && mission.payment_status !== "SETTLED" && (
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-800">
                Payment Required Soon
              </p>
              <p className="text-[10px] text-red-700 mt-0.5">
                Your flight is at risk of cancellation if payment is not
                completed.
              </p>
            </div>
          </div>
        )}

        {isCritical && mission.payment_status !== "SETTLED" && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Payment Due Soon
              </p>
              <p className="text-[10px] text-amber-800 mt-0.5">
                Please complete your payment to secure your plane.
              </p>
            </div>
          </div>
        )}

        {mission.payment_status === "SETTLED" && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">
                Payment Verified
              </p>
              <p className="text-[10px] text-emerald-800 mt-0.5">
                Everything is confirmed. Your plane is secured for departure.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
