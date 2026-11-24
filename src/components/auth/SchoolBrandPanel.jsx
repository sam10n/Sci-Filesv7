const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Hash, MapPin, Mail, UserRound, Globe } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

// Put the files in public/brand/ (see public/brand/README.txt).
export const SCHOOL_LOGO_URL = "/brand/bcnshs-logo.png";

const CLASSROOM_BG_URL = "/brand/classroom-bg.png";

const details = [
  { icon: Hash, label: "School ID", value: "305619" },
  { icon: UserRound, label: "Principal / OIC", value: "Catherine L. Jongco" },
  { icon: MapPin, label: "Address", value: "Jose Basa St., Barangay Bagumbayan, Balanga City, Bataan" },
  { icon: Mail, label: "Email", value: "bcnshs@deped.gov.ph" },
  { icon: Globe, label: "Facebook", value: "Balanga City National Science High School Official Facebook" },
];

export default function SchoolBrandPanel() {
  return (
    <div className="relative hidden md:flex flex-col justify-center overflow-hidden p-8 lg:p-14 text-white bg-[#020622]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${CLASSROOM_BG_URL})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,13,58,0.84)_0%,rgba(2,6,34,0.94)_55%,rgba(0,1,21,0.98)_100%)]" />

      <div className="relative flex flex-col items-center text-center">
        <BrandLogo className="w-28 h-28 object-contain rounded-3xl" />
        <h1 className="mt-6 font-heading text-3xl lg:text-4xl font-bold tracking-tight text-white">
          Sci-Files
        </h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/50">
          School Records Management System
        </p>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/65">
          Sci-Files is a web-based School Records Management System designed for the administrative staff of
          Balanga City National Science High School.
        </p>
      </div>

      <div className="relative mt-10 mx-auto w-full max-w-md space-y-3">
        {details.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <item.icon className="w-4 h-4 text-white/70" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-white/35">{item.label}</p>
              <p className="text-sm text-white/85 leading-snug">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="relative mt-10 text-center text-xs text-white/30">
        Established via Republic Act No. 11020
      </p>
    </div>
  );
}