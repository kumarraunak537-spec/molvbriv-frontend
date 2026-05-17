import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

export function useRole() {
  const { user } = useCart();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setRole(data?.role || 'user');
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, isAdmin: role === 'admin' || role === 'super_admin', loading };
}
