import { supabase, DbMarketplaceListing, DbFaithEvent } from './supabase';

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
      accepts_bookings: business.acceptsBookings || false,
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
