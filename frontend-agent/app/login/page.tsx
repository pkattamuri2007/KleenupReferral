"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAgent, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await loginAgent(agentId.trim());
      saveToken(token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col">
      <div className="bg-[#4B2E83] px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center space-x-2">
          <span className="text-white font-extrabold text-2xl tracking-tight">KLEENUP</span>
          <span className="bg-[#3EC7A6] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Partner</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-[#4B2E83] mb-1">Partner Login</h1>
          <p className="text-[#6B7280] text-sm mb-6">Enter your Agent ID to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-1">Agent ID</label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="e.g. X-Jane123"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83]"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4B2E83] hover:bg-[#6C4EB6] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
