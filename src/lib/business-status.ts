import { DbBusinessHours, DbBusinessBookingSettings, BusinessStatusType } from './booking-api';

export interface BusinessStatusInfo {
  status: 'open' | 'closed' | 'temporarily_closed' | 'vacation' | 'by_appointment' | 'opens_soon' | 'closing_soon';
  label: string;
  color: string;
  bgColor: string;
  message?: string;
  opensAt?: string;
  closesAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open Now', color: '#10B981', bgColor: '#D1FAE5' },
  closed: { label: 'Closed', color: '#EF4444', bgColor: '#FEE2E2' },
  temporarily_closed: { label: 'Temporarily Closed', color: '#F59E0B', bgColor: '#FEF3C7' },
  vacation: { label: 'On Vacation', color: '#8B5CF6', bgColor: '#EDE9FE' },
  by_appointment: { label: 'By Appointment', color: '#3B82F6', bgColor: '#DBEAFE' },
  opens_soon: { label: 'Opens Soon', color: '#F59E0B', bgColor: '#FEF3C7' },
  closing_soon: { label: 'Closing Soon', color: '#F59E0B', bgColor: '#FEF3C7' },
};

/**
 * Get the current day of week (0 = Sunday, 6 = Saturday)
 */
function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Get current time as "HH:MM" string
 */
function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Compare two time strings (HH:MM format)
 * Returns negative if time1 < time2, positive if time1 > time2, 0 if equal
 */
function compareTime(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  if (h1 !== h2) return h1 - h2;
  return m1 - m2;
}

/**
 * Format time string for display (e.g., "09:00" -> "9:00 AM")
 */
export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if current date falls within vacation period
 */
function isOnVacation(vacationStart?: string, vacationEnd?: string): boolean {
  if (!vacationStart || !vacationEnd) return false;

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return today >= vacationStart && today <= vacationEnd;
}

/**
 * Calculate real-time business status based on hours and settings
 */
export function getBusinessStatus(
  hours: DbBusinessHours[],
  settings?: DbBusinessBookingSettings | null,
  statusOverride?: BusinessStatusType
): BusinessStatusInfo {
  // Check for manual status override first
  const manualStatus = statusOverride || settings?.current_status;

  if (manualStatus === 'temporarily_closed') {
    return {
      status: 'temporarily_closed',
      ...STATUS_CONFIG.temporarily_closed,
      message: settings?.status_message || 'We\'re temporarily closed',
    };
  }

  if (manualStatus === 'vacation' || isOnVacation(settings?.vacation_start, settings?.vacation_end)) {
    const vacationEnd = settings?.vacation_end;
    return {
      status: 'vacation',
      ...STATUS_CONFIG.vacation,
      message: vacationEnd
        ? `Back on ${new Date(vacationEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : settings?.status_message || 'We\'re on vacation',
    };
  }

  if (manualStatus === 'by_appointment') {
    return {
      status: 'by_appointment',
      ...STATUS_CONFIG.by_appointment,
      message: settings?.status_message || 'Available by appointment only',
    };
  }

  // If no hours data, default to showing by appointment
  if (!hours || hours.length === 0) {
    return {
      status: 'by_appointment',
      ...STATUS_CONFIG.by_appointment,
      message: 'Contact for hours',
    };
  }

  const currentDay = getCurrentDayOfWeek();
  const currentTime = getCurrentTime();

  // Find today's hours
  const todayHours = hours.find(h => h.day_of_week === currentDay);

  if (!todayHours || !todayHours.is_open) {
    // Find next open day
    const nextOpenDay = findNextOpenDay(hours, currentDay);
    return {
      status: 'closed',
      ...STATUS_CONFIG.closed,
      message: nextOpenDay
        ? `Opens ${nextOpenDay.dayName} at ${formatTimeForDisplay(nextOpenDay.openTime)}`
        : 'Closed today',
    };
  }

  const { open_time, close_time } = todayHours;

  // Check if currently open
  if (compareTime(currentTime, open_time) >= 0 && compareTime(currentTime, close_time) < 0) {
    // Check if closing within 30 minutes
    const minutesToClose = getMinutesBetween(currentTime, close_time);

    if (minutesToClose <= 30) {
      return {
        status: 'closing_soon',
        ...STATUS_CONFIG.closing_soon,
        label: `Closes at ${formatTimeForDisplay(close_time)}`,
        closesAt: close_time,
      };
    }

    return {
      status: 'open',
      ...STATUS_CONFIG.open,
      closesAt: close_time,
      message: `Closes at ${formatTimeForDisplay(close_time)}`,
    };
  }

  // Before opening time
  if (compareTime(currentTime, open_time) < 0) {
    const minutesToOpen = getMinutesBetween(currentTime, open_time);

    if (minutesToOpen <= 60) {
      return {
        status: 'opens_soon',
        ...STATUS_CONFIG.opens_soon,
        label: `Opens at ${formatTimeForDisplay(open_time)}`,
        opensAt: open_time,
      };
    }

    return {
      status: 'closed',
      ...STATUS_CONFIG.closed,
      message: `Opens at ${formatTimeForDisplay(open_time)}`,
      opensAt: open_time,
    };
  }

  // After closing time
  const nextOpenDay = findNextOpenDay(hours, currentDay);
  return {
    status: 'closed',
    ...STATUS_CONFIG.closed,
    message: nextOpenDay
      ? `Opens ${nextOpenDay.dayName} at ${formatTimeForDisplay(nextOpenDay.openTime)}`
      : 'Closed',
  };
}

/**
 * Get minutes between two times
 */
function getMinutesBetween(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);

  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

/**
 * Find the next day the business is open
 */
function findNextOpenDay(
  hours: DbBusinessHours[],
  currentDay: number
): { dayName: string; openTime: string } | null {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayHours = hours.find(h => h.day_of_week === checkDay);

    if (dayHours?.is_open) {
      const dayName = i === 1 ? 'Tomorrow' : dayNames[checkDay];
      return { dayName, openTime: dayHours.open_time };
    }
  }

  return null;
}

/**
 * Get a simple status string for display in lists
 */
export function getSimpleStatusText(status: BusinessStatusInfo): string {
  if (status.status === 'open') return 'Open';
  if (status.status === 'closing_soon') return status.label;
  if (status.status === 'opens_soon') return status.label;
  if (status.status === 'vacation') return 'On Vacation';
  if (status.status === 'temporarily_closed') return 'Temp. Closed';
  if (status.status === 'by_appointment') return 'By Appt.';
  return 'Closed';
}

/**
 * Format business hours for display
 */
export function formatBusinessHoursForDisplay(hours: DbBusinessHours[]): string[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return hours
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map(h => {
      const dayName = dayNames[h.day_of_week];
      if (!h.is_open) return `${dayName}: Closed`;
      return `${dayName}: ${formatTimeForDisplay(h.open_time)} - ${formatTimeForDisplay(h.close_time)}`;
    });
}
