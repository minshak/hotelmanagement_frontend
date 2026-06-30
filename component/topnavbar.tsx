"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface Institution {
  id: number;
  name: string;
  code: string;
  address: string;
  logo: string | null;
  mobile: string;
  email: string;
  gstin: string | null;
  active: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor to safely attach the JWT bearer token
apiInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================ COMPONENTS ============================ */
export default function TopBar() {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const response = await apiInstance.get<Institution[]>("/account/institutions/");
        const data = response.data;
        
        if (data && data.length > 0) {
          setInstitution(data[0]);
        }
      } catch (error) {
        console.error("Error fetching institution details for TopBar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionData();
  }, []);

  // Determine backend base url to properly append the media logo path
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://127.0.0.1:8000";
  
  // Safely construct logo URL without double-slashes if the backend returns a relative path
  const logoSrc = institution?.logo 
    ? institution.logo.startsWith("http") 
      ? institution.logo 
      : `${baseUrl}${institution.logo}`
    : "";

  return (
    <div className="flex justify-between items-center w-full">
      <Search className="text-slate-400" />

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-5">
          
          {/* INSTITUTION LOGO CONTAINER */}
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center shrink-0">
            {!loading && institution?.logo ? (
              <img 
                src={logoSrc} 
                alt={`${institution.name} Logo`} 
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-xs text-slate-400 font-bold uppercase">
                {institution?.name ? institution.name.slice(0, 2) : "IN"}
              </div>
            )}
          </div>

          {/* INSTITUTION DETAILS */}
          <div className="text-right">
            {/* Dynamic Institution Name */}
            <h3 className="font-semibold text-white">
              {loading ? "Loading..." : institution?.name || "No Institution Profile"}
            </h3>
            {/* Dynamic GSTIN */}
            <p className="text-xs text-slate-400 mt-0.5">
              {!loading && institution?.gstin ? `GSTIN: ${institution.gstin}` : "No GSTIN Provided"}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}