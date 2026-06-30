"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getCustomers,
  getRooms,
  getRoomTypes,
  getCheckIns,
  createCheckIn,
  Customer,
  Room,
  RoomType,
  CheckIn,
} from "../lib/api";

import { api } from "../lib/api";
import { FileSpreadsheet } from "lucide-react";

export default function GuestCheckInPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Structural arrays state hooks
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [checkInsList, setCheckInsList] = useState<CheckIn[]>([]);

  // Search, Filters & Selections hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [availableRoomsFiltered, setAvailableRoomsFiltered] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Date Range Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Input bindings
  const [checkinDate, setCheckinDate] = useState("");
  const [checkinTime, setCheckinTime] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<"CASH" | "CARD" | "UPI" | "NET_BANKING">("CASH");
  const [remarks, setRemarks] = useState("");

  // UI state hooks
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setCheckinDate(now.toISOString().split("T")[0]);
    setCheckinTime(now.toTimeString().split(" ")[0].substring(0, 5));
  }, []);

  // Sync state loop pipeline
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

        setCustomers(custData);
        setRooms(roomData.filter((room) => room.status === "AVAILABLE"));
        setRoomTypes(typeData);
        setCheckInsList(checkInData.filter((item) => item.status === "CHECKED_IN"));
      } catch (err) {
        console.error("Critical synchronization error:", err);
        setError("Failed to synchronize layout instances with backend.");
      }
    }

    fetchData();
  }, [isMounted]);

  // Adjust options lists if room categories transform
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

  const roomRent = selectedRoomType ? parseFloat(selectedRoomType.rent) : 0;
  const pendingBalance = Math.max(0, roomRent - advanceAmount);

  const filteredCustomers = customers.filter(
    (cust) =>
      cust.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.mobile_no?.includes(searchTerm)
  );

  // Dynamic filter for active check-ins based on date selection
  const filteredCheckIns = useMemo(() => {
    return checkInsList.filter((record) => {
      if (!record.checkin_date) return true;

      const recordDate = new Date(record.checkin_date);
      recordDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (recordDate > end) return false;
      }

      return true;
    });
  }, [checkInsList, startDate, endDate]);

  // Client-side Excel / CSV engine handler 
  const handleExportToExcel = () => {
    if (filteredCheckIns.length === 0) {
      alert("No sorted check-in report data available to export.");
      return;
    }

    const headers = ["Guest Name", "Mobile No", "Room No", "Check-In Date", "Check-In Time", "Advance Paid (INR)", "Pending Amount (INR)", "Payment Mode"];

    const rows = filteredCheckIns.map((item) => {
      const name = item.customer_name || `ID: ${item.customer}`;
      const mobile = item.mobile_no || "N/A";
      const roomNo = item.room_no || item.room;

      return [
        `"${name}"`,
        `"${mobile}"`,
        `"Room ${roomNo}"`,
        `"${item.checkin_date}"`,
        `"${item.checkin_time}"`,
        Number(item.advance_amount).toFixed(2),
        Number(item.pending_amount).toFixed(2),
        `"${item.pay_mode}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `CheckIn_Report_${startDate || "Start"}_to_${endDate || "End"}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  };

  // Authenticated binary file engine handler via Axios instance
  const handleDownloadReceipt = async (checkinId: string | number) => {
    try {
      const response = await api.get(`/reservations/checkins/${checkinId}/download-receipt/`, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `CheckIn_Receipt_ARR-${String(checkinId).padStart(6, '0')}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Could not process receipt stream data down to client desktop file wrapper.");
    }
  };

  const handleCompleteCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedCustomer || !selectedRoomId || !selectedRoomType) {
      setError("Please ensure valid Customer, Room Type, and Room parameters are configured.");
      return;
    }

    loading || setLoading(true);

    const payload = {
      customer: selectedCustomer.id,
      room: parseInt(selectedRoomId),
      checkin_date: checkinDate,
      checkin_time: `${checkinTime}:00`,
      base_daily_rent: roomRent.toFixed(2),
      advance_amount: advanceAmount.toFixed(2),
      pending_amount: pendingBalance.toFixed(2),
      total_amount: roomRent.toFixed(2),
      pay_mode: payMode,
      remarks: remarks || null,
      status: "CHECKED_IN" as const

    };

    try {
      const res = await createCheckIn(payload);
      const newlyCreatedId = res?.id;

      const updatedCheckins = await getCheckIns();
      const rawRooms = await getRooms();

      setCheckInsList(updatedCheckins.filter((item) => item.status === "CHECKED_IN"));
      setRooms(rawRooms.filter((room) => room.status === "AVAILABLE"));

      // Complete reset of forms and selections
      setSelectedCustomer(null);
      setSelectedRoomType(null);
      setSelectedRoomId("");
      setAdvanceAmount(0);
      setSearchTerm("");
      setRemarks("");

      if (newlyCreatedId && confirm("Guest check-in complete! Download printable receipt now?")) {
        await handleDownloadReceipt(newlyCreatedId);
      } else {
        alert("Guest registered successfully!");
      }
    } catch (err: any) {
      console.error("Check-in registration failure details:", err);
      setError(
        err.response?.data
          ? typeof err.response.data === "object"
            ? JSON.stringify(err.response.data)
            : err.response.data
          : "Failed to record transaction."
      );
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Selection Columns Panel */}
        <div className="space-y-6">
          <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Select Customer & View Details
            </h2>
            <input
              type="text"
              placeholder="Search by name or mobile number..."
              className="w-full bg-[#070b19] border border-slate-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {filteredCustomers.slice(0, 5).map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className={`p-3 rounded border transition-all cursor-pointer ${selectedCustomer?.id === cust.id ? "bg-blue-600/20 border-blue-500" : "bg-[#070b19] border-slate-800/80 hover:border-slate-700"
                    }`}
                >
                  <p className="font-bold text-sm capitalize">{cust.customer_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Mob: {cust.mobile_no}</p>
                </div>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-slate-500 text-xs py-2 text-center">No matching records found.</p>
              )}
            </div>
          </div>

          <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">Select Room Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {roomTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedRoomType(type)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${selectedRoomType?.id === type.id ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-[#070b19] border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                >
                  <span className="text-sm font-semibold capitalize">{type.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Transaction Input forms */}
        <form onSubmit={handleCompleteCheckIn} className="bg-[#0e162d] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-blue-500 font-semibold text-base mb-4">Check-in Execution List</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Guest Name</label>
                <input type="text" disabled placeholder="Auto-filled" value={selectedCustomer ? selectedCustomer.customer_name : ""} className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 capitalize disabled:opacity-70" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Mobile No</label>
                <input type="text" disabled placeholder="Auto-filled" value={selectedCustomer ? selectedCustomer.mobile_no : ""} className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 disabled:opacity-70" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Select Room No</label>
                <select required value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} disabled={!selectedRoomType} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">{selectedRoomType ? "-- Select Room --" : "Choose room type first"}</option>
                  {availableRoomsFiltered.map((room) => (
                    <option key={room.id} value={room.id}>Room {room.room_no}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Room Rent (₹)</label>
                <input type="text" disabled value={selectedRoomType ? `₹${selectedRoomType.rent}` : ""} className="w-full bg-[#070b19] border border-slate-800 rounded px-3 py-2 text-sm font-medium text-emerald-400 disabled:opacity-70" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Check-In Date</label>
                <input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Check-In Time</label>
                <input type="time" value={checkinTime} onChange={(e) => setCheckinTime(e.target.value)} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Advance Paid (₹)</label>
                <input type="number" step="0.01" value={advanceAmount || ""} onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Payment Mode</label>
                <select value={payMode} onChange={(e) => setPayMode(e.target.value as "CASH" | "CARD" | "UPI" | "NET_BANKING")} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add special instructions..." rows={2} className="w-full bg-[#070b19] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none resize-none" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-400">Remaining Pending Balance:</span>
              <span className="text-xl font-bold text-emerald-400">₹{pendingBalance.toFixed(2)}</span>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors uppercase text-sm tracking-wider disabled:opacity-50">
              {loading ? "Processing..." : "Complete Check-In"}
            </button>
          </div>
        </form>
      </div>

      {/* Active Check-ins Live Database Panel Grid Table */}
      <div className="bg-[#0e162d] border border-slate-800 rounded-lg p-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold">Active Check-ins Dashboard</h2>

          {/* DATE FILTER CONTROLS & EXCEL BUTTON BAR */}
          <div className="flex flex-wrap items-center gap-3 bg-[#070b19]/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 uppercase font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#070b19] border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 uppercase font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#070b19] border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg text-gray-400 hover:text-white transition"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleExportToExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ml-auto md:ml-2 shadow-md"
            >
              <FileSpreadsheet size={14} /> EXPORT EXCEL
            </button>
          </div>
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCheckIns.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold capitalize">{item.customer_name || `ID: ${item.customer}`}</td>
                  <td className="px-4 py-3 text-slate-400">{item.mobile_no || "N/A"}</td>
                  <td className="px-4 py-3 text-blue-400 font-medium">Room {item.room_no || item.room}</td>
                  <td className="px-4 py-3 text-slate-400">{item.checkin_date} @ {item.checkin_time}</td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">₹{item.advance_amount}</td>
                  <td className="px-4 py-3 text-amber-500 font-medium">₹{item.pending_amount}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-800 text-xs text-slate-300 font-mono px-2 py-1 rounded border border-slate-700">
                      {item.pay_mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(item.id)}
                      className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded border border-blue-500/30 transition-all text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Print Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCheckIns.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-500">No active check-in registrations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}