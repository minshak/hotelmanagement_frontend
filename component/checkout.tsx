"use client";

import { useState, useEffect, useMemo } from "react";
import api, { getRooms, getRoomTypes } from "../lib/api";
import { Users, Receipt, Calendar, Clock, CreditCard, ChevronLeft, Banknote, Percent } from "lucide-react";

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

interface Room {
  id: number;
  room_no: string;
  room_type: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  active: boolean;
}

interface RoomType {
  id: number;
  name: string;
  rent: number;
}

export default function GuestCheckout() {
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null);

  // Checkout Form State
  const [checkoutDate, setCheckoutDate] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [discount, setDiscount] = useState<string>("0"); // New discount state
  const [amountPaid, setAmountPaid] = useState<string>(""); // Tracks net amount collected

  // Initialize date & time on client side to prevent Next.js SSR hydration mismatches
  useEffect(() => {
    setCheckoutDate(new Date().toISOString().split("T")[0]);
    setCheckoutTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  }, []);

  // Synchronized Data Fetching pipeline
  const fetchInitialData = async () => {
    try {
      const checkinRes = await api.get("/reservations/checkins/");
      setCheckins(checkinRes.data || []);

      const roomRes = await getRooms();
      setRooms(roomRes || []);

      const types = await getRoomTypes();
      setRoomTypes(types || []);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
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
      return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [checkins]);

  // Find Room daily rent dynamically cross-referenced through RoomType mappings
  const currentRoomRent = useMemo(() => {
    if (!selectedRecord) return 0;

    const room = rooms.find((r) => String(r.room_no) === String(selectedRecord.room_no));
    const roomType = roomTypes.find((t) => t.id === room?.room_type);

    return roomType ? Number(roomType.rent) : 0;
  }, [selectedRecord, rooms, roomTypes]);

  // Aligned with backend calculation logic: max(1, ceil(hours / 24))
  const billingCalculations = useMemo(() => {
    if (!selectedRecord || !selectedRecord.checkin_date || !selectedRecord.checkin_time || !checkoutDate || !checkoutTime) {
      return { totalDays: 0, totalAmount: 0, balanceAmount: 0 };
    }

    const checkInDateTime = new Date(`${selectedRecord.checkin_date}T${selectedRecord.checkin_time}`);
    const checkOutDateTime = new Date(`${checkoutDate}T${checkoutTime}`);

    const diffInMs = checkOutDateTime.getTime() - checkInDateTime.getTime();
    const advancePaid = Number(selectedRecord.advance_amount) || 0;

    if (diffInMs <= 0) {
      return { totalDays: 1, totalAmount: currentRoomRent, balanceAmount: currentRoomRent - advancePaid };
    }

    const diffInHours = diffInMs / (1000 * 60 * 60);
    const calculatedDays = Math.max(1, Math.ceil(diffInHours / 24));
    const totalAmount = calculatedDays * currentRoomRent;
    const balanceAmount = totalAmount - advancePaid;

    return {
      totalDays: calculatedDays,
      totalAmount,
      balanceAmount,
    };
  }, [selectedRecord, checkoutDate, checkoutTime, currentRoomRent]);

  // Sync amountPaid value whenever the calculated balance or discount updates
  useEffect(() => {
    if (selectedRecord) {
      const totalDiscount = parseFloat(discount) || 0;
      const netPayable = Math.max(0, billingCalculations.balanceAmount - totalDiscount);
      setAmountPaid(netPayable.toFixed(2));
    }
  }, [billingCalculations.balanceAmount, selectedRecord, discount]);

  const handleOpenCheckout = (record: CheckInRecord) => {
    setSelectedRecord(record);
    setCheckoutDate(new Date().toISOString().split("T")[0]);
    setCheckoutTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    );
    setPayMode(record.pay_mode || "CASH");
    setDiscount("0");
    setRemarks("");
  };

  // Handle Form Submission
  const handleSaveCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const enteredAmount = parseFloat(amountPaid) || 0;
    const currentDiscount = parseFloat(discount) || 0;
    // Net target balance calculated after factoring out discounts
    const expectedNetBalance = parseFloat((billingCalculations.balanceAmount - currentDiscount).toFixed(2));

    // Strict Validation: Ensure user-entered amount matches the computed net balance due
    if (enteredAmount !== expectedNetBalance) {
      alert(`Payment Validation Error: The entered Amount Paid (₹${enteredAmount}) must exactly match the Balance Payable Due minus Discount (₹${expectedNetBalance}).`);
      return;
    }

    try {
      // Formatted precisely to match Django's CheckOut model requirements
      const payload = {
        checkin: selectedRecord.id,
        checkout_date: checkoutDate,
        checkout_time: checkoutTime.length === 5 ? `${checkoutTime}:00` : checkoutTime, // Ensure HH:MM:SS format
        total_days: billingCalculations.totalDays,
        balance_paid: enteredAmount.toFixed(2), // Passing validated amount paid
        discount_amount: currentDiscount.toFixed(2), // Optional: Sent if your backend captures itemized discount reductions
        pay_mode: payMode,
        remarks: remarks,
      };

      const checkoutEndpoint = "/reservations/checkouts/";
      await api.post(checkoutEndpoint, payload);

      alert("Checkout processed successfully!");
      setSelectedRecord(null);
      await fetchInitialData();
    } catch (err) {
      console.error("Checkout submission failure:", err);
      alert("Failed to submit checkout payload. Verify your API base path endpoint configuration.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020b2d] p-8 text-white">
      {!selectedRecord ? (
        /* SCREEN A: ACTIVE CHECK-INS DASHBOARD */
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
                      <td className="p-4 text-blue-400 font-bold text-lg">Room {item.room_no}</td>
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
            type="button"
            onClick={() => setSelectedRecord(null)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <ChevronLeft size={16} /> Back to dashboard list
          </button>

          <form onSubmit={handleSaveCheckout} className="space-y-6">
            {/* Header Metadata Panel */}
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

            {/* Transaction Interactive Form Details */}
            <div className="bg-[#07102a] p-6 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">Checkout Operations</h3>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">
                    <Calendar size={12} className="inline mr-1" /> CHECKOUT DATE
                  </label>
                  <input
                    type="date"
                    required
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">
                    <Clock size={12} className="inline mr-1" /> CHECKOUT TIME
                  </label>
                  <input
                    type="time"
                    step="1"
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
                    <span className="text-[10px] text-gray-500 font-normal block">(Ceiling dynamic hour cycle)</span>
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
                  <label className="text-xs text-blue-400 block mb-1.5">ADVANCE PAID</label>
                  <div className="w-full bg-slate-900/60 p-3 rounded-xl font-mono font-bold border border-slate-800 text-gray-300 text-base">
                    ₹{(selectedRecord.advance_amount || 0).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-red-400 block mb-1.5">BALANCE PAYABLE DUE (₹)</label>
                  <div
                    className={`w-full p-3 rounded-xl font-mono font-bold text-base border bg-slate-900 ${
                      billingCalculations.balanceAmount >= 0
                        ? "text-red-400 border-red-500/20"
                        : "text-purple-400 border-purple-500/20"
                    }`}
                  >
                    ₹{billingCalculations.balanceAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">
                    <CreditCard size={12} className="inline mr-1" /> PAYMODE
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 text-white focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Scan</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                {/* Added Discount Field */}
                <div>
                  <label className="text-xs text-yellow-400 block mb-1.5">
                    <Percent size={12} className="inline mr-1" /> DISCOUNT (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full bg-slate-900 p-3 rounded-xl text-sm border border-slate-700 font-mono font-bold text-yellow-400 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>

                {/* Amount Paid Field automatically subtracting discount */}
                <div>
                  <label className="text-xs text-emerald-400 block mb-1.5">
                    <Banknote size={12} className="inline mr-1" /> AMOUNT PAID (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Net collected amount"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className={`w-full bg-slate-900 p-3 rounded-xl text-sm border font-mono font-bold text-emerald-400 focus:outline-none ${
                      parseFloat(amountPaid) === parseFloat((billingCalculations.balanceAmount - (parseFloat(discount) || 0)).toFixed(2))
                        ? "border-emerald-500/40"
                        : "border-red-500"
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">REMARKS / NOTES</label>
                  <input
                    type="text"
                    placeholder="Transaction or discount notes"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
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