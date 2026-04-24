const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agent_token");
}

export function saveToken(token: string) {
  localStorage.setItem("agent_token", token);
}

export function clearToken() {
  localStorage.removeItem("agent_token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export async function loginAgent(agentId: string) {
  const res = await fetch(`${BASE_URL}/api/portal/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Login failed");
  }
  return res.json() as Promise<{ token: string; agentId: string; status: string }>;
}

// Portal endpoints
export const portalApi = {
  getMe: () => apiFetch<Record<string, unknown>>("/api/portal/me"),
  getLinks: () => apiFetch<{ referralLink: string; agentId: string }>("/api/portal/me/links"),
  getHandoffs: () => apiFetch<HandoffEntry[]>("/api/portal/me/handoffs"),
  getLedger: () => apiFetch<LedgerEntry[]>("/api/portal/me/ledger"),
  getNetPayable: () => apiFetch<{ agentId: string; netPayable: number }>("/api/portal/me/net-payable"),
};

export interface HandoffEntry {
  handoff_id: string;
  service_address: string;
  status: string;
  created_at: string;
  fee_snapshot?: number;
}

export interface LedgerEntry {
  ledger_id: string;
  created_at: string;
  tx_type: string;
  amount: number;
  status: string;
  master_project_id?: string;
}
