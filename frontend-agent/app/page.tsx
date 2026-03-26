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

export default function AgentDashboard() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://kleenup.com/friends/X-Jane123";
  const [data, setData] = useState({
    netPayable: 470.50,
    pendingEarnings: 120.00,
    handoffs: [
      { id: 1, address: "123 Main Street, Aspen Hill, MD", status: "COMPLETED", date: "2026-03-24", fee: "$20.00" },
      { id: 2, address: "789 Pine Road, Rockville, MD", status: "PENDING", date: "2026-03-25", fee: "$15.50" },
      { id: 3, address: "404 Cedar Ln, Bethesda, MD", status: "COMPLETED", date: "2026-03-20", fee: "$25.00" }
    ],
    chartData: [
      { name: 'Jan', earnings: 0 },
      { name: 'Feb', earnings: 150 },
      { name: 'Mar', earnings: 470 }
    ]
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // In production, fetch from backend here
  }, []);

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
            <span className="text-sm font-medium text-white shadow-sm">Jane Doe</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pt-8 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B2E83]">Welcome back, Jane</h1>
          <p className="text-[#6B7280] mt-1 text-lg">Here's your partner performance overview.</p>
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
              <span>+18% from last month</span>
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
                {referralLink}
              </div>
            </div>
            <button 
              onClick={copyToClipboard}
              className="mt-6 w-full py-3 bg-[#3EC7A6] hover:brightness-110 text-white transition-all rounded-xl font-bold flex items-center justify-center shadow-md shadow-[#3EC7A6]/30"
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} dx={-10} tickFormatter={(val) => `$${val}`} />
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
                  <span className="text-xl font-bold text-[#4B2E83]">14</span>
                </li>
                <li className="flex justify-between items-center p-4 bg-[#F4F5F7] rounded-xl border border-gray-100">
                  <div className="flex items-center text-[#2D2D2D] font-medium">
                    <CheckCircle className="w-5 h-5 mr-3 text-[#3EC7A6]" />
                    Completed Jobs
                  </div>
                  <span className="text-xl font-bold text-[#4B2E83]">9</span>
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F7] text-[#6B7280] text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Job Address</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Estimated Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {data.handoffs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                    <td className="p-4 pl-6 font-medium text-[#2D2D2D]">{job.address}</td>
                    <td className="p-4 text-[#6B7280]">{job.date}</td>
                    <td className="p-4">
                      {job.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#3EC7A6]/10 text-[#3EC7A6] border border-[#3EC7A6]/20">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right pr-6 font-bold text-[#4B2E83]">{job.fee}</td>
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
