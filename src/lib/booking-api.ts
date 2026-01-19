import { supabase } from './supabase';

// ==================== Types ====================

export interface DbBusinessService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  category: string | null;
  image: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbBusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  is_open: boolean;
  open_time: string;
  close_time: string;
  created_at: string;
  updated_at: string;
}

export interface DbBusinessBookingSettings {
  id: string;
  business_id: string;
  is_booking_enabled: boolean;
  has_business_pro: boolean;
  appointment_buffer: number;
  advance_booking_days: number;
  total_bookings_received: number;
  blocked_dates: string[];
  created_at: string;
  updated_at: string;
}

export interface DbBlockedSlot {
  id: string;
  business_id: string;
  date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  reason: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface DbAppointment {
  id: string;
  business_id: string;
  service_id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  payment_method: 'cash' | 'card_on_site' | 'gems' | 'in_app' | null;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_amount: number | null;
  gems_paid: number | null;
  notes: string | null;
  customer_phone: string | null;
  cancelled_by: 'customer' | 'business' | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service?: DbBusinessService;
  customer?: {
    id: string;
    name: string;
    avatar_url: string | null;
    phone: string | null;
  };
  business?: {
    id: string;
    name: string;
    image: string | null;
    address: string | null;
  };
}

export interface DbServiceTemplate {
  id: string;
  business_category: string;
  name: string;
  description: string | null;
  suggested_duration: number;
  suggested_price: number;
  currency: string;
  service_category: string | null;
  display_order: number;
  created_at: string;
}

// ==================== Service Templates ====================

export async function getServiceTemplates(businessCategory: string): Promise<DbServiceTemplate[]> {
  // Map common category names to template categories
  const categoryMap: Record<string, string> = {
    'beauty & hair': 'hair_salon',
    'beauty': 'beauty_salon',
    'hair': 'hair_salon',
    'barber': 'barbershop',
    'barbershop': 'barbershop',
    'salon': 'hair_salon',
    'spa': 'spa',
    'massage': 'spa',
    'fitness': 'fitness',
    'gym': 'fitness',
    'personal training': 'fitness',
    'photography': 'photography',
    'auto': 'auto_services',
    'car wash': 'auto_services',
    'detailing': 'auto_services',
    'tutoring': 'tutoring',
    'education': 'tutoring',
    'cleaning': 'home_services',
    'home services': 'home_services',
    'pet': 'pet_services',
    'grooming': 'pet_services',
    'nails': 'beauty_salon',
  };

  const normalizedCategory = businessCategory.toLowerCase().trim();
  const templateCategory = categoryMap[normalizedCategory] || normalizedCategory;

  const { data, error } = await supabase
    .from('service_templates')
    .select('*')
    .eq('business_category', templateCategory)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching service templates:', error);
    return [];
  }

  return (data || []) as DbServiceTemplate[];
}

export async function getAllServiceTemplateCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('service_templates')
    .select('business_category')
    .order('business_category');

  if (error) {
    console.error('Error fetching template categories:', error);
    return [];
  }

  const categories = [...new Set((data || []).map(d => d.business_category))];
  return categories;
}

// ==================== Business Services ====================

export async function getBusinessServices(businessId: string): Promise<DbBusinessService[]> {
  const { data, error } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching business services:', error);
    return [];
  }

  return (data || []) as DbBusinessService[];
}

export async function getAllBusinessServices(businessId: string): Promise<DbBusinessService[]> {
  const { data, error } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching business services:', error);
    return [];
  }

  return (data || []) as DbBusinessService[];
}

export async function createBusinessService(
  businessId: string,
  service: {
    name: string;
    description?: string;
    duration: number;
    price: number;
    currency?: string;
    category?: string;
    image?: string;
  }
): Promise<DbBusinessService | null> {
  const { data, error } = await supabase
    .from('business_services')
    .insert({
      business_id: businessId,
      name: service.name,
      description: service.description || null,
      duration: service.duration,
      price: service.price,
      currency: service.currency || 'USD',
      category: service.category || null,
      image: service.image || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business service:', error);
    return null;
  }

  return data as DbBusinessService;
}

export async function updateBusinessService(
  serviceId: string,
  updates: Partial<{
    name: string;
    description: string | null;
    duration: number;
    price: number;
    category: string | null;
    image: string | null;
    is_active: boolean;
    display_order: number;
  }>
): Promise<DbBusinessService | null> {
  const { data, error } = await supabase
    .from('business_services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business service:', error);
    return null;
  }

  return data as DbBusinessService;
}

export async function deleteBusinessService(serviceId: string): Promise<boolean> {
  const { error } = await supabase
    .from('business_services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('Error deleting business service:', error);
    return false;
  }

  return true;
}

export async function createServicesFromTemplates(
  businessId: string,
  templates: DbServiceTemplate[]
): Promise<DbBusinessService[]> {
  const servicesToInsert = templates.map((template, index) => ({
    business_id: businessId,
    name: template.name,
    description: template.description,
    duration: template.suggested_duration,
    price: template.suggested_price,
    currency: template.currency,
    category: template.service_category,
    is_active: true,
    display_order: index,
  }));

  const { data, error } = await supabase
    .from('business_services')
    .insert(servicesToInsert)
    .select();

  if (error) {
    console.error('Error creating services from templates:', error);
    return [];
  }

  return (data || []) as DbBusinessService[];
}

// ==================== Business Hours ====================

export async function getBusinessHours(businessId: string): Promise<DbBusinessHours[]> {
  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('business_id', businessId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching business hours:', error);
    return [];
  }

  return (data || []) as DbBusinessHours[];
}

export async function setBusinessHours(
  businessId: string,
  hours: Array<{
    day_of_week: number;
    is_open: boolean;
    open_time: string;
    close_time: string;
  }>
): Promise<DbBusinessHours[]> {
  // Upsert all hours
  const hoursToUpsert = hours.map(h => ({
    business_id: businessId,
    day_of_week: h.day_of_week,
    is_open: h.is_open,
    open_time: h.open_time,
    close_time: h.close_time,
  }));

  const { data, error } = await supabase
    .from('business_hours')
    .upsert(hoursToUpsert, { onConflict: 'business_id,day_of_week' })
    .select();

  if (error) {
    console.error('Error setting business hours:', error);
    return [];
  }

  return (data || []) as DbBusinessHours[];
}

export async function initializeDefaultBusinessHours(businessId: string): Promise<DbBusinessHours[]> {
  const defaultHours = [
    { day_of_week: 0, is_open: false, open_time: '09:00', close_time: '18:00' }, // Sunday
    { day_of_week: 1, is_open: true, open_time: '09:00', close_time: '18:00' },  // Monday
    { day_of_week: 2, is_open: true, open_time: '09:00', close_time: '18:00' },  // Tuesday
    { day_of_week: 3, is_open: true, open_time: '09:00', close_time: '18:00' },  // Wednesday
    { day_of_week: 4, is_open: true, open_time: '09:00', close_time: '18:00' },  // Thursday
    { day_of_week: 5, is_open: true, open_time: '09:00', close_time: '18:00' },  // Friday
    { day_of_week: 6, is_open: true, open_time: '10:00', close_time: '16:00' },  // Saturday
  ];

  return setBusinessHours(businessId, defaultHours);
}

// ==================== Booking Settings ====================

export async function getBusinessBookingSettings(businessId: string): Promise<DbBusinessBookingSettings | null> {
  const { data, error } = await supabase
    .from('business_booking_settings')
    .select('*')
    .eq('business_id', businessId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null;
    }
    console.error('Error fetching booking settings:', error);
    return null;
  }

  return data as DbBusinessBookingSettings;
}

export async function createBusinessBookingSettings(
  businessId: string,
  settings?: Partial<{
    is_booking_enabled: boolean;
    appointment_buffer: number;
    advance_booking_days: number;
  }>
): Promise<DbBusinessBookingSettings | null> {
  const { data, error } = await supabase
    .from('business_booking_settings')
    .insert({
      business_id: businessId,
      is_booking_enabled: settings?.is_booking_enabled ?? true,
      appointment_buffer: settings?.appointment_buffer ?? 15,
      advance_booking_days: settings?.advance_booking_days ?? 30,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking settings:', error);
    return null;
  }

  return data as DbBusinessBookingSettings;
}

export async function updateBusinessBookingSettings(
  businessId: string,
  updates: Partial<{
    is_booking_enabled: boolean;
    has_business_pro: boolean;
    appointment_buffer: number;
    advance_booking_days: number;
    blocked_dates: string[];
  }>
): Promise<DbBusinessBookingSettings | null> {
  const { data, error } = await supabase
    .from('business_booking_settings')
    .update(updates)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking settings:', error);
    return null;
  }

  return data as DbBusinessBookingSettings;
}

// ==================== Blocked Slots ====================

export async function getBlockedSlots(businessId: string): Promise<DbBlockedSlot[]> {
  const { data, error } = await supabase
    .from('business_blocked_slots')
    .select('*')
    .eq('business_id', businessId);

  if (error) {
    console.error('Error fetching blocked slots:', error);
    return [];
  }

  return (data || []) as DbBlockedSlot[];
}

export async function addBlockedSlot(
  businessId: string,
  slot: {
    date?: string;
    day_of_week?: number;
    start_time: string;
    end_time: string;
    reason?: string;
    is_recurring?: boolean;
  }
): Promise<DbBlockedSlot | null> {
  const { data, error } = await supabase
    .from('business_blocked_slots')
    .insert({
      business_id: businessId,
      date: slot.date || null,
      day_of_week: slot.day_of_week ?? null,
      start_time: slot.start_time,
      end_time: slot.end_time,
      reason: slot.reason || null,
      is_recurring: slot.is_recurring || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding blocked slot:', error);
    return null;
  }

  return data as DbBlockedSlot;
}

export async function removeBlockedSlot(slotId: string): Promise<boolean> {
  const { error } = await supabase
    .from('business_blocked_slots')
    .delete()
    .eq('id', slotId);

  if (error) {
    console.error('Error removing blocked slot:', error);
    return false;
  }

  return true;
}

// ==================== Appointments ====================

export async function getBusinessAppointments(
  businessId: string,
  options?: {
    date?: string;
    status?: string;
    limit?: number;
  }
): Promise<DbAppointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      service:business_services(*),
      customer:profiles!customer_id(id, name, avatar_url, phone)
    `)
    .eq('business_id', businessId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (options?.date) {
    query = query.eq('date', options.date);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching business appointments:', error);
    return [];
  }

  return (data || []) as DbAppointment[];
}

export async function getCustomerAppointments(
  customerId: string,
  options?: {
    status?: string;
    upcoming?: boolean;
    limit?: number;
  }
): Promise<DbAppointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      service:business_services(*),
      business:businesses!business_id(id, name, image, address)
    `)
    .eq('customer_id', customerId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.upcoming) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('date', today);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching customer appointments:', error);
    return [];
  }

  return (data || []) as DbAppointment[];
}

export async function getAppointment(appointmentId: string): Promise<DbAppointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      service:business_services(*),
      customer:profiles!customer_id(id, name, avatar_url, phone),
      business:businesses!business_id(id, name, image, address)
    `)
    .eq('id', appointmentId)
    .single();

  if (error) {
    console.error('Error fetching appointment:', error);
    return null;
  }

  return data as DbAppointment;
}

export async function createAppointment(appointment: {
  business_id: string;
  service_id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  payment_method?: 'cash' | 'card_on_site' | 'gems' | 'in_app';
  payment_amount?: number;
  gems_paid?: number;
  notes?: string;
  customer_phone?: string;
}): Promise<DbAppointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      business_id: appointment.business_id,
      service_id: appointment.service_id,
      customer_id: appointment.customer_id,
      date: appointment.date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: 'pending',
      payment_method: appointment.payment_method || null,
      payment_status: appointment.payment_method === 'gems' || appointment.payment_method === 'in_app' ? 'paid' : 'pending',
      payment_amount: appointment.payment_amount || null,
      gems_paid: appointment.gems_paid || null,
      notes: appointment.notes || null,
      customer_phone: appointment.customer_phone || null,
    })
    .select(`
      *,
      service:business_services(*),
      business:businesses!business_id(id, name, image, address)
    `)
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return null;
  }

  // Increment total bookings count for the business
  await supabase
    .from('business_booking_settings')
    .update({ total_bookings_received: supabase.rpc('increment_bookings', { business_id: appointment.business_id }) })
    .eq('business_id', appointment.business_id);

  return data as DbAppointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
  cancelledBy?: 'customer' | 'business',
  cancellationReason?: string
): Promise<DbAppointment | null> {
  const updates: Record<string, unknown> = { status };

  if (status === 'cancelled' && cancelledBy) {
    updates.cancelled_by = cancelledBy;
    updates.cancellation_reason = cancellationReason || null;
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating appointment status:', error);
    return null;
  }

  return data as DbAppointment;
}

export async function updateAppointmentPaymentStatus(
  appointmentId: string,
  paymentStatus: 'pending' | 'paid' | 'refunded'
): Promise<DbAppointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ payment_status: paymentStatus })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    return null;
  }

  return data as DbAppointment;
}

// ==================== Availability Check ====================

export async function getAvailableTimeSlots(
  businessId: string,
  date: string,
  serviceDuration: number
): Promise<string[]> {
  // Get business hours for the day
  const dayOfWeek = new Date(date).getDay();
  const hours = await getBusinessHours(businessId);
  const dayHours = hours.find(h => h.day_of_week === dayOfWeek);

  if (!dayHours || !dayHours.is_open) {
    return [];
  }

  // Get existing appointments for the date
  const appointments = await getBusinessAppointments(businessId, { date });
  const bookedSlots = appointments
    .filter(a => a.status !== 'cancelled')
    .map(a => ({ start: a.start_time, end: a.end_time }));

  // Get blocked slots
  const blockedSlots = await getBlockedSlots(businessId);
  const relevantBlockedSlots = blockedSlots
    .filter(s => s.date === date || (s.is_recurring && s.day_of_week === dayOfWeek))
    .map(s => ({ start: s.start_time, end: s.end_time }));

  // Get booking settings
  const settings = await getBusinessBookingSettings(businessId);
  const buffer = settings?.appointment_buffer || 15;

  // Generate available slots
  const availableSlots: string[] = [];
  const openTime = dayHours.open_time;
  const closeTime = dayHours.close_time;

  // Convert times to minutes for easier calculation
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);

  // Generate 30-minute slot intervals
  for (let slotStart = openMinutes; slotStart + serviceDuration <= closeMinutes; slotStart += 30) {
    const slotEnd = slotStart + serviceDuration;
    const slotStartStr = toTimeString(slotStart);
    const slotEndStr = toTimeString(slotEnd);

    // Check if slot conflicts with booked appointments
    const isBooked = bookedSlots.some(({ start, end }) => {
      const bookedStart = toMinutes(start);
      const bookedEnd = toMinutes(end) + buffer;
      return (slotStart < bookedEnd && slotEnd > bookedStart);
    });

    // Check if slot conflicts with blocked times
    const isBlocked = relevantBlockedSlots.some(({ start, end }) => {
      const blockedStart = toMinutes(start);
      const blockedEnd = toMinutes(end);
      return (slotStart < blockedEnd && slotEnd > blockedStart);
    });

    if (!isBooked && !isBlocked) {
      // Convert to 12-hour format for display
      const hour = Math.floor(slotStart / 60);
      const minute = slotStart % 60;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      availableSlots.push(displayTime);
    }
  }

  return availableSlots;
}

// ==================== Helper to calculate end time ====================

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  // Parse start time (format: "9:00 AM" or "09:00")
  let hours: number;
  let minutes: number;

  if (startTime.includes('AM') || startTime.includes('PM')) {
    const [time, period] = startTime.split(' ');
    const [h, m] = time.split(':').map(Number);
    hours = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
    minutes = m;
  } else {
    const [h, m] = startTime.split(':').map(Number);
    hours = h;
    minutes = m;
  }

  // Add duration
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// ==================== Initialize booking for a new business ====================

export async function initializeBusinessBooking(
  businessId: string,
  businessCategory: string
): Promise<{
  settings: DbBusinessBookingSettings | null;
  hours: DbBusinessHours[];
  services: DbBusinessService[];
}> {
  // Create booking settings
  const settings = await createBusinessBookingSettings(businessId);

  // Initialize default hours
  const hours = await initializeDefaultBusinessHours(businessId);

  // Get service templates and create services
  const templates = await getServiceTemplates(businessCategory);
  const services = templates.length > 0
    ? await createServicesFromTemplates(businessId, templates)
    : [];

  return { settings, hours, services };
}
