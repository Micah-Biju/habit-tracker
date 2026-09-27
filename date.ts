// Date helpers for Unchaos planner

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Get Monday of the given date's week
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // day: 0 (Sun), 1 (Mon), ..., 6 (Sat)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Get 7 days starting from Monday
export function getWeekDays(monday: Date): { dateStr: string; date: Date; dayName: string; shortDay: string; displayDate: string }[] {
  const days = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatISODate(d);
    
    // Display date formatted like "23.03.2026" (from screenshots: "02.03.2026", "22.12.2025")
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const displayDate = `${dd}.${mm}.${yyyy}`;

    days.push({
      dateStr,
      date: d,
      dayName: dayNames[i],
      shortDay: shortDays[i],
      displayDate,
    });
  }
  return days;
}

export function getWeekLabel(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(monday.getDate() + 6);

  const startMonth = monday.toLocaleString('en-US', { month: 'short' });
  const endMonth = sun.toLocaleString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${monday.getDate()} – ${sun.getDate()}, ${monday.getFullYear()}`;
  }
  return `${startMonth} ${monday.getDate()} – ${endMonth} ${sun.getDate()}, ${sun.getFullYear()}`;
}

export function getWeekId(monday: Date): string {
  // Approximate ISO week number
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${monday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Generate calendar cells for a month (including leading and trailing days)
export function getMonthCalendarDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const cells = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex - 1, prevMonthLastDay - i);
    cells.push({
      dateStr: formatISODate(d),
      dayNumber: prevMonthLastDay - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, monthIndex, i);
    cells.push({
      dateStr: formatISODate(d),
      dayNumber: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill out to multiple of 7
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, monthIndex + 1, i);
    cells.push({
      dateStr: formatISODate(d),
      dayNumber: i,
      isCurrentMonth: false,
    });
  }

  return cells;
}
