const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function authHeaders(): HeadersInit {
  const jwt = process.env.NEXT_PUBLIC_AGENT_JWT ?? "";
  return {
    "Content-Type": "application/json",
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Agent profile: { agent_id, status, parent_agent_id, assigned_policy_id, created_at }
export const getMe = () => get<Record<string, unknown>>("/api/portal/me");

// Referral link: { referralLink, agentId }
export const getLinks = () =>
  get<{ referralLink: string; agentId: string }>("/api/portal/me/links");

// Net payable: { agentId, netPayable }
export const getNetPayable = () =>
  get<{ agentId: string; netPayable: number }>("/api/portal/me/net-payable");

// Ledger entries: [{ ledger_id, agent_id, master_project_id, transaction_type, amount, status, created_at, ... }]
export const getLedger = () =>
  get<LedgerEntry[]>("/api/portal/me/ledger");

// Handoffs: [{ handoff_uuid, agent_id, normalized_address, threat_level, created_at, ... }]
export const getHandoffs = () =>
  get<HandoffEntry[]>("/api/portal/me/handoffs");

export interface LedgerEntry {
  ledger_id: string;
  agent_id: string;
  master_project_id: string;
  transaction_type: string;
  amount: number | string;
  status: string;
  actor_admin_id: string | null;
  admin_reason_code: string | null;
  metadata_json: unknown;
  created_at: string;
}

export interface HandoffEntry {
  handoff_uuid: string;
  agent_id: string;
  normalized_address: string;
  address_hash: string;
  visitor_ip: string;
  threat_level: string;
  requires_audit: boolean;
  idempotency_key: string | null;
  created_at: string;
}
