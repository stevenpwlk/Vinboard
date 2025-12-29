import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertBottle, type ImportBottleInput } from "@shared/routes";
import { z } from "zod";

export type BottlesFilters = {
  q?: string;
  status?: string;
  confidence?: string;
  window_source?: string;
  color?: string;
  type?: string;
  sweetness?: string;
  location?: string;
  sort?: string;
};

// GET /api/bottles
export function useBottles(filters?: BottlesFilters) {
  // Create a stable query key based on filters
  const queryKey = [api.bottles.list.path, filters];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const url = `${api.bottles.list.path}?${params.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bottles");
      
      return api.bottles.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/bottles/:id
export function useBottle(id: string) {
  return useQuery({
    queryKey: [api.bottles.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.bottles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) throw new Error("Bottle not found");
      if (!res.ok) throw new Error("Failed to fetch bottle details");
      
      return api.bottles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// POST /api/bottles
export function useCreateBottle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertBottle & { addToExisting?: boolean }) => {
      const { addToExisting, ...payload } = data as { addToExisting?: boolean };
      const validated = api.bottles.create.input.parse(payload);
      const res = await fetch(api.bottles.create.path, {
        method: api.bottles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validated, addToExisting }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.bottles.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create bottle");
      }
      return api.bottles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bottles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// PATCH /api/bottles/:id
export function useUpdateBottle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InsertBottle>) => {
      const validated = api.bottles.update.input.parse(updates);
      const url = buildUrl(api.bottles.update.path, { id });
      
      const res = await fetch(url, {
        method: api.bottles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update bottle");
      return api.bottles.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.bottles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.bottles.get.path, data.id] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// DELETE /api/bottles/:id
export function useDeleteBottle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.bottles.delete.path, { id });
      const res = await fetch(url, { 
        method: api.bottles.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete bottle");
      if (res.status !== 204) {
        await res.json().catch(() => null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bottles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// POST /api/bottles/import
export function useImportBottles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ImportBottleInput | ImportBottleInput[]) => {
      // Validate locally first to catch simple errors before network
      const inputSchema = z.union([api.bottles.import.input, z.array(api.bottles.import.input)]);
      // Note: we skip strict local validation here because the backend handles robust parsing
      
      const res = await fetch(api.bottles.import.path, {
        method: api.bottles.import.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to import bottles");
      return api.bottles.import.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bottles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

// GET /api/bottles/filters
export function useBottleFilters() {
  return useQuery({
    queryKey: [api.bottles.filters.path],
    queryFn: async () => {
      const res = await fetch(api.bottles.filters.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch bottle filters");
      return api.bottles.filters.responses[200].parse(await res.json());
    },
  });
}

// GET /api/dashboard/stats
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}
