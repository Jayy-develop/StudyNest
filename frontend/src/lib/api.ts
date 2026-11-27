const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8010/api";

const TOKEN_KEY = "hayabusa_token";

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      setAuthToken(null);
    }
    const validationErrors =
      data && typeof data.errors === "object" && data.errors !== null
        ? Object.values(data.errors as Record<string, string[]>)
            .flat()
            .join(" ")
        : "";
    const message =
      validationErrors ||
      (typeof data?.message === "string" ? data.message : `Permintaan gagal (${response.status}).`);
    throw new ApiError(message, response.status, data);
  }

  return (data ?? {}) as T;
}

export async function downloadMaterialFile(materialId: number, filename: string): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/materials/${materialId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError("Gagal mengunduh file materi.", response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
