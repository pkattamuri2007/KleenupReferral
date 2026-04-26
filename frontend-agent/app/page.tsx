"use client"
import React, { useState, useEffect } from 'react';
import {
  Copy,
  DollarSign,
  Clock,
  Briefcase,
  TrendingUp,
  Link as LinkIcon,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getMe, getLinks, getNetPayable, getLedger, getHandoffs, LedgerEntry, HandoffEntry } from './lib/api';

interface DashboardData {
  netPayable: number;
  pendingEarnings: number;
  handoffs: { id: string; address: string; status: string; date: string }[];
  chartData: { name: string; earnings: number }[];
}

function buildChartData(ledger: LedgerEntry[]): { name: string; earnings: number }[] {
  const monthMap: Record<string, number> = {};
  ledger
    .filter(e => e.status === 'APPROVED' && Number(e.amount) > 0)
    .forEach(e => {
      const d = new Date(e.created_at);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthMap[key] = (monthMap[key] ?? 0) + Number(e.amount);
    });
  const entries = Object.entries(monthMap);
  if (entries.length === 0) return [{ name: '—', earnings: 0 }];
  return entries.map(([name, earnings]) => ({ name, earnings }));
}

export default function AgentDashboard() {
  const [copied, setCopied] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [completedJobs, setCompletedJobs] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<DashboardData>({
    netPayable: 0,
    pendingEarnings: 0,
    handoffs: [],
    chartData: [{ name: '—', earnings: 0 }],
  });

  const copyToClipboard = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function load() {
      try {
        const [me, links, netData, handoffsData, ledger] = await Promise.all([
          getMe(),
          getLinks(),
          getNetPayable(),
          getHandoffs(),
          getLedger(),
        ]);

        setAgentId(me.agent_id as string);
        setReferralLink(links.referralLink);

        const pendingEarnings = (ledger as LedgerEntry[])
          .filter(e => e.status === 'PENDING_REVIEW' && Number(e.amount) > 0)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const recentHandoffs = (handoffsData as HandoffEntry[]).slice(0, 5).map(h => ({
          id: h.handoff_uuid,
          address: h.normalized_address,
          status: h.threat_level === 'CLEAN' ? 'REFERRED' : 'SCANNING',
          date: new Date(h.created_at).toISOString().slice(0, 10),
        }));

        const approved = (ledger as LedgerEntry[]).filter(
          e => e.status === 'APPROVED' && e.transaction_type === 'EARNING'
        );

        setData({
          netPayable: netData.netPayable,
          pendingEarnings,
          handoffs: recentHandoffs,
          chartData: buildChartData(ledger as LedgerEntry[]),
        });
        setTotalReferrals((handoffsData as HandoffEntry[]).length);
        setCompletedJobs(approved.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <span className="text-[#4B2E83] font-semibold text-lg">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow text-center max-w-md">
          <p className="text-red-600 font-semibold mb-2">Could not reach backend</p>
          <p className="text-[#6B7280] text-sm font-mono break-all">{error}</p>
          <p className="text-[#6B7280] text-xs mt-4">Check that NEXT_PUBLIC_API_URL and NEXT_PUBLIC_AGENT_JWT are set in .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans pb-12">

      {/* Navbar / Top Header (Deep Purple) */}
      <div className="bg-[#4B2E83] px-6 py-4 md:px-10 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-white font-extrabold text-2xl tracking-tight">KLEENUP</span>
            <span className="bg-[#3EC7A6] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Partner</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 px-4 py-1.5 rounded-full border border-white/20">
            <div className="w-2.5 h-2.5 bg-[#3EC7A6] rounded-full animate-pulse shadow-[0_0_8px_#3EC7A6]"></div>
            <span className="text-sm font-medium text-white shadow-sm">{agentId}</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pt-8 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B2E83]">Welcome back, {agentId}</h1>
          <p className="text-[#6B7280] mt-1 text-lg">Here&apos;s your partner performance overview.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 space-y-8 mt-2">

        {/* Top Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Earnings Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Total Earnings</p>
                <h3 className="text-4xl font-extrabold text-[#2D2D2D] mt-2">${data.netPayable.toFixed(2)}</h3>
              </div>
              <div className="bg-[#3EC7A6]/10 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-[#3EC7A6]" />
              </div>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium text-[#3EC7A6]">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Approved balance</span>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Pending Approval</p>
                <h3 className="text-4xl font-extrabold text-[#2D2D2D] mt-2">${data.pendingEarnings.toFixed(2)}</h3>
              </div>
              <div className="bg-[#F4F5F7] p-3 rounded-xl border border-gray-200">
                <Clock className="w-6 h-6 text-[#6B7280]" />
              </div>
            </div>
            <div className="mt-6 text-sm text-[#6B7280] font-medium">
              Expected release within 48 hours
            </div>
          </div>

          {/* Referral Link Card */}
          <div className="bg-gradient-to-br from-[#4B2E83] to-[#6C4EB6] rounded-2xl p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="z-10">
              <div className="flex justify-between items-start mb-4">
                <p className="text-[#F4F5F7] font-semibold tracking-wide">Your Unique Link</p>
                <LinkIcon className="w-5 h-5 text-[#3EC7A6]" />
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 font-mono text-sm break-all border border-white/10 shadow-inner">
                {referralLink || '—'}
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!referralLink}
              className="mt-6 w-full py-3 bg-[#3EC7A6] hover:brightness-110 text-white transition-all rounded-xl font-bold flex items-center justify-center shadow-md shadow-[#3EC7A6]/30 disabled:opacity-50"
            >
              {copied ? (
                <><CheckCircle className="w-5 h-5 mr-2 text-white" /> Copied!</>
              ) : (
                <><Copy className="w-5 h-5 mr-2" /> Copy Link</>
              )}
            </button>
          </div>
        </div>

        {/* Middle Section: Chart and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-[#4B2E83] mb-6">Earnings Trend</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C4EB6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6C4EB6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} dx={-10} tickFormatter={(val: number) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#4B2E83', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="earnings" stroke="#4B2E83" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#4B2E83] mb-4">Quick Stats</h2>
              <ul className="space-y-4">
                <li className="flex justify-between items-center p-4 bg-[#F4F5F7] rounded-xl border border-gray-100">
                  <div className="flex items-center text-[#2D2D2D] font-medium">
                    <Briefcase className="w-5 h-5 mr-3 text-[#6C4EB6]" />
                    Total Referrals
                  </div>
                  <span className="text-xl font-bold text-[#4B2E83]">{totalReferrals}</span>
                </li>
                <li className="flex justify-between items-center p-4 bg-[#F4F5F7] rounded-xl border border-gray-100">
                  <div className="flex items-center text-[#2D2D2D] font-medium">
                    <CheckCircle className="w-5 h-5 mr-3 text-[#3EC7A6]" />
                    Completed Jobs
                  </div>
                  <span className="text-xl font-bold text-[#4B2E83]">{completedJobs}</span>
                </li>
              </ul>
            </div>
            <Link href="/ledger" className="mt-8 bg-[#4B2E83] hover:bg-[#6C4EB6] text-white text-sm font-bold flex items-center justify-center w-full py-3 rounded-xl shadow-md transition-colors">
              View Complete Ledger <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Recent Handoffs Table */}
        <div className="bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#4B2E83]">Recent Referred Jobs</h2>
            <Link href="/ledger" className="text-sm font-semibold text-[#6C4EB6] hover:text-[#4B2E83] bg-[#F4F5F7] px-4 py-2 rounded-lg transition-colors">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {data.handoffs.length === 0 ? (
              <p className="p-6 text-[#6B7280] text-sm">No referrals yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F5F7] text-[#6B7280] text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6">Job Address</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Job Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {data.handoffs.map((job) => (
                    <tr key={job.id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                      <td className="p-4 pl-6 font-medium text-[#2D2D2D]">{job.address}</td>
                      <td className="p-4 text-[#6B7280]">{job.date}</td>
                      <td className="p-4">
                        {job.status === 'REFERRED' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#3EC7A6]/10 text-[#3EC7A6] border border-[#3EC7A6]/20">
                            REFERRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            SCANNING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
