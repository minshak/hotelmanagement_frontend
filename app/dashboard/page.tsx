"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Calendar,
  Users,
  Bed,
  BarChart3,
  Bell,
  Search,
  Settings,
} from "lucide-react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const bookings = [
    {
      guest: "Ethan James",
      room: "Suite 402",
      checkIn: "Oct 24, 2024",
      status: "Checked In",
    },
    {
      guest: "Mason Harper",
      room: "King 715",
      checkIn: "Oct 25, 2024",
      status: "Reserved",
    },
    {
      guest: "Sophia Johnson",
      room: "Deluxe 205",
      checkIn: "Oct 26, 2024",
      status: "Pending",
    },
    {
      guest: "David Brown",
      room: "Grand 304",
      checkIn: "Oct 28, 2024",
      status: "Confirmed",
    },
  ];
  const router = useRouter();
  useEffect(() => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn !== "true") {
    router.replace("/");
  } else {
    setLoading(false);
  }
}, [router]);
const handleLogout = () => {
  localStorage.removeItem("isLoggedIn");
  router.push("/");
};
if (loading) {
  return null;
}
  return (
    <div className="min-h-screen bg-[#0B1020] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#12182D] border-r border-slate-800 flex flex-col p-5">
        <h1 className="text-2xl font-bold text-blue-400">
          ZenithHMS
        </h1>

        <div className="mt-10 space-y-3">
          <button className="flex items-center gap-3 w-full bg-blue-600 px-4 py-3 rounded-xl">
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl">
            <Calendar size={18} />
            Bookings
          </button>

          <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl">
            <Users size={18} />
            Guests
          </button>

          <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl">
            <Bed size={18} />
            Rooms
          </button>

          <button className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl">
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>

        <div className="mt-auto">
          <button className="w-full bg-white text-black py-3 rounded-xl font-semibold">
            + New Booking
          </button>

          <button className="flex items-center gap-2 mt-5 text-slate-400">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <Search className="text-slate-400" />
           <div className="flex flex-col items-end gap-3">
      <button onClick={handleLogout}
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
  >
    Logout
  </button>

  <div className="flex items-center gap-5">
    <Bell size={20} />

    <div className="text-right">
      <h3 className="font-semibold">Heba Johnson</h3>
      <p className="text-xs text-slate-400">
        General Manager
      </p>
    </div>
  </div>
</div>
</div>
        {/* Heading */}
        <h1 className="text-5xl font-bold mt-8">
          Morning, Heba.
        </h1>

        <p className="text-slate-400 mt-2">
          Your properties are performing
          <span className="text-blue-400 font-semibold">
            {" "}12% better{" "}
          </span>
          than last week.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mt-8">
          <div className="bg-[#161E35] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              TOTAL REVENUE
            </p>
            <h2 className="text-3xl font-bold mt-2">
              $124.5K
            </h2>
            <p className="text-green-400 text-sm">
              +18%
            </p>
          </div>

          <div className="bg-[#161E35] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              OCCUPANCY RATE
            </p>
            <h2 className="text-3xl font-bold mt-2">
              88%
            </h2>
            <p className="text-green-400 text-sm">
              +6%
            </p>
          </div>

          <div className="bg-[#161E35] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              AVG DAILY RATE
            </p>
            <h2 className="text-3xl font-bold mt-2">
              $245
            </h2>
          </div>

          <div className="bg-[#161E35] rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              RevPAR
            </p>
            <h2 className="text-3xl font-bold mt-2">
              $215
            </h2>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {/* Chart */}
          <div className="col-span-2 bg-[#161E35] rounded-2xl p-6">
            <div className="flex justify-between mb-6">
              <h2 className="font-bold text-lg">
                Property Performance
              </h2>

              <button className="bg-slate-700 px-4 py-2 rounded-lg text-sm">
                Last 30 Days
              </button>
            </div>

            <div className="flex items-end justify-between h-64 gap-2">
              {[80, 100, 120, 150, 130, 110, 170, 160, 145, 140, 155, 120, 105].map(
                (value, index) => (
                  <div
                    key={index}
                    className="bg-blue-400 rounded-t w-full"
                    style={{ height: `${value}px` }}
                  />
                )
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#161E35] rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-4">
              Quick Actions
            </h2>

            <div className="space-y-4">
              <div className="bg-[#202A45] p-4 rounded-xl">
                New Booking
              </div>

              <div className="bg-[#202A45] p-4 rounded-xl">
                Room Service
              </div>

              <div className="bg-[#202A45] p-4 rounded-xl">
                Maintenance
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {/* Recent Bookings */}
          <div className="col-span-2 bg-[#161E35] rounded-2xl p-6">
            <div className="flex justify-between">
              <h2 className="font-bold text-lg">
                Recent Bookings
              </h2>

              <button className="text-blue-400">
                View All
              </button>
            </div>

            <table className="w-full mt-5">
              <thead>
                <tr className="text-slate-400 text-left">
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check In</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-700"
                  >
                    <td className="py-4">
                      {booking.guest}
                    </td>

                    <td>{booking.room}</td>

                    <td>{booking.checkIn}</td>

                    <td>
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upcoming Arrivals */}
          <div className="bg-[#161E35] rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-4">
              Upcoming Arrivals
            </h2>

            <div className="space-y-4">
              <div className="bg-[#202A45] p-4 rounded-xl">
                <h3 className="font-semibold">
                  Lydia Thomas
                </h3>
                <p className="text-sm text-slate-400">
                  Room 501 • Today
                </p>
              </div>

              <div className="bg-[#202A45] p-4 rounded-xl">
                <h3 className="font-semibold">
                  James Wilson
                </h3>
                <p className="text-sm text-slate-400">
                  Room 215 • Tomorrow
                </p>
              </div>

              <div className="bg-[#202A45] p-4 rounded-xl">
                <h3 className="font-semibold">
                  Alice Chen
                </h3>
                <p className="text-sm text-slate-400">
                  Room 307 • Friday
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}