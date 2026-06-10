import { useQuery } from "@tanstack/react-query";
import { getDataProvider } from "@/lib/dataProvider";
import { queryKeys } from "./keys";

export function useBusinessUnits() {
  return useQuery({
    queryKey: queryKeys.businessUnits,
    queryFn: () => getDataProvider().listBusinessUnits(),
    staleTime: 5 * 60 * 1000,
  });
}
