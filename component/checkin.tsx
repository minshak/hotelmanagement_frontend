"use client";

import React, { useState, useEffect } from "react";
import api, {
  getCustomers,
  getRooms,
  getRoomTypes,
  getCheckIns,
  Customer,
  Room,
  RoomType,
} from "../lib/api"; // Adjust path dynamically based on your folder structure

export interface CheckIn {
  id: number;
  room: number;
  customer: number;

  customer_name?: string;
  mobile_no?: string;
  room_no?: string;

  checkin_date: string;
  checkin_time: string;

  // Aligned fields with backend models.py
  base_daily_rent: string;
  advance_paid: string;
  advance_amount: string;
  pending_amount: string;
  total_amount: string;

  pay_mode: "CASH" | "CARD" | "UPI" | "NET_BANKING";
  status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

  remarks?: string | null;
  created_at: string;
}

export default function GuestCheckInPage() {
  // Client-side Hydration Flag
  const [isMounted, setIsMounted] = useState(false);

  // States for API datasets
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [checkInsList, setCheckInsList] = useState<CheckIn[]>([]);

  // Search & Selector states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [availableRoomsFiltered, setAvailableRoomsFiltered] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Controlled Forms
  const [checkinDate, setCheckinDate] = useState("");
  const [checkinTime, setCheckinTime] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  // UX Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ensure execution occurs purely in the client layer
  useEffect(() => {
    setIsMounted(true);

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0]; 
    const formattedTime = now.toTimeString().split(" ")[0].substring(0, 5);
    setCheckinDate(formattedDate);
    setCheckinTime(formattedTime);
  }, []);

  // Safe data synchronization pipeline
  useEffect(() => {
    if (!isMounted) return;

    async function fetchData() {
      const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!token) {
        setError("Authentication credentials not found. Please log in first.");
        return;
      }

      try {
        const [custData, roomData, typeData, checkInData] = await Promise.all([
          getCustomers().catch(() => [] as Customer[]),
          getRooms().catch(() => [] as Room[]),
          getRoomTypes().catch(() => [] as RoomType[]),
          getCheckIns().catch(() => [] as CheckIn[]),
        ]);

        // Filter active check-ins to view on dashboard matching backend default filtering
        const activeCheckIns = checkInData.filter((item) => item.status === "CHECKED_IN");

        // Filter rooms layer: Rely exclusively on room status matching backend design rule
        const onlyAvailableRooms = roomData.filter((room) => room.status === "AVAILABLE");

        setCustomers(custData);
        setRooms(onlyAvailableRooms);
        setRoomTypes(typeData);
        setCheckInsList(activeCheckIns);
      } catch (err) {
        console.error("Critical error mapping API entities:", err);
        setError("Failed to synchronize component state with backend instances.");
      }
    }

    fetchData();
  }, [isMounted]);

  // Compute room filterings safely when Room Types shift
  useEffect(() => {
    if (selectedRoomType) {
      const filtered = rooms.filter(
        (room) => room.room_type === selectedRoomType.id && room.status === "AVAILABLE"
      );
      setAvailableRoomsFiltered(filtered);
      setSelectedRoomId(""); 
    } else {
      setAvailableRoomsFiltered([]);
    }
  }, [selectedRoomType, rooms]);

  // Dynamic Financial Mappings aligned with backend structure
  const roomRent = selectedRoomType ? parseFloat(selectedRoomType.rent) : 0;
  const pendingBalance = Math.max(0, roomRent - advanceAmount);

  const filteredCustomers = customers.filter(
    (cust) =>
      cust.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.mobile_no?.includes(searchTerm)
  );

  // Submit operations handler
  const handleCompleteCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCustomer || !selectedRoomId || !selectedRoomType) {
      setError("Please ensure valid Customer, Room Type, and Room configuration rules are met.");
      return;
    }

    setLoading(true);

    // Form payload properties matched completely with fields explicitly expected by CheckIn model
    const payload = {
      customer: selectedCustomer.id,
      room: parseInt(selectedRoomId),
      checkin_date: checkinDate,
      checkin_time: `${checkinTime}:00`, 
      base_daily_rent: roomRent.toFixed(2),
      advance_paid: advanceAmount.toFixed(2),     // Mirror backend naming flexibility
      advance_amount: advanceAmount.toFixed(2),   // Mirror backend naming flexibility
      pending_amount: pendingBalance.toFixed(2),
      total_amount: roomRent.toFixed(2),          // Base check-in calculation standard
      pay_mode: payMode,
      remarks: remarks || null,
      status: "CHECKED_IN"
    };

    try {
      await api.post("/reservations/checkins/", payload);

      // Refresh component dashboard arrays immediately
      const updatedCheckins = await getCheckIns();
      const rawRooms = await getRooms();
      
      const activeCheckIns = updatedCheckins.filter((item) => item.status === "CHECKED_IN");
      const updatedAvailableRooms = rawRooms.filter((room) => room.status === "AVAILABLE");

      setCheckInsList(activeCheckIns);
      setRooms(updatedAvailableRooms);

      // Flash forms reset
      setSelectedCustomer(null);
      setSelectedRoomType(null);
      setAdvanceAmount(0);
      setSearchTerm("");
      setRemarks("");
      alert("Guest Check-In registration updated successfully!");
    } catch (err: any) {
      const backendError = err.response?.data 
        ? JSON.stringify(err.response.data) 
        : "Failed to dispatch post payload mapping.";
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-slate-400">
        Syncing system instance context...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b19] text-white p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6">Guest Check-In</h1>

      {error && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-3 rounded-md mb-6 text-sm break-words">
          {error}
        </div>
      )}

      {/* Grid wrapper layout component */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left Interactive panel parameters */}
        <div className="space-y-6">
          
          {/* Box Module: Target Guest Search */}
          <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Select Customer & View Details
            </h2>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search by name or mobile number..."
                className="w-full bg-[#070b19] border border-slate-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredCustomers.slice(0, 5).map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    selectedCustomer?.id === cust.id
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-[#070b19] border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <p className="font-bold text-sm capitalize">{cust.customer_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mob: {cust.mobile_no} {cust.email ? `| ${cust.email}` : ""}
                  </p>
                </div>
              ))}
              {filteredCustomers.length === 0 && searchTerm && (
                <p className="text-xs text-slate-500 p-2">No matching customers found.</p>
              )}
            </div>
          </div>

          {/* Box Module: Structural Room Selection categorization rules */}
          <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">
              Select Room Type
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {roomTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedRoomType(type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                    selectedRoomType?.id === type.id
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-[#070b19] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-sm font-semibold capitalize">{type.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Active Dynamic execution Form configuration maps */}
        <form onSubmit={handleCompleteCheckIn} className="bg-[#0e162d] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-blue-500 font-semibold text-base mb-4">Check-in Execution List</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Guest Name</label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-filled"
                  value={selectedCustomer ? selectedCustomer.customer_name : ""}
                  className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 capitalize disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Mobile No</label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-filled"
                  value={selectedCustomer ? selectedCustomer.mobile_no : ""}
                  className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 disabled:opacity-70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Select Room No</label>
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  disabled={!selectedRoomType}
                  className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">{selectedRoomType ? "-- Select Room --" : "Choose room type first"}</option>
                  {availableRoomsFiltered.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_no}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Room Rent (₹)</label>
                <input
                  type="text"
                  disabled
                  placeholder="Auto-filled"
                  value={selectedRoomType ? `₹${selectedRoomType.rent}` : ""}
                  className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm font-medium text-emerald-400 disabled:opacity-70"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Check-In Date</label>
                <input
                  type="date"
                  value={checkinDate}
                  onChange={(e) => setCheckinDate(e.target.value)}
                  className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Check-In Time</label>
                <input
                  type="time"
                  value={checkinTime}
                  onChange={(e) => setCheckinTime(e.target.value)}
                  className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Advance Amount Paid (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={advanceAmount || ""}
                  onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add special instructions, requirements etc..."
                rows={2}
                className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-400">Remaining Pending Balance:</span>
              <span className="text-xl font-bold text-emerald-400">₹{pendingBalance.toFixed(2)}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors uppercase text-sm tracking-wider disabled:opacity-50"
            >
              {loading ? "Processing..." : "Complete Check-In"}
            </button>
          </div>
        </form>
      </div>

      {/* Active Dashboard Panel */}
      <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656 it.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-lg font-semibold">Active Check-ins Dashboard</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-[#070b19] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Room No</th>
                <th className="px-4 py-3">Check-In Info</th>
                <th className="px-4 py-3">Advance Paid</th>
                <th className="px-4 py-3">Pending Amount</th>
                <th className="px-4 py-3">Pay Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {checkInsList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold capitalize">{item.customer_name || `Customer ID: ${item.customer}`}</td>
                  <td className="px-4 py-3 text-slate-400">{item.mobile_no || "N/A"}</td>
                  <td className="px-4 py-3 text-blue-400 font-medium">Room {item.room_no || item.room}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {item.checkin_date} @ {item.checkin_time}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">₹{item.advance_amount || item.advance_paid}</td>
                  <td className="px-4 py-3 text-amber-500 font-medium">₹{item.pending_amount}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-800 text-xs text-slate-300 font-mono px-2 py-1 rounded border border-slate-700">
                      {item.pay_mode}
                    </span>
                  </td>
                </tr>
              ))}
              {checkInsList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500">
                    No active system check-in instances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}