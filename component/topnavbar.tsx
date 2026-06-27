"use client";

import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopBar() {
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <div className="flex justify-between items-center">
      <Search className="text-slate-400" />

      <div className="flex flex-col items-end gap-3">
      

        <div className="flex items-center gap-5">
          <Bell size={20} />

          <div className="text-right">
            <h3 className="font-semibold">{username}</h3>
            <p className="text-xs text-slate-400">General Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}