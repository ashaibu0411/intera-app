import {
  supabase,
  DbMarketplaceListing,
  DbFaithEvent,
  DbEvent,
  DbIncident,
  DbIncidentSignal,
  DbUtilityReport,
  DbHousingListing,
  DbHousingListingConfirmation,
  DbHousingListingFlag,
  DbBusinessReview,
  DbBusinessConfirmation,
  DbBusinessInventoryUpdate,
  DbBusinessOrder,
  DbBusinessOrderItem,
  DbServiceProvider,
  DbServiceProviderReview,
  DbServiceProviderConfirmation,
  DbServeTalent,
} from './supabase';

export type BusinessOrderStatus = DbBusinessOrder['status'];
export type BusinessInventoryUpdateScope = DbBusinessInventoryUpdate['scope'];

// ==================== MARKETPLACE ====================

export async function getMarketplaceListings(category?: string, limit = 50) {
  let query = supabase
    .from('marketplace_listings')
    .select(`
      *,
      seller:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getMarketplaceListing(listingId: string) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select(`
      *,
      seller:profiles(*)
    `)
    .eq('id', listingId)
    .single();

  if (error) throw error;

  // Increment views
  await supabase
    .from('marketplace_listings')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', listingId);

  return data;
}

export async function createMarketplaceListing(
  sellerId: string,
  listing: {
    title: string;
    description: string;
    price: number;
    currency?: string;
    images: string[];
    category: string;
    condition: 'new' | 'used' | 'refurbished';
    location?: string;
    isStoreBased: boolean;
    storeName?: string;
  }
) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      seller_id: sellerId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency || 'USD',
      images: listing.images,
      category: listing.category,
      condition: listing.condition,
      location: listing.location,
      is_store_based: listing.isStoreBased,
      store_name: listing.storeName,
      views: 0,
    })
    .select(`
      *,
      seller:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMarketplaceListing(listingId: string) {
  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', listingId);

  if (error) throw error;
}

// ==================== BUSINESSES ====================

export async function getBusinesses(category?: string, limit = 50) {
  let query = supabase
    .from('businesses')
    .select(`
      *,
      owner:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category && category !== 'all') {
    query = query.ilike('category', `%${category}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getBusiness(businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      owner:profiles(*)
    `)
    .eq('id', businessId)
    .single();

  if (error) throw error;
  return data;
}

export async function getBusinessesByOwner(ownerId: string, limit = 200) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, logo, image, location, address, owner_id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createBusiness(
  ownerId: string,
  business: {
    name: string;
    category: string;
    description: string;
    image: string;
    logo?: string;
    location: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    hours: string;
    isAfricanMarket: boolean;
    acceptsBookings?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      owner_id: ownerId,
      name: business.name,
      category: business.category,
      description: business.description,
      image: business.image,
      logo: business.logo,
      location: business.location,
      address: business.address,
      phone: business.phone,
      email: business.email,
      website: business.website,
      hours: business.hours,
      is_african_market: business.isAfricanMarket,
      rating: 0,
      reviews: 0,
      is_verified: false,
      is_featured: false,
    })
    .select(`
      *,
      owner:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusiness(businessId: string, updates: Partial<{
  name: string;
  category: string;
  description: string;
  image: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
}>) {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBusiness(businessId: string) {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId);

  if (error) throw error;
}

// ==================== BUSINESS INVENTORY ====================

export async function getBusinessInventory(businessId: string) {
  const { data, error } = await supabase
    .from('business_inventory')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addInventoryItem(
  businessId: string,
  item: {
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    inStock: boolean;
    quantity?: number;
  }
) {
  const { data, error } = await supabase
    .from('business_inventory')
    .insert({
      business_id: businessId,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      in_stock: item.inStock,
      quantity: item.quantity,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(itemId: string, updates: Partial<{
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  quantity: number;
}>) {
  const { data, error } = await supabase
    .from('business_inventory')
    .update({
      name: updates.name,
      description: updates.description,
      price: updates.price,
      image: updates.image,
      in_stock: updates.inStock,
      quantity: updates.quantity,
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(itemId: string) {
  const { error } = await supabase
    .from('business_inventory')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ==================== BUSINESS INVENTORY UPDATES (feed + push) ====================

export async function createBusinessInventoryUpdate(payload: {
  businessId: string;
  itemId?: string | null;
  kind: string;
  title: string;
  message: string;
  scope: BusinessInventoryUpdateScope;
  city: string;
  neighborhood?: string | null;
}) {
  const { data, error } = await supabase
    .from('business_inventory_updates')
    .insert({
      business_id: payload.businessId,
      item_id: payload.itemId ?? null,
      kind: payload.kind,
      title: payload.title,
      message: payload.message,
      scope: payload.scope,
      city: payload.city,
      neighborhood: payload.neighborhood ?? null,
    })
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        item:business_inventory(id, name, price, image, in_stock, quantity, category)
      `
    )
    .single();

  if (error) throw error;
  return data as unknown as DbBusinessInventoryUpdate;
}

export async function getBusinessInventoryUpdates(params: {
  city: string;
  neighborhood?: string | null;
  limit?: number;
}) {
  let q = supabase
    .from('business_inventory_updates')
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        item:business_inventory(id, name, price, image, in_stock, quantity, category)
      `
    )
    .eq('city', params.city)
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 30);

  if (params.neighborhood) {
    q = q.eq('scope', 'neighborhood').eq('neighborhood', params.neighborhood);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as DbBusinessInventoryUpdate[];
}

// ==================== BUSINESS PICKUP ORDERS ====================

export async function createBusinessOrder(payload: {
  businessId: string;
  items: Array<{ inventoryItemId: string; quantity: number }>;
  pickupTime?: string | null; // ISO
  notes?: string | null;
}) {
  // Prefer atomic RPC (handles quantity decrements safely).
  const rpcRes = await supabase.rpc('create_business_order', {
    p_business_id: payload.businessId,
    p_items: payload.items.map((x) => ({
      inventory_item_id: x.inventoryItemId,
      quantity: x.quantity,
    })),
    p_pickup_time: payload.pickupTime ?? null,
    p_notes: payload.notes ?? null,
  });

  if (!rpcRes.error && rpcRes.data) {
    return rpcRes.data as unknown as DbBusinessOrder;
  }

  // Fallback: direct inserts (no atomic inventory checks).
  // This keeps the app usable even if the RPC isn't deployed yet.
  const { data: created, error: oErr } = await supabase
    .from('business_orders')
    .insert({
      business_id: payload.businessId,
      status: 'pending',
      pickup_time: payload.pickupTime ?? null,
      notes: payload.notes ?? null,
      currency: 'USD',
      subtotal: 0,
    })
    .select('*')
    .single();
  if (oErr) throw oErr;

  const lines: Array<{
    order_id: string;
    inventory_item_id: string;
    name_snapshot: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }> = [];

  for (const x of payload.items) {
    const { data: item, error: iErr } = await supabase
      .from('business_inventory')
      .select('id, name, price')
      .eq('id', x.inventoryItemId)
      .eq('business_id', payload.businessId)
      .single();
    if (iErr) throw iErr;
    const unitPrice = Number((item as any)?.price ?? 0);
    const qty = Math.max(1, Math.floor(Number(x.quantity) || 1));
    lines.push({
      order_id: created.id,
      inventory_item_id: item.id,
      name_snapshot: String((item as any)?.name ?? 'Item'),
      unit_price: unitPrice,
      quantity: qty,
      line_total: unitPrice * qty,
    });
  }

  const { error: liErr } = await supabase.from('business_order_items').insert(lines);
  if (liErr) throw liErr;

  const subtotal = lines.reduce((s, l) => s + (Number(l.line_total) || 0), 0);
  const { data: updated, error: uErr } = await supabase
    .from('business_orders')
    .update({ subtotal })
    .eq('id', created.id)
    .select('*')
    .single();
  if (uErr) throw uErr;

  return updated as unknown as DbBusinessOrder;
}

export async function getMyBusinessOrders(ownerId: string, limit = 100) {
  const { data: biz, error: bErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', ownerId);
  if (bErr) throw bErr;
  const ids = (biz || []).map((x: any) => x.id).filter(Boolean);
  if (!ids.length) return [] as DbBusinessOrder[];

  const { data, error } = await supabase
    .from('business_orders')
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        customer:profiles(*),
        items:business_order_items(*)
      `
    )
    .in('business_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbBusinessOrder[];
}

export async function getBusinessOrders(businessId: string, limit = 100) {
  const { data, error } = await supabase
    .from('business_orders')
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        customer:profiles(*),
        items:business_order_items(*)
      `
    )
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbBusinessOrder[];
}

export async function getMyOrders(customerId: string, limit = 100) {
  const { data, error } = await supabase
    .from('business_orders')
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        items:business_order_items(*)
      `
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbBusinessOrder[];
}

export async function updateBusinessOrderStatus(orderId: string, status: BusinessOrderStatus) {
  const { data, error } = await supabase
    .from('business_orders')
    .update({ status })
    .eq('id', orderId)
    .select(
      `
        *,
        business:businesses(id, name, logo, image, location, address, owner_id),
        customer:profiles(*),
        items:business_order_items(*)
      `
    )
    .single();
  if (error) throw error;
  return data as unknown as DbBusinessOrder;
}

export async function cancelMyBusinessOrder(orderId: string) {
  return updateBusinessOrderStatus(orderId, 'cancelled');
}

// ==================== FAITH EVENTS ====================

export async function getFaithEvents(faithType?: string, limit = 50) {
  let query = supabase
    .from('faith_events')
    .select('*')
    .order('date', { ascending: true })
    .limit(limit);

  if (faithType) {
    query = query.eq('faith_type', faithType);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getFaithEvent(eventId: string) {
  const { data, error } = await supabase
    .from('faith_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data;
}

export async function createFaithEvent(
  organizerId: string,
  event: {
    organizationName: string;
    organizationLogo?: string;
    faithType: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    address: string;
    isRecurring: boolean;
    recurringSchedule?: string;
    contactPhone?: string;
    contactEmail?: string;
  }
) {
  const { data, error } = await supabase
    .from('faith_events')
    .insert({
      organizer_id: organizerId,
      organization_name: event.organizationName,
      organization_logo: event.organizationLogo,
      faith_type: event.faithType,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      address: event.address,
      is_recurring: event.isRecurring,
      recurring_schedule: event.recurringSchedule,
      contact_phone: event.contactPhone,
      contact_email: event.contactEmail,
      attendees_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFaithEvent(eventId: string) {
  const { error } = await supabase
    .from('faith_events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

export async function rsvpToFaithEvent(eventId: string, userId: string) {
  // First add to RSVP table
  const { error: rsvpError } = await supabase
    .from('faith_event_rsvps')
    .insert({
      event_id: eventId,
      user_id: userId,
    });

  if (rsvpError && rsvpError.code !== '23505') throw rsvpError;

  // Increment attendees count
  const { data: event } = await supabase
    .from('faith_events')
    .select('attendees_count')
    .eq('id', eventId)
    .single();

  if (event) {
    await supabase
      .from('faith_events')
      .update({ attendees_count: (event.attendees_count || 0) + 1 })
      .eq('id', eventId);
  }
}

// ==================== EVENTS ====================

export async function getEvents(limit = 100) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles(*)
    `)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data as unknown as DbEvent[];
}

export async function createEvent(
  creatorId: string,
  event: {
    title: string;
    description: string;
    date: string; // ISO string
    time: string;
    endTime?: string;
    location: string;
    address: string;
    image?: string;
    category: string;
    isPublic: boolean;
    scope: 'city' | 'nearby' | 'global';
  }
) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      creator_id: creatorId,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      end_time: event.endTime,
      location: event.location,
      address: event.address,
      image: event.image,
      category: event.category,
      is_public: event.isPublic,
      scope: event.scope,
    })
    .select(`
      *,
      creator:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data as unknown as DbEvent;
}

export async function getEvent(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles(*)
    `)
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data as unknown as DbEvent;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<{
    title: string;
    description: string;
    date: string;
    time: string;
    end_time: string | null;
    location: string;
    address: string;
    image: string | null;
    category: string;
    is_public: boolean;
    scope: 'city' | 'nearby' | 'global';
  }>
) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select(`
      *,
      creator:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data as unknown as DbEvent;
}

export async function getEventRsvpCounts(eventId: string): Promise<{ going: number; interested: number }> {
  const { count: goingCount, error: goingError } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'going');
  if (goingError) throw goingError;

  const { count: interestedCount, error: interestedError } = await supabase
    .from('event_rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'interested');
  if (interestedError) throw interestedError;

  return { going: goingCount || 0, interested: interestedCount || 0 };
}

export async function setEventRsvp(eventId: string, userId: string, status: 'interested' | 'going') {
  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: userId, status },
      { onConflict: 'event_id,user_id' }
    );
  if (error) throw error;
}

export async function removeEventRsvp(eventId: string, userId: string) {
  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ==================== INCIDENTS (Safety / SOS) ====================

export async function createIncident(
  creatorId: string,
  incident: {
    type: string;
    title: string;
    description: string;
    image?: string | null;
    country: string;
    admin_area?: string | null;
    city: string;
    neighborhood?: string | null;
    location_label: string;
    lat?: number | null;
    lng?: number | null;
    scope: 'neighborhood' | 'city' | 'global';
  }
) {
  const { data, error } = await supabase
    .from('incidents')
    .insert({
      creator_id: creatorId,
      type: incident.type,
      title: incident.title,
      description: incident.description,
      image: incident.image ?? null,
      country: incident.country,
      admin_area: incident.admin_area ?? null,
      city: incident.city,
      neighborhood: incident.neighborhood ?? null,
      location_label: incident.location_label,
      lat: incident.lat ?? null,
      lng: incident.lng ?? null,
      scope: incident.scope,
      status: 'active',
    })
    .select(`*, creator:profiles(*)`)
    .single();

  if (error) throw error;
  return data as unknown as DbIncident;
}

export async function getIncidents(limit = 50) {
  const { data, error } = await supabase
    .from('incidents')
    .select(`*, creator:profiles(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as DbIncident[];
}

export async function updateIncidentStatus(incidentId: string, status: 'active' | 'resolved') {
  const { data, error } = await supabase
    .from('incidents')
    .update({ status })
    .eq('id', incidentId)
    .select(`*, creator:profiles(*)`)
    .single();

  if (error) throw error;
  return data as unknown as DbIncident;
}

export async function getIncidentSignalCounts(incidentId: string): Promise<{ meToo: number; helping: number; resolved: number }> {
  const getCount = async (kind: DbIncidentSignal['kind']) => {
    const { count, error } = await supabase
      .from('incident_signals')
      .select('*', { count: 'exact', head: true })
      .eq('incident_id', incidentId)
      .eq('kind', kind);
    if (error) throw error;
    return count || 0;
  };

  const [meToo, helping, resolved] = await Promise.all([
    getCount('me_too'),
    getCount('helping'),
    getCount('resolved'),
  ]);

  return { meToo, helping, resolved };
}

export async function setIncidentSignal(incidentId: string, userId: string, kind: DbIncidentSignal['kind']) {
  const { error } = await supabase
    .from('incident_signals')
    .insert({ incident_id: incidentId, user_id: userId, kind });
  if (error && error.code !== '23505') throw error;
}

export async function removeIncidentSignal(incidentId: string, userId: string, kind: DbIncidentSignal['kind']) {
  const { error } = await supabase
    .from('incident_signals')
    .delete()
    .eq('incident_id', incidentId)
    .eq('user_id', userId)
    .eq('kind', kind);
  if (error) throw error;
}

// ==================== UTILITY REPORTS ====================

export async function createUtilityReport(
  creatorId: string,
  report: {
    utility: DbUtilityReport['utility'];
    state: DbUtilityReport['state'];
    note?: string | null;
    country: string;
    admin_area?: string | null;
    city: string;
    neighborhood?: string | null;
    location_label: string;
    lat?: number | null;
    lng?: number | null;
    scope: DbUtilityReport['scope'];
  }
) {
  const { data, error } = await supabase
    .from('utility_reports')
    .insert({
      creator_id: creatorId,
      utility: report.utility,
      state: report.state,
      note: report.note ?? null,
      country: report.country,
      admin_area: report.admin_area ?? null,
      city: report.city,
      neighborhood: report.neighborhood ?? null,
      location_label: report.location_label,
      lat: report.lat ?? null,
      lng: report.lng ?? null,
      scope: report.scope,
    })
    .select(`*, creator:profiles(*)`)
    .single();

  if (error) throw error;
  return data as unknown as DbUtilityReport;
}

export async function getUtilityReports(limit = 100) {
  const { data, error } = await supabase
    .from('utility_reports')
    .select(`*, creator:profiles(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as DbUtilityReport[];
}

// ==================== HOUSING ====================

export async function getHousingListings(limit = 100) {
  const { data, error } = await supabase
    .from('housing_listings')
    .select(`*, creator:profiles(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbHousingListing[];
}

export async function createHousingListing(
  creatorId: string,
  listing: Omit<DbHousingListing, 'id' | 'creator_id' | 'created_at' | 'creator'> & {
    images?: string[];
  }
) {
  const { data, error } = await supabase
    .from('housing_listings')
    .insert({
      creator_id: creatorId,
      type: listing.type,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      currency: listing.currency,
      price_type: listing.price_type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      is_furnished: listing.is_furnished,
      utilities_included: listing.utilities_included,
      pet_friendly: listing.pet_friendly,
      images: listing.images ?? [],
      country: listing.country,
      admin_area: listing.admin_area ?? null,
      city: listing.city,
      neighborhood: listing.neighborhood ?? null,
      location_label: listing.location_label,
      address: listing.address ?? null,
      scope: listing.scope,
    })
    .select(`*, creator:profiles(*)`)
    .single();
  if (error) throw error;
  return data as unknown as DbHousingListing;
}

export async function getHousingListingCounts(listingId: string): Promise<{ confirmations: number; flags: number }> {
  const { count: confirmations, error: cErr } = await supabase
    .from('housing_listing_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId);
  if (cErr) throw cErr;

  const { count: flags, error: fErr } = await supabase
    .from('housing_listing_flags')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', listingId);
  if (fErr) throw fErr;

  return { confirmations: confirmations || 0, flags: flags || 0 };
}

export async function setHousingListingConfirmation(listingId: string, userId: string) {
  const { error } = await supabase
    .from('housing_listing_confirmations')
    .insert({ listing_id: listingId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function removeHousingListingConfirmation(listingId: string, userId: string) {
  const { error } = await supabase
    .from('housing_listing_confirmations')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function flagHousingListing(listingId: string, userId: string, reason = 'suspicious', note?: string | null) {
  const { error } = await supabase
    .from('housing_listing_flags')
    .insert({ listing_id: listingId, user_id: userId, reason, note: note ?? null });
  if (error && error.code !== '23505') throw error;
}

export async function unflagHousingListing(listingId: string, userId: string) {
  const { error } = await supabase
    .from('housing_listing_flags')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ==================== SERVICE PROVIDERS (Businesses trust) ====================

export async function getBusinessReviews(businessId: string, limit = 50) {
  const { data, error } = await supabase
    .from('business_reviews')
    .select(`*, reviewer:profiles(*)`)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbBusinessReview[];
}

export async function upsertBusinessReview(
  businessId: string,
  reviewerId: string,
  rating: number,
  review?: string | null
) {
  // Avoid reviewer:profiles(*) on upsert — nested select can fail RLS and abort a successful write.
  const { data, error } = await supabase
    .from('business_reviews')
    .upsert(
      { business_id: businessId, reviewer_id: reviewerId, rating, review: review ?? null },
      { onConflict: 'business_id,reviewer_id' }
    )
    .select('id, business_id, reviewer_id, rating, review, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as unknown as DbBusinessReview;
}

export async function getBusinessTrustCounts(businessId: string): Promise<{ reviews: number; avgRating: number; workedForMe: number }> {
  const { count: reviewCount, error: rcErr } = await supabase
    .from('business_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);
  if (rcErr) throw rcErr;

  const { data: ratings, error: rErr } = await supabase
    .from('business_reviews')
    .select('rating')
    .eq('business_id', businessId);
  if (rErr) throw rErr;
  const nums = (ratings || []).map((r: any) => Number(r.rating)).filter((n) => !isNaN(n));
  const avgRating = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

  const { count: workedForMe, error: wfErr } = await supabase
    .from('business_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);
  if (wfErr) throw wfErr;

  return { reviews: reviewCount || 0, avgRating, workedForMe: workedForMe || 0 };
}

export async function setBusinessConfirmation(businessId: string, userId: string) {
  const { error } = await supabase
    .from('business_confirmations')
    .insert({ business_id: businessId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function removeBusinessConfirmation(businessId: string, userId: string) {
  const { error } = await supabase
    .from('business_confirmations')
    .delete()
    .eq('business_id', businessId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ==================== INDIVIDUAL SERVICE PROVIDERS ====================

export async function getServiceProviders(limit = 100) {
  const { data, error } = await supabase
    .from('service_providers')
    .select(`*, user:profiles(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbServiceProvider[];
}

export async function upsertMyServiceProviderProfile(
  userId: string,
  provider: {
    category: string;
    title: string;
    bio: string;
    skills: string[];
    is_available: boolean;
    availability_note?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    country: string;
    admin_area?: string | null;
    city: string;
    neighborhood?: string | null;
    location_label: string;
    scope: 'neighborhood' | 'city' | 'global';
  }
) {
  const { data, error } = await supabase
    .from('service_providers')
    .upsert(
      {
        user_id: userId,
        category: provider.category,
        title: provider.title,
        bio: provider.bio,
        skills: provider.skills,
        is_available: provider.is_available,
        availability_note: provider.availability_note ?? null,
        contact_phone: provider.contact_phone ?? null,
        contact_email: provider.contact_email ?? null,
        country: provider.country,
        admin_area: provider.admin_area ?? null,
        city: provider.city,
        neighborhood: provider.neighborhood ?? null,
        location_label: provider.location_label,
        scope: provider.scope,
      },
      { onConflict: 'user_id' }
    )
    .select(`*, user:profiles(*)`)
    .single();
  if (error) throw error;
  return data as unknown as DbServiceProvider;
}

export async function getServiceProviderReviews(providerId: string, limit = 50) {
  const { data, error } = await supabase
    .from('service_provider_reviews')
    .select(`*, reviewer:profiles(*)`)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbServiceProviderReview[];
}

export async function upsertServiceProviderReview(providerId: string, reviewerId: string, rating: number, review?: string | null) {
  const { data, error } = await supabase
    .from('service_provider_reviews')
    .upsert(
      { provider_id: providerId, reviewer_id: reviewerId, rating, review: review ?? null },
      { onConflict: 'provider_id,reviewer_id' }
    )
    .select('id, provider_id, reviewer_id, rating, review, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as unknown as DbServiceProviderReview;
}

export async function getServiceProviderTrustCounts(providerId: string): Promise<{ reviews: number; avgRating: number; workedForMe: number }> {
  const { count: reviewCount, error: rcErr } = await supabase
    .from('service_provider_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId);
  if (rcErr) throw rcErr;

  const { data: ratings, error: rErr } = await supabase
    .from('service_provider_reviews')
    .select('rating')
    .eq('provider_id', providerId);
  if (rErr) throw rErr;
  const nums = (ratings || []).map((r: any) => Number(r.rating)).filter((n) => !isNaN(n));
  const avgRating = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

  const { count: workedForMe, error: wfErr } = await supabase
    .from('service_provider_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId);
  if (wfErr) throw wfErr;

  return { reviews: reviewCount || 0, avgRating, workedForMe: workedForMe || 0 };
}

export async function setServiceProviderConfirmation(providerId: string, userId: string) {
  const { error } = await supabase
    .from('service_provider_confirmations')
    .insert({ provider_id: providerId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}

export async function removeServiceProviderConfirmation(providerId: string, userId: string) {
  const { error } = await supabase
    .from('service_provider_confirmations')
    .delete()
    .eq('provider_id', providerId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ==================== SERVE & CONNECT (Volunteers/Talents) ====================

export async function getServeTalents(limit = 150) {
  const { data, error } = await supabase
    .from('serve_talents')
    .select(`*, user:profiles(*)`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as DbServeTalent[];
}

export async function upsertMyServeTalent(
  userId: string,
  talent: {
    category: string;
    skills: string[];
    experience: string;
    bio: string;
    is_available: boolean;
    availability_note?: string | null;
    willing_to_travel: boolean;
    travel_radius?: string | null;
    faith_background?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    portfolio_images?: string[];
    video_link?: string | null;
    country: string;
    admin_area?: string | null;
    city: string;
    neighborhood?: string | null;
    location_label: string;
    scope: 'neighborhood' | 'city' | 'global';
  }
) {
  const { data, error } = await supabase
    .from('serve_talents')
    .upsert(
      {
        user_id: userId,
        category: talent.category,
        skills: talent.skills,
        experience: talent.experience,
        bio: talent.bio,
        is_available: talent.is_available,
        availability_note: talent.availability_note ?? null,
        willing_to_travel: talent.willing_to_travel,
        travel_radius: talent.travel_radius ?? null,
        faith_background: talent.faith_background ?? null,
        contact_phone: talent.contact_phone ?? null,
        contact_email: talent.contact_email ?? null,
        portfolio_images: talent.portfolio_images ?? [],
        video_link: talent.video_link ?? null,
        country: talent.country,
        admin_area: talent.admin_area ?? null,
        city: talent.city,
        neighborhood: talent.neighborhood ?? null,
        location_label: talent.location_label,
        scope: talent.scope,
      },
      { onConflict: 'user_id' }
    )
    .select(`*, user:profiles(*)`)
    .single();
  if (error) throw error;
  return data as unknown as DbServeTalent;
}
