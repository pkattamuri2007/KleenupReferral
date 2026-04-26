"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getLedger, getMe, LedgerEntry } from '../lib/api';

function describeEntry(entry: LedgerEntry): string {
  const type = entry.transaction_type;
  const project = entry.master_project_id ?? '—';
  if (type === 'RECLAW') return `Adjustment — ${entry.admin_reason_code ?? 'Reclaw'}`;
  if (type === 'TIER2_OVERRIDE') return `Tier-2 Override — ${project}`;
  if (type === 'SPIFF') return `Spiff Bonus — ${project}`;
  return `Referral Earning — ${project}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#3EC7A6]/10 text-[#3EC7A6] border border-[#3EC7A6]/20"><CheckCircle className="w-3 h-3 mr-1" /> APPROVED</span>;
    case 'PENDING_REVIEW':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> PENDING</span>;
    case 'REJECTED':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> REJECTED</span>;
    case 'ON_HOLD':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3 h-3 mr-1" /> ON HOLD</span>;
    case 'RECLAW':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">ADJUSTMENT</span>;
    default:
      return <span>{status}</span>;
  }
}

export default function LedgerHistory() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [agentId, setAgentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [me, ledger] = await Promise.all([getMe(), getLedger()]);
        setAgentId(me.agent_id as string);
        setEntries(ledger);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ledger');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-12">

      {/* Navbar / Top Header */}
      <div className="bg-[#4B2E83] px-6 py-4 md:px-10 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-white font-extrabold text-2xl tracking-tight">KLEENUP</span>
            <span className="bg-[#3EC7A6] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Partner</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
            <span className="text-sm font-medium text-white shadow-sm">{agentId || '—'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 mt-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-[#6C4EB6] hover:text-[#4B2E83] font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
            <div className="bg-[#F4F5F7] p-2 rounded-lg">
              <FileText className="w-6 h-6 text-[#4B2E83]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4B2E83]">Ledger History</h1>
              <p className="text-[#6B7280] text-sm mt-1">A complete record of all your earnings, pending approvals, and adjustments.</p>
            </div>
          </div>

          {loading && (
            <p className="p-6 text-[#6B7280] text-sm">Loading…</p>
          )}

          {error && (
            <div className="p-6">
              <p className="text-red-600 font-semibold text-sm">Could not load ledger</p>
              <p className="text-[#6B7280] text-xs font-mono mt-1 break-all">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              {entries.length === 0 ? (
                <p className="p-6 text-[#6B7280] text-sm">No ledger entries yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F5F7] text-[#6B7280] text-xs uppercase tracking-wider font-bold">
                      <th className="p-4 pl-6">Transaction ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {entries.map((entry) => {
                      const amount = Number(entry.amount);
                      return (
                        <tr key={entry.ledger_id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                          <td className="p-4 pl-6 font-mono text-xs text-[#6B7280]">{entry.ledger_id}</td>
                          <td className="p-4 text-[#6B7280] font-medium">
                            {new Date(entry.created_at).toISOString().slice(0, 10)}
                          </td>
                          <td className="p-4 text-[#2D2D2D]">{describeEntry(entry)}</td>
                          <td className="p-4">{getStatusBadge(entry.status)}</td>
                          <td className={`p-4 text-right pr-6 font-bold ${amount < 0 ? 'text-red-600' : 'text-[#4B2E83]'}`}>
                            {amount < 0 ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
