import { ExtractionRequest, ExtractionResult } from "./extraction-types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the base URL for the backend API.
 *
 * In development, uses the local backend server.
 * In production, uses the deployed backend URL.
 * Falls back to Supabase Edge Functions if backend URL is not configured.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Use dedicated backend if available, otherwise fall back to Supabase Edge Functions
const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api/v1` : SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "/api/v1";

if (!BACKEND_URL && !SUPABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("Neither VITE_BACKEND_URL nor VITE_SUPABASE_URL is defined. API calls may fail at runtime.");
}

/**
 * Get the current auth token for API requests.
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Make an authenticated API request.
 */
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export type ExtractContactsResponse = ExtractionResult;

/**
 * Call the `extract-contacts` backend function.
 *
 * This function only knows about HTTP and typed payloads; it has no React
 * dependencies, which makes it straightforward to unit test.
 */
export async function extractContacts(request: ExtractionRequest): Promise<ExtractContactsResponse> {
  const endpoint = API_BASE_URL.includes("/functions/v1") 
    ? `${API_BASE_URL}/extract-contacts`
    : `${API_BASE_URL}/extraction/extract`;
  
  const response = await authenticatedFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "error" in errorBody
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (errorBody as any).error
        : `Request failed with status ${response.status}`;

    throw new Error(`extractContacts failed: ${message}`);
  }

  const data = (await response.json()) as ExtractContactsResponse;
  return data;
}

export type ProcessUploadRequest = {
  productionId?: string;
  productionName: string;
  filename: string;
  documentContent: string;
  documentType?: string | null;
};

export type ProcessUploadResponse = {
  production_id: string;
  upload_id: string;
  contacts_created: number;
  extraction_result: ExtractionResult;
};

/**
 * Process a callsheet upload: creates/uses production, runs extraction, persists contacts.
 */
export async function processUpload(request: ProcessUploadRequest): Promise<ProcessUploadResponse> {
  const endpoint = API_BASE_URL.includes("/functions/v1")
    ? `${API_BASE_URL}/process-upload`
    : `${API_BASE_URL}/productions/upload`;
  
  const response = await authenticatedFetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "error" in errorBody
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (errorBody as any).error
        : `Request failed with status ${response.status}`;

    throw new Error(`processUpload failed: ${message}`);
  }

  const data = (await response.json()) as ProcessUploadResponse;
  return data;
}

export type Production = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ListProductionsResponse = {
  items: Production[];
  total: number;
};

/**
 * List productions with optional search.
 */
export async function listProductions(search?: string, limit = 20): Promise<ListProductionsResponse> {
  const baseEndpoint = API_BASE_URL.includes("/functions/v1")
    ? `${API_BASE_URL}/list-productions`
    : `${API_BASE_URL}/productions`;
  
  const url = new URL(baseEndpoint);
  if (search) url.searchParams.set("search", search);
  if (limit) url.searchParams.set("limit", limit.toString());

  const response = await authenticatedFetch(url.toString());

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "error" in errorBody
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (errorBody as any).error
        : `Request failed with status ${response.status}`;

    throw new Error(`listProductions failed: ${message}`);
  }

  const data = (await response.json()) as ListProductionsResponse;
  return data;
}

export type Upload = {
  id: string;
  filename: string;
  status: string;
  contacts_extracted: number | null;
  error_message: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  location: string | null;
  call_time: string | null;
  wrap_time: string | null;
  source_file: string | null;
  created_at: string;
};

export type ProductionDetailResponse = {
  production: Production;
  uploads: Upload[];
  contacts: Contact[];
};

/**
 * Get production detail with uploads and contacts.
 */
export async function getProductionDetail(productionId: string): Promise<ProductionDetailResponse> {
  const baseEndpoint = API_BASE_URL.includes("/functions/v1")
    ? `${API_BASE_URL}/get-production-detail`
    : `${API_BASE_URL}/productions/detail`;
  
  const url = new URL(baseEndpoint);
  url.searchParams.set("productionId", productionId);

  const response = await authenticatedFetch(url.toString());

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    const message =
      typeof errorBody === "object" && errorBody !== null && "error" in errorBody
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (errorBody as any).error
        : `Request failed with status ${response.status}`;

    throw new Error(`getProductionDetail failed: ${message}`);
  }

  const data = (await response.json()) as ProductionDetailResponse;
  return data;
}



