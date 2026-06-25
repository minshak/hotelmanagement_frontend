"use client";

import { useState, useEffect, useMemo } from "react";
import api from "../lib/api";
import { Users, Receipt, Calendar, Clock, CreditCard, ChevronLeft } from "lucide-react";

interface CheckInRecord {
  id: number;
  customer_name?: string;
  mobile_no?: string;
  room_no?: string;
  checkin_date?: string; // Format: YYYY-MM-DD
  checkin_time?: string; // Format: HH:MM
  advance_amount?: number;
  pay_mode?: string;
}

// Updated Room interface to mirror your Room management architecture perfectly
interface Room {
  id: number;
  number: string;
  type: string;
  ac: boolean;
  rent: number;
  status: 'available' | 'occupied' | 'maintenance';
}

export default function GuestCheckout() {
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null);

  // Checkout Form State
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [checkoutTime, setCheckoutTime] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [payMode, setPayMode] = useState("CASH");
  const [reference, setReference] = useState("");

  // Synchronized Data Fetching pipeline
  const fetchInitialData = async () => {
    try {
      const checkinRes = await api.get("/reservations/checkins/").catch(() => 
        api.get("/api/reservations/checkins/")
      );
      setCheckins(checkinRes.data || []);

      // Critical sync point: Prioritize fetching real-time values updated on your rooms engine dashboard
      const savedRooms = localStorage.getItem("hotel_management_rooms");
      if (savedRooms) {
        setRooms(JSON.parse(savedRooms));
      } else {
        const roomRes = await api.get("/api/master/room-types/").catch(() => api.get("/api/rooms/"));
        setRooms(roomRes.data || []);
      }
    } catch (error) {
      console.error("Error standardizing dashboard ingestion:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sort Checkins by Room Number Alpha-Numerically
  const sortedCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => {
      const roomA = a.room_no || "";
      const roomB = b.room_no || "";
      return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [checkins]);

  // Handle clicking "Checkout" on a record
  const handleOpenCheckout = (record: CheckInRecord) => {
    setSelectedRecord(record);
    setAdvancePaid(Number(record.advance_amount) || 0);
    setCheckoutDate(new Date().toISOString().split("T")[0]);
    setCheckoutTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    setPayMode(record.pay_mode || "CASH");
    setReference("");
  };

  // Find Room daily rent dynamically matched against custom inputs from Rooms view
  const currentRoomRent = useMemo(() => {
    if (!selectedRecord) return 0;
    // Cross-evaluates strings explicitly to counter typing issues ('1001' vs 1001)
    const matchedRoom = rooms.find(r => String(r.number) === String(selectedRecord.room_no));
    return matchedRoom ? Number(matchedRoom.rent) : 0;
  }, [selectedRecord, rooms]);

  // Comprehensive 22-Hour Grace Period Calculations 
  const billingCalculations = useMemo(() => {
    if (!selectedRecord || !selectedRecord.checkin_date || !selectedRecord.checkin_time) {
      return { totalDays: 0, totalAmount: 0, balanceAmount: 0 };
    }

    // Parse Check-In and Checkout dates into native JavaScript Date Objects
    const checkInDateTime = new Date(`${selectedRecord.checkin_date}T${selectedRecord.checkin_time}`);
    const checkOutDateTime = new Date(`${checkoutDate}T${checkoutTime}`);

    // Diff in milliseconds
    const diffInMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
    
    if (diffInMs <= 0) {
      return { totalDays: 1, totalAmount: currentRoomRent, balanceAmount: currentRoomRent - advancePaid };
    }

    const diffInHours = diffInMs / (1000 * 60 * 60);
    const wholeDays = Math.floor(diffInHours / 24);
    const remainingHours = diffInHours % 24;

    // Core rule: If remaining hour components cross >= 22 hours, register an extra day cycle.
    let calculatedDays = wholeDays;
    if (wholeDays === 0 || remainingHours >= 22) {
      calculatedDays += 1;
    }

    const totalAmount = calculatedDays * currentRoomRent;
    const balanceAmount = totalAmount - advancePaid;

    return {
      totalDays: calculatedDays,
      totalAmount,
      balanceAmount
    };
  }, [selectedRecord, checkoutDate, checkoutTime, currentRoomRent, advancePaid]);

  // Handle Form Submission
  const handleSaveCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const payload = {
        checkin_id: selectedRecord.id,
        room_no: selectedRecord.room_no,
        customer_name: selectedRecord.customer_name,
        checkout_date: checkoutDate,
        checkout_time: checkoutTime,
        total_days: billingCalculations.totalDays,
        total_amount: billingCalculations.totalAmount,
        advance_paid: advancePaid,
        balance_amount: billingCalculations.balanceAmount,
        pay_mode: payMode,
        reference: reference
      };

      // Perform POST request to processing endpoint
      await api.post("/reservations/checkouts/", payload).catch(() =>
        api.post("/api/reservations/checkouts/", payload)
      );

      alert("Checkout record saved successfully!");
      setSelectedRecord(null);
      await fetchInitialData(); // Refresh active view
    } catch (err) {
      console.error("Checkout validation failure:", err);
      alert("Failed to submit checkout pipeline logs to system database.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020b2d] p-8 text-white">
      {!selectedRecord ? (
        /* SCREEN A: ACTIVE CHECK-INS DASHBOARD (SORTED BY ROOM NO) */
        <div className="max-w-6xl mx-auto bg-[#0d1735] p-6 rounded-2xl border border-blue-900">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-400">
            <Users /> Active Guest Profiles (Sorted by Room No)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-xs uppercase border-b border-blue-900 bg-slate-900/40">
                  <th className="p-4">Room No</th>
                  <th className="p-4">Guest Name</th>
                  <th className="p-4">Mobile No</th>
                  <th className="p-4">Check-In Date/Time</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 text-sm">
                {sortedCheckins.length > 0 ? (
                  sortedCheckins.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-900/20 transition-colors">
                      <td className="p-4 text-blue-400 font-bold text-lg">
                        Room {item.room_no}
                      </td>
                      <td className="p-4 font-semibold">{item.customer_name}</td>
                      <td className="p-4 tracking-wider text-gray-300">{item.mobile_no}</td>
                      <td className="p-4 text-slate-300">
                        {item.checkin_date} @ {item.checkin_time}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenCheckout(item)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-950"
                        >
                          CHECKOUT
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 text-base">
                      No active check-ins currently logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SCREEN B: ADD CHECKOUT SCREEN */
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => setSelectedRecord(null)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft size={16} /> Back to dashboard list
          </button>

          <form onSubmit={handleSaveCheckout} className="space-y-6">
            {/* 1. Header Metadata Panel */}
            <div className="bg-gradient-to-r from-[#0a153a] to-[#060f2b] p-6 rounded-2xl border border-blue-500/30 shadow-xl">
              <h3 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                <Receipt size={14} /> Registered Check-in Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">ROOM NUMBER</span>
                  <span className="text-xl font-extrabold text-blue-300">Room {selectedRecord.room_no}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">GUEST NAME</span>
                  <span className="font-semibold text-white text-base">{selectedRecord.customer_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">MOBILE NUMBER</span>
                  <span className="font-mono text-gray-200 tracking-wider">{selectedRecord.mobile_no}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">CHECK-IN DATE</span>
                  <span className="text-gray-200">{selectedRecord.checkin_date}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">CHECK-IN TIME</span>
                  <span className="text-gray-200">{selectedRecord.checkin_time}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs mb-0.5">BASE DAILY RENT</span>
                  <span className="text-emerald-400 font-bold">₹{currentRoomRent.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 2. Transaction Interactive Form Details */}
            <div className="bg-[#07102a] p-6 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">Checkout Operations</h3>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5"><Calendar size={12} className="inline mr-1" /> CHECKOUT DATE</label>
                  <input
                    type="date"
                    required
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5"><Clock size={12} className="inline mr-1" /> CHECKOUT TIME</label>
                  <input
                    type="time"
                    required
                    value={checkoutTime}
                    onChange={(e) => setCheckoutTime(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">TOTAL BILLABLE DAYS</label>
                  <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-bold text-yellow-400 text-sm">
                    {billingCalculations.totalDays} Day(s) 
                    <span className="text-[10px] text-gray-500 font-normal block">(&gt;22 hours updates cycle)</span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-emerald-400 block mb-1.5">TOTAL AMOUNT (₹)</label>
                  <div className="w-full bg-slate-900 p-3 rounded-xl font-mono font-bold text-emerald-400 border border-emerald-500/20 text-base">
                    ₹{billingCalculations.totalAmount.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-blue-400 block mb-1.5">ADVANCE PAID (EDITABLE)</label>
                  <input
                    type="number"
                    value={advancePaid || ""}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-blue-500/30 text-white font-mono font-bold"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs text-red-400 block mb-1.5">BALANCE PAYABLE DUE (₹)</label>
                  <div className={`w-full p-3 rounded-xl font-mono font-bold text-base border bg-slate-900 ${
                    billingCalculations.balanceAmount >= 0 ? "text-red-400 border-red-500/20" : "text-purple-400 border-purple-500/20"
                  }`}>
                    ₹{billingCalculations.balanceAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5"><CreditCard size={12} className="inline mr-1" /> PAYMODE</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">REFERENCE (TXN ID / NOTES)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref Number or Check ID logs"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-6 py-3 rounded-xl transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition text-sm shadow-lg shadow-blue-950"
              >
                SAVE CHECKOUT
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}