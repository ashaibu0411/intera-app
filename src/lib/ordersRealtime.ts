import { supabase } from '@/lib/supabase';

export function subscribeToMyOrders(params: {
  customerId: string;
  onChange: () => void;
}) {
  const channel = supabase
    .channel(`business_orders:customer:${params.customerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'business_orders', filter: `customer_id=eq.${params.customerId}` },
      () => params.onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToBusinessOrders(params: {
  businessId: string;
  onChange: () => void;
}) {
  const channel = supabase
    .channel(`business_orders:business:${params.businessId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'business_orders', filter: `business_id=eq.${params.businessId}` },
      () => params.onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

