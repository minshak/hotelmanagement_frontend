"use client";

import { useState, useEffect, useMemo } from "react";
import api from "../lib/api";
import { Bed, X, Check, Users, Search, AlertCircle } from "lucide-react";

interface Customer {
  id: number;
  customer_name: string;
  mobile_no: string;
  email?: string;
  address?: string;
}

interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
  rent: number;
}

interface CheckInRecord {
  id: number;

  customer_name?: string;
  mobile_no?: string;
  room_no?: string;

  checkin_date?: string;
  checkin_time?: string;

  pay_mode?: string;

  advance_amount?: number;
  pending_amount?: number;
}
export default function GuestCheckIn() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomTypeModal, setRoomTypeModal] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    checkInDate: new Date().toISOString().split("T")[0],
    checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
    advancePaid: 0,
    payMode: "CASH",
  });

  // Fetch Check-ins safely with structural fallbacks
  const fetchCheckins = async () => {
    try {
      const response = await api.get("/reservations/checkins/").catch(() => 
        api.get("/api/reservations/checkins/")
      );
      setCheckins(response.data || []);
    } catch (error) {
      console.error("Error fetching checkins:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setErrorMessage(null);
      
      // Fetch Customers with standard routing fallbacks
      try {
        const customerRes = await api.get("/api/master/customers/")
          .catch(() => api.get("/master/customers/"))
          .catch(() => api.get("/api/customers/"));
        setCustomers(customerRes.data || []);
      } catch (e) {
        console.error("Error fetching customers master:", e);
        setErrorMessage("Customers route missing or matching endpoint path layout broken on backend.");
      }

      // Fetch Rooms context
      try {
        const savedRooms = localStorage.getItem("hotel_management_rooms");
        if (savedRooms) {
          setRooms(JSON.parse(savedRooms));
        } else {
          const roomRes = await api.get("/api/master/room-types/")
            .catch(() => api.get("/master/rooms/"))
            .catch(() => api.get("/api/rooms/"));
          setRooms(roomRes.data || []);
        }
      } catch (roomErr) {
        console.error("Error reading room dataset:", roomErr);
      }

      await fetchCheckins();
    };

    fetchData();
  }, []);

  // Filtered customer list based on search term
  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) return [];
    return customers.filter(
      (c) =>
        c?.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c?.mobile_no?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Unique Room types extracted from available room pool
  const roomTypes = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    return Array.from(new Set(rooms.map((r) => r.type)));
  }, [rooms]);

  // Derived Values
  const roomRent = selectedRoom ? Number(selectedRoom.rent) : 0;
  const pendingAmount = roomRent - formData.advancePaid;

  const handleCompleteCheckIn = async () => {
    if (!selectedCustomer || !selectedRoom) {
      alert("Please select both a customer and a room.");
      return;
    }

    try {
      const payload = {
        customer: selectedCustomer.id,
        room: selectedRoom.id,
        checkin_date: formData.checkInDate,
        checkin_time: formData.checkInTime,
        advance_amount: formData.advancePaid,
        pending_amount: pendingAmount,
        pay_mode: formData.payMode,
      };

      await api.post("/reservations/checkins/", payload).catch(() => 
        api.post("/api/reservations/checkins/", payload)
      );
      
      alert("Check-in Successful!");
      
      setSelectedCustomer(null);
      setSelectedRoom(null);
      setFormData((prev) => ({
        ...prev,
        advancePaid: 0,
        checkInDate: new Date().toISOString().split("T")[0],
        checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      }));
      setCustomerSearch("");
      
      await fetchCheckins();
    } catch (error) {
      console.error("POST Submission Error:", error);
      alert("Failed to register dynamic checkin payload execution.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020b2d] p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Guest Check-In</h1>
        {errorMessage && (
          <div className="bg-red-900/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* COLUMN 1: INTERACTIVE CUSTOMER SEARCH & ROOM TYPE */}
        <div className="space-y-6">
          <div className="bg-[#0d1735] p-5 rounded-xl border border-blue-900 flex flex-col h-[380px]">
            <label className="text-xs text-gray-400 block mb-2 tracking-wider font-semibold">
              SELECT CUSTOMER & VIEW DETAILS
            </label>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or mobile number..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-slate-900 pl-10 pr-4 py-2.5 rounded text-white border border-slate-700 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg-[#0a1024] p-2 rounded border border-blue-950">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`p-3 rounded-lg cursor-pointer border transition text-sm flex justify-between items-center ${
                        isSelected
                          ? "bg-blue-600/30 border-blue-500"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white">{c.customer_name}</p>
                        <p className="text-xs text-gray-400">Mob: {c.mobile_no} | {c.email || "No Email"}</p>
                        {isSelected && (
                          <p className="text-[11px] text-gray-300 italic mt-1">Add: {c.address || "N/A"}</p>
                        )}
                      </div>
                      {isSelected && <Check className="text-blue-400 w-5 h-5 flex-shrink-0" />}
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm text-gray-500 pt-8">No matching customers found.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2 tracking-wider font-semibold">
              SELECT ROOM TYPE
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roomTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRoomTypeModal(type)}
                  className="bg-blue-900/20 hover:bg-blue-600/40 p-4 rounded-xl border border-blue-500/30 text-center transition"
                >
                  <Bed className="mx-auto mb-2 text-blue-400" />
                  <div className="font-bold">{type}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CHECKIN DETAILS & FINANCIALS */}
        <div className="bg-[#0b1224] p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-blue-400 border-b border-blue-950 pb-2">Check-in Execution List</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">GUEST NAME</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={selectedCustomer ? selectedCustomer.customer_name : ""}
                  className="w-full bg-slate-900/50 p-3 rounded text-sm border border-slate-800 text-gray-300 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">MOBILE NO</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={selectedCustomer ? selectedCustomer.mobile_no : ""}
                  className="w-full bg-slate-900/50 p-3 rounded text-sm border border-slate-800 text-gray-300 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">SELECTED ROOM NO</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={selectedRoom ? `Room ${selectedRoom.number}` : ""}
                  className="w-full bg-slate-900/50 p-3 rounded text-sm border border-slate-800 font-bold text-blue-400 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">ROOM RENT (₹)</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-filled"
                  value={selectedRoom ? selectedRoom.rent : ""}
                  className="w-full bg-slate-900/50 p-3 rounded text-sm border border-slate-800 text-emerald-400 font-semibold focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">CHECK-IN DATE</label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  className="w-full bg-slate-900 p-3 rounded text-sm border border-slate-800 text-white"
                  onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">CHECK-IN TIME</label>
                <input
                  type="time"
                  value={formData.checkInTime}
                  className="w-full bg-slate-900 p-3 rounded text-sm border border-slate-800 text-white"
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">ADVANCE AMOUNT PAID (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.advancePaid || ""}
                  className="w-full bg-slate-900 p-3 rounded text-sm border border-slate-700"
                  onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">PAYMENT MODE</label>
                <select
                  className="w-full bg-slate-900 p-3 rounded text-sm border border-slate-700 text-white"
                  value={formData.payMode}
                  onChange={(e) => setFormData({ ...formData, payMode: e.target.value })}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card/Net Banking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-950 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Remaining Pending Balance:</span>
              <span className={`text-xl font-bold ${pendingAmount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                ₹{pendingAmount.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCompleteCheckIn}
              disabled={!selectedCustomer || !selectedRoom}
              className="w-full bg-blue-600 py-3.5 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              COMPLETE CHECK-IN
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE CHECK-INS DASHBOARD */}
      <div className="mt-12 bg-[#0d1735] p-6 rounded-2xl border border-blue-900">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Users className="text-blue-400" /> Active Check-ins Dashboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
             <tr className="text-gray-400 text-xs uppercase border-b border-blue-900">
             <th className="pb-4">Guest</th>
             <th className="pb-4">Mobile</th>
             <th className="pb-4">Room No</th>
             <th className="pb-4">Check-In Info</th>
             <th className="pb-4">Advance Paid</th>
             <th className="pb-4">Pay Mode</th>
             <th className="pb-4">Pending Due</th>
         </tr>
         </thead>
         <tbody className="divide-y divide-blue-900/30 text-sm">
            {checkins.length > 0 ? (
            checkins.map((item) => (
        <tr key={item.id} className="hover:bg-blue-900/10">

        <td className="py-4 font-semibold">
                {item.customer_name}
        </td>

        <td className="py-4">
          {item.mobile_no}
        </td>

        <td className="py-4 text-blue-400 font-bold">
          Room {item.room_no}
        </td>

        <td className="py-4">
          {item.checkin_date} @ {item.checkin_time}
        </td>

        <td className="py-4 text-green-400 font-bold">
          ₹{item.advance_amount}
        </td>

        <td className="py-4">
          <span className="px-2 py-1 bg-slate-800 rounded text-xs">
            {item.pay_mode}
          </span>
        </td>

        <td className="py-4 text-red-400 font-bold">
          ₹{item.pending_amount}
        </td>

      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={7} className="py-8 text-center text-gray-500">
        No Active Check-ins
      </td>
    </tr>
  )}
</tbody>
          </table>
        </div>
      </div>

      {/* COMPACT ROOM SELECTION MODAL */}
      {roomTypeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0d1735] w-full max-w-sm rounded-2xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-blue-400">Available {roomTypeModal}</h2>
              <button onClick={() => setRoomTypeModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {rooms.filter((r) => r.type === roomTypeModal && r.status?.toLowerCase() === "available").length > 0 ? (
                rooms
                  .filter((r) => r.type === roomTypeModal && r.status?.toLowerCase() === "available")
                  .map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoom(r);
                        setRoomTypeModal(null);
                      }}
                      className="p-4 bg-slate-900 hover:bg-blue-600 rounded-xl border border-slate-800 text-center transition"
                    >
                      <div className="font-bold text-xl text-white">{r.number}</div>
                      <div className="text-xs text-emerald-400 mt-1">₹{r.rent}</div>
                    </button>
                  ))
              ) : (
                <div className="col-span-2 text-center text-sm text-gray-400 py-6">
                  No vacant rooms available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}