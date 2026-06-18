import { useQuery } from "@tanstack/react-query";

export function useMockQuery(key, loader) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 180));
      return loader();
    },
  });
}
