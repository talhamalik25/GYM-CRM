"use client";

import { useEffect, useState } from "react";
import DashboardOverview from "./dashboard-overview";
import { getAttendance, getAttendanceSummary } from "../../lib/attendanceService";

function timeLabel(value, timeZone) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PK", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function DashboardAttendanceData({ mockData }) {
  const [attendanceData, setAttendanceData] = useState({ checkedInToday: 0, items: [], timeZone: "Asia/Karachi" });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAttendanceSummary(), getAttendance({ limit: 50 })]).then(([summary, records]) => {
      if (cancelled) return;
      setAttendanceData({
        checkedInToday: summary.checkedInToday,
        timeZone: summary.timeZone,
        items: records.map((record) => ({
          id: record.id,
          memberName: record.memberName,
          checkInTime: timeLabel(record.checkInAt, summary.timeZone),
        })),
      });
    }).catch(() => {
      if (!cancelled) setAttendanceData({ checkedInToday: 0, items: [], timeZone: "Asia/Karachi" });
    });
    return () => { cancelled = true; };
  }, []);

  const data = {
    ...mockData,
    stats: mockData.stats.map((stat) => stat.key === "todayCheckIns" ? { ...stat, value: attendanceData.checkedInToday } : stat),
    todaysAttendance: attendanceData.items,
  };

  return <DashboardOverview data={data} />;
}
