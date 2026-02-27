import { supabase } from '@/lib/supabase';

export function subscribeToBusinessInventory(params: {
  businessId: string;
  onChange: () => void;
}) {
  const channel = supabase
    .channel(`business_inventory:${params.businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'business_inventory',
        filter: `business_id=eq.${params.businessId}`,
      },
      () => {
        params.onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToInventoryUpdates(params: {
  city: string;
  onInsert: () => void;
}) {
  const channel = supabase
    .channel(`business_inventory_updates:${params.city}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'business_inventory_updates',
        filter: `city=eq.${params.city}`,
      },
      () => {
        params.onInsert();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

