"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRooms, getCheckIns, getCustomers } from "@/lib/api";
import { Wifi, WifiOff } from "lucide-react";
import SideBar from "@/component/sideNavbar";
import TopBar from "@/component/topnavbar";

interface DashboardBooking {
  guest: string;
  room: string;
  checkIn: string;
  status: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  // User Profile State
  const [userName, setUserName] = useState("Guest");

  // Stats State
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [occupiedRooms, setOccupiedRooms] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);

  // Authentication check & Fetch User Data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedUser = localStorage.getItem("user");

    if (isLoggedIn !== "true") {
      router.replace("/");
    } else {
      // Parse the user object and extract the name safely
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Build the name dynamically from first_name and last_name matching your API response structure
          if (parsedUser) {
            const firstName = parsedUser.first_name || "";
            const lastName = parsedUser.last_name || "";
            const fullName = `${firstName} ${lastName}`.trim();
            
            // Fallback to username if names aren't filled out, otherwise default to "User"
            setUserName(fullName || parsedUser.username || "User");
          }
        } catch (error) {
          console.error("Error parsing user data from localStorage", error);
        }
      }
      Promise.resolve().then(() => setAuthLoading(false));
    }
  }, [router]);

  // Fetch data and calculate stats
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [roomsList, checkinsList, customersList] = await Promise.all([
        getRooms(),
        getCheckIns(),
        getCustomers()
      ]);

      setIsOffline(false);

      // 1. Calculate Recent Bookings
      const roomMap = new Map<number, string>();
      roomsList.forEach(r => roomMap.set(r.id, r.room_no));

      const customerMap = new Map<number, string>();
      customersList.forEach(c => customerMap.set(c.id, c.customer_name));

      const formattedBookings: DashboardBooking[] = checkinsList.map(ci => {
        let dateStr = ci.checkin_date;
        try {
          const parts = ci.checkin_date.split("-");
          if (parts.length === 3) {
            const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          }
        } catch {
          // keep original if parsing fails
        }

        let statusText = "Checked In";
        if (ci.status === "CHECKED_OUT") statusText = "Checked Out";
        if (ci.status === "CANCELLED") statusText = "Cancelled";

        return {
          guest: customerMap.get(ci.customer) || `Guest #${ci.customer}`,
          room: roomMap.get(ci.room) ? `Room ${roomMap.get(ci.room)}` : `Room #${ci.room}`,
          checkIn: dateStr,
          status: statusText
        };
      });

      setBookings(formattedBookings.slice(0, 5));

      // 2. Calculate Room Stats
      const totalRoomsCount = roomsList.length;
      const occupiedRoomsCount = roomsList.filter(r => r.status === "OCCUPIED").length;
      const availableRoomsCount = totalRoomsCount - occupiedRoomsCount;
      
      setTotalRooms(totalRoomsCount);
      setOccupiedRooms(occupiedRoomsCount);
      setAvailableRooms(availableRoomsCount);

      // 3. Total Customers
      setTotalCustomers(customersList.length);

    } catch (error) {
      console.warn("Backend API is offline. Loading mock dashboard data.", error);
      setIsOffline(true);

      setBookings([
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
      ]);
      setTotalRooms(24);
      setAvailableRooms(6);
      setOccupiedRooms(18);
      setTotalCustomers(45);
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      Promise.resolve().then(() => loadDashboardData());
    }
  }, [authLoading]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 font-semibold">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1020] text-white min-h-screen">
      <main className="flex-1 p-8 overflow-y-auto">
        <TopBar />
        
        {/* Heading & Status indicator */}
        <div className="flex justify-between items-center mt-8">
          <div>
            {/* DYNAMIC WELCOME GREETING */}
            <h1 className="text-5xl font-bold">Welcome, {userName}.</h1>
          </div>

          <div>
            {isOffline ? (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <WifiOff size={14} /> DEMO MODE
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <Wifi size={14} /> SYSTEM OPERATIONAL
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition duration-300">
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Total Rooms</p>
            <h2 className="text-3xl font-bold mt-2 text-white">{totalRooms}</h2>
            <p className="text-blue-400 text-sm mt-1 font-medium">Hotel Capacity</p>
          </div>

          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition duration-300">
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Available Rooms</p>
            <h2 className="text-3xl font-bold mt-2 text-white">{availableRooms}</h2>
            <p className="text-green-400 text-sm mt-1 font-medium">Ready for check-in</p>
          </div>

          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition duration-300">
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Occupied Rooms</p>
            <h2 className="text-3xl font-bold mt-2 text-white">{occupiedRooms}</h2>
            <p className="text-amber-400 text-sm mt-1 font-medium">Currently filled</p>
          </div>

          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition duration-300">
            <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Total Customers</p>
            <h2 className="text-3xl font-bold mt-2 text-white">{totalCustomers}</h2>
            <p className="text-purple-400 text-sm mt-1 font-medium">Registered Guests</p>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-[#161E35] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Property Performance</h2>
              <button className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2 rounded-lg text-sm border border-white/5 transition-colors">
                Last 30 Days
              </button>
            </div>

            <div className="flex items-end justify-between h-64 gap-2">
              {[
                80, 100, 120, 150, 130, 110, 170, 160, 145, 140, 155, 120, 105,
              ].map((value, index) => (
                <div
                  key={index}
                  className="bg-blue-500 rounded-t w-full hover:bg-blue-400 transition-colors"
                  style={{ height: `${value}px` }}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-lg mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <button className="w-full bg-[#202A45] hover:bg-[#2d3a5e] p-4 rounded-xl text-left font-medium transition duration-200 border border-white/5 flex items-center justify-between">
                  <span>New Booking</span>
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Launch</span>
                </button>

                <button className="w-full bg-[#202A45] hover:bg-[#2d3a5e] p-4 rounded-xl text-left font-medium transition duration-200 border border-white/5 flex items-center justify-between">
                  <span>Room Service</span>
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Order</span>
                </button>

                <button className="w-full bg-[#202A45] hover:bg-[#2d3a5e] p-4 rounded-xl text-left font-medium transition duration-200 border border-white/5 flex items-center justify-between">
                  <span>Maintenance</span>
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Ticket</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              OPERATIONAL LOGS SECURE
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-[#161E35] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-lg">Recent Bookings</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">View All</button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No active bookings registered.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full mt-2 text-left">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3">Guest</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Check In</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.map((booking, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 font-medium text-slate-200">{booking.guest}</td>
                        <td className="py-3.5 text-slate-300">{booking.room}</td>
                        <td className="py-3.5 text-slate-400 text-sm">{booking.checkIn}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${booking.status.toLowerCase().includes("in")
                            ? "bg-green-500/20 text-green-400"
                            : booking.status.toLowerCase().includes("out")
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-500/20 text-slate-400"
                            }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Arrivals */}
          <div className="bg-[#161E35] border border-white/5 rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-4">Upcoming Arrivals</h2>

            <div className="space-y-4">
              <div className="bg-[#202A45] border border-white/5 p-4 rounded-xl hover:border-blue-500/20 transition-all">
                <h3 className="font-semibold text-slate-200">Lydia Thomas</h3>
                <p className="text-sm text-slate-400 mt-1">Room 501 • Today</p>
              </div>

              <div className="bg-[#202A45] border border-white/5 p-4 rounded-xl hover:border-blue-500/20 transition-all">
                <h3 className="font-semibold text-slate-200">James Wilson</h3>
                <p className="text-sm text-slate-400 mt-1">Room 215 • Tomorrow</p>
              </div>

              <div className="bg-[#202A45] border border-white/5 p-4 rounded-xl hover:border-blue-500/20 transition-all">
                <h3 className="font-semibold text-slate-200">Alice Chen</h3>
                <p className="text-sm text-slate-400 mt-1">Room 307 • Friday</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}