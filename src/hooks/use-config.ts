import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ConfigValues {
  fraisInscription: number;
  mensualite: number;
  total: number;
  paymentMethods: string[];
}

const DEFAULTS: ConfigValues = {
  fraisInscription: 50000,
  mensualite: 500000,
  total: 550000,
  paymentMethods: ["virement", "especes", "cheque", "orange", "autre"],
};

export function useConfig() {
  const { data, isLoading } = useQuery<ConfigValues>({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config").select("key, value");
      if (error) return DEFAULTS;

      const get = (key: string) => data.find((r) => r.key === key)?.value;
      const fi = Number(get("frais_inscription")) || DEFAULTS.fraisInscription;
      const m  = Number(get("mensualite"))        || DEFAULTS.mensualite;
      const pm = get("payment_methods");

      return {
        fraisInscription: fi,
        mensualite: m,
        total: fi + m,
        paymentMethods: Array.isArray(pm) ? pm : DEFAULTS.paymentMethods,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return { config: data ?? DEFAULTS, isLoading };
}
