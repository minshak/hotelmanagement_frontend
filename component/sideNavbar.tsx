"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bed,
  BarChart3,
  UserCircle,
  LogIn,
  LogOut,
} from "lucide-react";

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${isActive
        ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`;
  };

  const handleLogout = () => {
    // 1. Clear session indicators from storage
    localStorage.removeItem("isLoggedIn");

    // 2. Clear any other session tokens you might be using later
    // localStorage.clear(); 

    // 3. Kick the user back to the entry login screen
    router.push("/");
  };

  return (
    <aside className="w-72 min-h-screen bg-[#12182D] border-r border-slate-800 flex flex-col p-5 justify-between">
      {/* Top Navigation Links */}
      <div>
        <h1 className="text-2xl font-bold text-blue-400 mb-10">ZenithHMS</h1>
        <div className="space-y-3">
          <Link href="/dashboard" className={getLinkClass("/dashboard")}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link href="/bookings" className={getLinkClass("/bookings")}>
            <Calendar size={18} />
            Bookings
          </Link>

          <Link href="/customers" className={getLinkClass("/customers")}>
            <UserCircle size={18} />
            Customers
          </Link>

          <Link href="/room-types" className={getLinkClass("/room-types")}>
            <Users size={18} />
            Room Types
          </Link>

          <Link href="/rooms" className={getLinkClass("/rooms")}>
            <Bed size={18} />
            Rooms
          </Link>

          <Link href="/checkin" className={getLinkClass("/checkin")}>
            <LogIn size={18} />
            Check In
          </Link>

          <Link href="/checkout" className={getLinkClass("/checkout")}>
            <LogOut size={18} />
            Check Out
          </Link>

          <Link href="/analytics" className={getLinkClass("/analytics")}>
            <BarChart3 size={18} />
            Analytics
          </Link>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 font-medium"
        >
          <LogOut size={18} />
          Logout System
        </button>
      </div>
    </aside>
  );
}