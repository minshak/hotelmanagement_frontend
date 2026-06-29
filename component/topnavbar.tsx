"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface UserProfile {
  id: number;
  name: string;
  code: string;
  email: string;
  mobile: string;
  gstin: string;
  logo: string;
  is_superuser: boolean;
  is_staff: boolean;
  active: boolean;
}

export default function TopBar() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
      }
    }
  }, []);

  // Determine backend base url to properly append the media logo path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://127.0.0.1:8000";
  const logoSrc = user?.logo ? `${baseUrl}${user.logo}` : "";

  return (
    <div className="flex justify-between items-center w-full">
      <Search className="text-slate-400" />

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-5">
          
          {/* USER LOGO CONTAINER (Replaced Bell Icon) */}
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center shrink-0">
            {user?.logo ? (
              <img 
                src={logoSrc} 
                alt="User Logo" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback fallback if the URL string points to an invalid local asset
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-xs text-slate-400 font-bold uppercase">
                {user?.name ? user.name.slice(0, 2) : "US"}
              </div>
            )}
          </div>

          {/* USER DETAILS */}
          <div className="text-right">
            {/* Dynamic Username */}
            <h3 className="font-semibold text-white">{user?.name || "User"}</h3>
            {/* Dynamic GSTIN instead of General Manager */}
            <p className="text-xs text-slate-400 mt-0.5">
              {user?.gstin ? `GSTIN: ${user.gstin}` : "No GSTIN Provided"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}