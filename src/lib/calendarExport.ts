/**
 * Generate ICS (iCalendar) content for adding appointments to device calendar.
 * Users can share/save this to add to Google Calendar, Apple Calendar, etc.
 */
export function generateAppointmentIcs(params: {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // "10:00 AM" or "10:00"
  durationMinutes: number;
  businessName?: string;
  serviceName?: string;
}): string {
  const { title, description, location, startDate, startTime, durationMinutes } = params;

  // Parse start time to 24h
  const [timePart, period] = startTime.toUpperCase().split(/\s+/);
  const [h, m] = timePart.split(':').map(Number);
  let hours = h;
  if (period === 'PM' && h !== 12) hours += 12;
  if (period === 'AM' && h === 12) hours = 0;

  const start = new Date(`${startDate}T${hours.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const formatDt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const desc = [
    description,
    params.serviceName && `Service: ${params.serviceName}`,
    params.businessName && `Business: ${params.businessName}`,
  ]
    .filter(Boolean)
    .join('\n');

  const eventLines = [
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@intera.app`,
    `DTSTAMP:${formatDt(new Date())}`,
    `DTSTART:${formatDt(start)}`,
    `DTEND:${formatDt(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    desc ? `DESCRIPTION:${escapeIcs(desc)}` : '',
    location ? `LOCATION:${escapeIcs(location)}` : '',
    'END:VEVENT',
  ].filter(Boolean);

  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Intera//Appointments//EN', ...eventLines, 'END:VCALENDAR'].join('\r\n');
}

/** Generate ICS with multiple events (e.g. a full day of appointments) */
export function generateMultiAppointmentIcs(events: Array<{
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  businessName?: string;
  serviceName?: string;
}>): string {
  const eventBlocks = events.map((e) => generateAppointmentIcs(e));
  const first = eventBlocks[0];
  if (eventBlocks.length === 1) return first;
  const firstCal = first.replace('END:VCALENDAR', '');
  const extraEvents = eventBlocks.slice(1).map((block) => {
    const match = block.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/);
    return match ? match[0] : '';
  }).filter(Boolean);
  return firstCal + extraEvents.join('\r\n') + '\r\nEND:VCALENDAR';
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
