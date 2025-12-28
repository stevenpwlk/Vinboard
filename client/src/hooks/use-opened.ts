import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertOpenedBottle } from "@shared/routes";

// GET /api/opened
export function useOpenedBottles() {
  return useQuery({
    queryKey: [api.opened.list.path],
    queryFn: async () => {
      const res = await fetch(api.opened.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.opened.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/opened (Typically used when marking a bottle as opened)
export function useCreateOpenedBottle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertOpenedBottle) => {
      const validated = api.opened.create.input.parse(data);
      const res = await fetch(api.opened.create.path, {
        method: api.opened.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add to history");
      return api.opened.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.opened.list.path] });
      // Opening a bottle likely affects the bottles list (quantity decrease) and dashboard stats
      queryClient.invalidateQueries({ queryKey: [api.bottles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// PATCH /api/opened/:id (Updating tasting notes or rating)
export function useUpdateOpenedBottle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InsertOpenedBottle>) => {
      const validated = api.opened.update.input.parse(updates);
      const url = buildUrl(api.opened.update.path, { id });
      
      const res = await fetch(url, {
        method: api.opened.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update history");
      return api.opened.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.opened.list.path] });
    },
  });
}
