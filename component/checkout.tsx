"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getRooms, getRoomTypes } from "../lib/api";
import { Users, Receipt, Calendar, Clock, CreditCard, ChevronLeft, Banknote, Percent, CheckCircle2, History, X, Download, FileSpreadsheet } from "lucide-react";

interface CheckInRecord {
  id: number;
  customer_name?: string;
  mobile_no?: string;
  room_no?: string;
  checkin_date?: string; 
  checkin_time?: string; 
  advance_amount?: number;
  pay_mode?: string;
  status?: string;
}

interface CheckoutRecord {
  id: number;
  checkin: number | CheckInRecord; 
  checkout_date: string;
  checkout_time: string;
  total_days: number;
  balance_paid: string;
  discount_amount?: string;
  pay_mode: string;
  remarks?: string;
  room_no?: string;
  customer_name?: string;
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
  category: string;
  is_ac: string;
  rent: string;
  active: boolean;
}

interface ReceiptPayload {
  receipt_no: string;
  generated_at: string;
  customer: { name: string };
  stay_details: {
    room_no: string;
    room_type: string;
    checkin_datetime: string;
    checkout_datetime: string;
    total_days: number;
  };
  financial_breakdown: {
    base_daily_rent: number;
    subtotal: number;
    advance_paid: number;
    balance_paid: number;
    total_amount_charged: number;
    payment_mode: string;
  };
  remarks: string;
}

export default function GuestCheckout() {
  const [checkins, setCheckins] = useState<CheckInRecord[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]); 
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null);

  // Date Filtering State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<ReceiptPayload | null>(null);
  const [isFetchingReceipt, setIsFetchingReceipt] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeCheckoutId, setActiveCheckoutId] = useState<number | null>(null);

  // Checkout Form State
  const [checkoutDate, setCheckoutDate] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");
  const [discount, setDiscount] = useState<string>("0");
  const [amountPaid, setAmountPaid] = useState<string>("");

  useEffect(() => {
    setCheckoutDate(new Date().toISOString().split("T")[0]);
    setCheckoutTime(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  }, []);

  const fetchInitialData = async () => {
    try {
      const checkinRes = await api.get("/reservations/checkins/");
      setCheckins(checkinRes.data || []);

      const checkoutRes = await api.get("/reservations/checkouts/");
      setCheckouts(checkoutRes.data || []);

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

  const sortedCheckins = useMemo(() => {
    return [...checkins].sort((a, b) => {
      const roomA = a.room_no || "";
      const roomB = b.room_no || "";
      return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [checkins]);

  // Dynamic filter for checkout logs based on date selection
  const filteredCheckouts = useMemo(() => {
    return checkouts.filter((record) => {
      if (!record.checkout_date) return true;
      
      const recordDate = new Date(record.checkout_date);
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
  }, [checkouts, startDate, endDate]);

  const currentRoomRent = useMemo(() => {
    if (!selectedRecord) return 0;
    const room = rooms.find((r) => String(r.room_no) === String(selectedRecord.room_no));
    const roomType = roomTypes.find((t) => t.id === room?.room_type);
    return roomType ? Number(roomType.rent) : 0;
  }, [selectedRecord, rooms, roomTypes]);

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

    return { totalDays: calculatedDays, totalAmount, balanceAmount };
  }, [selectedRecord, checkoutDate, checkoutTime, currentRoomRent]);

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

  const handleFetchReceipt = async (checkoutId: number) => {
    setIsFetchingReceipt(true);
    setActiveCheckoutId(checkoutId);
    try {
      const response = await api.get(`/reservations/checkouts/${checkoutId}/receipt/`);
      setReceiptData(response.data);
    } catch (err) {
      console.error("Receipt generation error:", err);
      alert("Could not load receipt documentation for this record.");
    } finally {
      setIsFetchingReceipt(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!activeCheckoutId) return;
    setIsDownloadingPdf(true);
    try {
      const response = await api.get(`/reservations/checkouts/${activeCheckoutId}/download-receipt/`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      link.setAttribute('download', `Receipt_REC-${String(activeCheckoutId).padStart(6, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download execution error:", err);
      alert("Failed to compile and download your PDF invoice file.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // EXCEL / CSV GENERATION LOGIC
  const handleExportToExcel = () => {
    if (filteredCheckouts.length === 0) {
      alert("No sorted report data available to export.");
      return;
    }

    // Define table headers
    const headers = ["Room No", "Guest Name", "Mobile No", "Checkout Date", "Checkout Time", "Duration (Days)", "Settled Amount (INR)", "Payment Mode", "Remarks"];
    
    // Map processed row data strings securely
    const rows = filteredCheckouts.map((out) => {
      const nestedCheckin = typeof out.checkin === "object" ? out.checkin : null;
      const roomNo = nestedCheckin?.room_no || out.room_no || "N/A";
      const name = nestedCheckin?.customer_name || out.customer_name || "Archived Guest";
      const mobile = nestedCheckin?.mobile_no || "N/A";
      const remarksText = out.remarks ? out.remarks.replace(/"/g, '""') : ""; // Escape internal quotes safely

      return [
        `"Room ${roomNo}"`,
        `"${name}"`,
        `"${mobile}"`,
        `"${out.checkout_date}"`,
        `"${out.checkout_time}"`,
        out.total_days,
        Number(out.balance_paid).toFixed(2),
        `"${out.pay_mode}"`,
        `"${remarksText}"`
      ];
    });

    // Assemble dynamic document body structure layout cleanly
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Checkout_Report_${startDate || "Start"}_to_${endDate || "End"}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const enteredAmount = parseFloat(amountPaid) || 0;
    const currentDiscount = parseFloat(discount) || 0;
    const expectedNetBalance = parseFloat((billingCalculations.balanceAmount - currentDiscount).toFixed(2));

    if (enteredAmount !== expectedNetBalance) {
      alert(`Payment Validation Error: Entered Amount (₹${enteredAmount}) must exactly match Balance Due minus Discount (₹${expectedNetBalance}).`);
      return;
    }

    try {
      const payload = {
        checkin: selectedRecord.id,
        checkout_date: checkoutDate,
        checkout_time: checkoutTime.length === 5 ? `${checkoutTime}:00` : checkoutTime,
        total_days: billingCalculations.totalDays,
        balance_paid: enteredAmount.toFixed(2),
        discount_amount: currentDiscount.toFixed(2),
        pay_mode: payMode,
        remarks: remarks,
      };

      await api.post("/reservations/checkouts/", payload);
      alert("Checkout processed successfully!");
      setSelectedRecord(null);
      await fetchInitialData();
    } catch (err) {
      console.error("Checkout submission failure:", err);
      alert("Failed to submit checkout payload.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020b2d] p-8 text-white relative">
      
      {/* CONDITIONAL DYNAMIC MODAL: RECEIPT VIEWER */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 max-w-lg w-full rounded-2xl shadow-2xl p-6 relative space-y-4 font-sans">
            <button 
              onClick={() => {
                setReceiptData(null);
                setActiveCheckoutId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
            
            <div className="text-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold tracking-wide text-emerald-400 flex items-center justify-center gap-2">
                <Receipt size={22} /> INVOICE RECEIPT
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-1">{receiptData.receipt_no}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/40 pb-2">
                <span className="text-slate-400">Guest Name</span>
                <span className="font-semibold text-white">{receiptData.customer.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">ROOM / TYPE</span>
                  <span className="text-slate-200 font-medium">Room {receiptData.stay_details.room_no} ({receiptData.stay_details.room_type})</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">TOTAL DURATION</span>
                  <span className="text-yellow-400 font-bold">{receiptData.stay_details.total_days} Day(s)</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-slate-500 block mb-0.5">STAY TIMELINE</span>
                  <span className="text-slate-300 font-mono text-[11px] block">In: {receiptData.stay_details.checkin_datetime}</span>
                  <span className="text-slate-300 font-mono text-[11px] block">Out: {receiptData.stay_details.checkout_datetime}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Daily Room Tariff</span>
                  <span>₹{receiptData.financial_breakdown.base_daily_rent.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gross Subtotal</span>
                  <span>₹{receiptData.financial_breakdown.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-400">
                  <span>(-) Deposit Advance</span>
                  <span>₹{receiptData.financial_breakdown.advance_paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-2 text-sm font-bold">
                  <span>Balance Cleared ({receiptData.financial_breakdown.payment_mode})</span>
                  <span>₹{receiptData.financial_breakdown.balance_paid.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-center text-slate-400 italic mt-4">
                "{receiptData.remarks}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => window.print()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
              >
                PRINT SCREEN
              </button>
              
              <button 
                onClick={handleDownloadReceipt}
                disabled={isDownloadingPdf}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Download size={14} /> 
                {isDownloadingPdf ? "DOWNLOADING..." : "DOWNLOAD PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedRecord ? (
        /* SCREEN A: ACTIVE DASHBOARD WITH CHECKOUT HISTORY LIST UNDERNEATH */
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Active Guest Profiles Container */}
          <div className="bg-[#0d1735] p-6 rounded-2xl border border-blue-900">
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
                    <th className="p-4">Status</th>
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
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.status || "STAYING"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
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
                      <td colSpan={6} className="py-12 text-center text-gray-500 text-base">
                        No active check-ins currently logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHECKOUT LOG & HISTORY WITH RECEIPT ACTION CONTROL */}
          <div className="bg-[#0d1735] p-6 rounded-2xl border border-blue-900">
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
                <History /> Checkout Log & History
              </h2>
              
              {/* DATE FILTER CONTROLS BAR */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-blue-900/40">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 uppercase font-medium">From:</span>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 uppercase font-medium">To:</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-blue-900 bg-slate-900/40">
                    <th className="p-4">Room No</th>
                    <th className="p-4">Guest Details</th>
                    <th className="p-4">Checkout Date/Time</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Settled Amount</th>
                    <th className="p-4">Pay Mode</th>
                    <th className="p-4 text-center">Invoice Documentation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm">
                  {filteredCheckouts.length > 0 ? (
                    filteredCheckouts.map((out) => {
                      const nestedCheckin = typeof out.checkin === "object" ? out.checkin : null;
                      const displayRoom = nestedCheckin?.room_no || out.room_no || "N/A";
                      const displayName = nestedCheckin?.customer_name || out.customer_name || "Archived Guest";

                      return (
                        <tr key={out.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 font-bold text-gray-300">Room {displayRoom}</td>
                          <td className="p-4">
                            <div className="font-medium">{displayName}</div>
                            {nestedCheckin?.mobile_no && (
                              <div className="text-xs text-gray-400 font-mono">{nestedCheckin.mobile_no}</div>
                            )}
                          </td>
                          <td className="p-4 text-slate-300">
                            {out.checkout_date} @ {out.checkout_time}
                          </td>
                          <td className="p-4 font-medium text-yellow-500">
                            {out.total_days} Day(s)
                          </td>
                          <td className="p-4 text-emerald-400 font-bold font-mono">
                            ₹{Number(out.balance_paid).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-gray-300 border border-slate-700">
                              {out.pay_mode}
                            </span>
                          </td>
                          <td className="p-4 text-center flex items-center justify-center gap-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={12} /> SETTLED
                            </span>
                            <button
                              type="button"
                              disabled={isFetchingReceipt}
                              onClick={() => handleFetchReceipt(out.id)}
                              className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                            >
                              <Receipt size={13} /> RECEIPT
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 text-base">
                        No checkout records matched the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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