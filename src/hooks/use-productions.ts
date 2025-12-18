import { useState, useCallback } from "react";
import { listProductions, getProductionDetail, type Production, type ProductionDetailResponse } from "@/lib/api";

/**
 * Custom hook for managing productions data.
 * Provides loading states and error handling.
 */
export function useProductions() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<ProductionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProductions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProductions();
      setProductions(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load productions";
      setError(message);
      console.error("Failed to load productions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProductionDetail = useCallback(async (productionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getProductionDetail(productionId);
      setSelectedProduction(detail);
      return detail;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load production details";
      setError(message);
      console.error("Failed to load production details:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    productions,
    selectedProduction,
    loading,
    error,
    loadProductions,
    loadProductionDetail,
    setSelectedProduction,
  };
}

