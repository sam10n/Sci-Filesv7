import React, { useState } from "react";
import { FileText } from "lucide-react";
import { APP_LOGO_URL } from "@/lib/brand";

// The Sci-Files logo. If the picture file is missing (or can't be loaded) a plain
// placeholder is shown instead of a broken image, at the same size.
export default function BrandLogo({ className = "", alt = "Sci-Files logo" }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600`}
      >
        <FileText className="w-1/2 h-1/2 text-white" />
      </div>
    );
  }
  return <img src={APP_LOGO_URL} alt={alt} className={className} onError={() => setFailed(true)} />;
}
