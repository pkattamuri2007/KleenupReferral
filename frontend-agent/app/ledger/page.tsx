"use client"
import React from 'react';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function LedgerHistory() {
  const ledgerEntries = [
    { id: 'LDG-001', date: '2026-03-24', description: 'Referral Bonus - 123 Main St', amount: 20.00, status: 'APPROVED' },
    { id: 'LDG-002', date: '2026-03-25', description: 'Referral Bonus - 789 Pine Rd', amount: 15.50, status: 'PENDING_REVIEW' },
    { id: 'LDG-003', date: '2026-03-20', description: 'Referral Bonus - 404 Cedar Ln', amount: 25.00, status: 'APPROVED' },
    { id: 'LDG-004', date: '2026-03-10', description: 'Adjustment - Chargeback Reversal', amount: -10.00, status: 'RECLAW' },
    { id: 'LDG-005', date: '2026-02-28', description: 'Referral Bonus - 55 Oak Ave', amount: 30.00, status: 'APPROVED' },
    { id: 'LDG-006', date: '2026-02-15', description: 'Referral Bonus - 12 Elm St', amount: 18.00, status: 'REJECTED' }
  ];

  const getStatusBadge = (status: string) => {
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
        return <span>{status}</span>;
    }
  };

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
            <span className="text-sm font-medium text-white shadow-sm">Jane Doe</span>
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
          
          <div className="overflow-x-auto">
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
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-[#6B7280]">{entry.id}</td>
                    <td className="p-4 text-[#6B7280] font-medium">{entry.date}</td>
                    <td className="p-4 text-[#2D2D2D]">{entry.description}</td>
                    <td className="p-4">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className={`p-4 text-right pr-6 font-bold ${entry.amount < 0 ? 'text-red-600' : 'text-[#4B2E83]'}`}>
                      {entry.amount < 0 ? '-' : '+'}${Math.abs(entry.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
