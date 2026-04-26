const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN || "";

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Agents / Prospects
export const adminApi = {
  getProspects: () => adminFetch<AgentRow[]>("/api/admin/prospects"),
  promoteProspect: (agentId: string) =>
    adminFetch<AgentRow>(`/api/admin/prospects/${agentId}/promote`, { method: "PATCH" }),
  updateAgentStatus: (agentId: string, status: string) =>
    adminFetch<AgentRow>(`/api/admin/agents/${agentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assignPolicy: (agentId: string, policyId: string) =>
    adminFetch<AgentRow>(`/api/admin/agents/${agentId}/policy`, {
      method: "PATCH",
      body: JSON.stringify({ policyId }),
    }),

  // Settlements
  getPendingSettlements: () => adminFetch<LedgerRow[]>("/api/admin/settlements/pending"),
  reviewSettlement: (ledgerId: string, status: string, adminId: string, reasonCode?: string) =>
    adminFetch<LedgerRow>(`/api/admin/settlements/${ledgerId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminId, reasonCode }),
    }),

  // Ledger / Reclaws
  createReclaw: (payload: ReclawPayload) =>
    adminFetch<LedgerRow>("/api/admin/ledger/reclaw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAgentLedger: (agentId: string) => adminFetch<LedgerRow[]>(`/api/admin/agents/${agentId}/ledger`),
  getAgentHandoffs: (agentId: string) => adminFetch<HandoffRow[]>(`/api/admin/agents/${agentId}/handoffs`),

  // Threat rules
  getThreatRules: () => adminFetch<ThreatRule[]>("/api/admin/threat/ip-rules"),
  createThreatRule: (payload: { ruleType: string; value: string; category: string; notes?: string }) =>
    adminFetch<ThreatRule>("/api/admin/threat/ip-rules", { method: "POST", body: JSON.stringify(payload) }),
  updateThreatRule: (ruleId: string, payload: { category: string; notes?: string }) =>
    adminFetch<ThreatRule>(`/api/admin/threat/ip-rules/${ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Policies
  getPolicies: () => adminFetch<PolicyRow[]>("/api/policies"),
};

export interface AgentRow {
  agent_id: string;
  status: string;
  parent_agent_id?: string;
  assigned_policy_id?: string;
  created_at: string;
}

export interface LedgerRow {
  ledger_id: string;
  agent_id: string;
  master_project_id?: string;
  tx_type: string;
  fee_snapshot?: number;
  amount: number;
  status: string;
  policy_id?: string;
  reviewed_by?: string;
  reason_code?: string;
  created_at: string;
}

export interface HandoffRow {
  handoff_id: string;
  agent_id: string;
  service_address: string;
  status: string;
  created_at: string;
}

export interface ThreatRule {
  rule_id: string;
  rule_type: string;
  value: string;
  category: string;
  notes?: string;
  created_at: string;
}

export interface PolicyRow {
  policy_id: string;
  name: string;
  service_category: string;
  status: string;
  created_at: string;
}

export interface ReclawPayload {
  agentId: string;
  masterProjectId: string;
  amount: number;
  adminId: string;
  reasonCode: string;
}
