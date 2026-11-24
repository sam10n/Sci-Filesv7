const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SchoolBrandPanel from "@/components/auth/SchoolBrandPanel";
import BrandLogo from "@/components/BrandLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await db.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-2">
      <SchoolBrandPanel />

      <div className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm mx-auto">
          {/* Compact branding for small screens */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <BrandLogo className="w-14 h-14 rounded-2xl object-cover shrink-0" />
            <div className="min-w-0">
              <p className="font-heading font-bold text-slate-900 leading-tight text-lg">
                Sci-Files
              </p>
              <p className="text-xs text-slate-500 mt-0.5">School Records Management System</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to manage your school records</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="login-password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Sign In
              </Button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}