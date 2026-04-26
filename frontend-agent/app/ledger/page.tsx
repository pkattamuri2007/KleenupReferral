"use client"
import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { portalApi, LedgerEntry } from '@/lib/api';

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#3EC7A6]/10 text-[#3EC7A6] border border-[#3EC7A6]/20"><CheckCircle className="w-3 h-3 mr-1" /> APPROVED</span>;
    case 'PENDING_REVIEW':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> PENDING</span>;
    case 'REJECTED':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> REJECTED</span>;
    case 'RECLAW':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300">ADJUSTMENT</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">{status}</span>;
  }
}

function getTxLabel(txType: string) {
  switch (txType) {
    case 'EARNING': return 'Referral Bonus';
    case 'TIER2_OVERRIDE': return 'Tier-2 Override';
    case 'RECLAW': return 'Adjustment';
    case 'SPIFF': return 'Spiff Bonus';
    default: return txType;
  }
}

export default function LedgerHistory() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi.getLedger()
      .then(setEntries)
      .catch(err => {
        if (err.message !== 'Unauthorized') setError(err.message || 'Failed to load ledger');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-12">

      {/* Navbar */}
      <div className="bg-[#4B2E83] px-6 py-4 md:px-10 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-white font-extrabold text-2xl tracking-tight">KLEENUP</span>
            <span className="bg-[#3EC7A6] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Partner</span>
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
            <div className="p-10 text-center text-[#4B2E83] font-semibold animate-pulse">Loading ledger...</div>
          )}

          {error && (
            <div className="p-10 text-center text-red-600 font-semibold">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              {entries.length === 0 ? (
                <div className="p-10 text-center text-[#6B7280] text-sm">No ledger entries yet.</div>
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
                    {entries.map((entry) => (
                      <tr key={entry.ledger_id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                        <td className="p-4 pl-6 font-mono text-xs text-[#6B7280]">{entry.ledger_id.slice(0, 8).toUpperCase()}</td>
                        <td className="p-4 text-[#6B7280] font-medium">{new Date(entry.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-[#2D2D2D]">
                          {getTxLabel(entry.tx_type)}
                          {entry.master_project_id && <span className="text-[#6B7280] ml-1 text-xs">– {entry.master_project_id.slice(0, 8)}</span>}
                        </td>
                        <td className="p-4">{getStatusBadge(entry.status)}</td>
                        <td className={`p-4 text-right pr-6 font-bold ${entry.amount < 0 ? 'text-red-600' : 'text-[#4B2E83]'}`}>
                          {entry.amount < 0 ? '-' : '+'}${Math.abs(entry.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
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
