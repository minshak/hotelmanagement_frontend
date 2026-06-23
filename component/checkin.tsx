"use client";

import { useState, useEffect, useMemo } from "react";
import api, { getCustomers, getCheckIns } from "../lib/api";
import { Bed, X, Check, Users } from "lucide-react";

export default function GuestCheckIn() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [roomTypeModal, setRoomTypeModal] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        customerId: "",
        roomId: "",
        checkInDate: new Date().toISOString().split('T')[0],
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        totalAmount: 0,
        advancePaid: 0,
        payMode: "CASH"
    });

    // The single, correct definition of fetchCheckins
   const fetchCheckins = async () => {
  try {
    const data = await getCheckIns();

    setCheckins(data);
  } catch (error) {
    console.error("GET Error:", error);
  }
};

 useEffect(() => {
    console.log("Token:", localStorage.getItem("access"));

    const fetchData = async () => {
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (e) {
            console.error("Error fetching customers", e);
        }

        const savedRooms = localStorage.getItem("hotel_management_rooms");

        if (savedRooms) {
            setRooms(JSON.parse(savedRooms));
        }

        await fetchCheckins();
    };

    fetchData();
}, []);

    const handleCompleteCheckIn = async () => {
  try {
    const payload = {
      customer: selectedCustomer.id,
      room: selectedRoom.id,
      checkin_date: formData.checkInDate,
      checkin_time: formData.checkInTime,
      advance_amount: formData.advancePaid,
      pending_amount: formData.totalAmount - formData.advancePaid,
      pay_mode: formData.payMode,
    };

    await api.post(
      "/reservations/checkins/",
      payload
    );

    alert("Check-in Successful!");
    fetchCheckins();
  } catch (error) {
    console.error("POST Error:", error);
  }
};
    const roomTypes = useMemo(() => Array.from(new Set(rooms.map(r => r.type))), [rooms]);
    const pendingAmount = formData.totalAmount - formData.advancePaid;

    return (
        <div className="min-h-screen bg-[#020b2d] p-8 text-white">
            <h1 className="text-3xl font-bold mb-8">Guest Check-In</h1>



            <div className="grid lg:grid-cols-2 gap-8">

                {/* COLUMN 1: SELECTION */}

                <div className="space-y-6">

                    <div className="bg-[#0d1735] p-5 rounded-xl border border-blue-900">

                        <label className="text-xs text-gray-400 block mb-2">SELECT CUSTOMER</label>

                        <select className="w-full bg-slate-900 p-3 rounded text-white border border-slate-700"

                            onChange={(e) => {

                                const c = customers.find(x => String(x.id) === e.target.value);

                                setSelectedCustomer(c);

                                setFormData({ ...formData, customerId: e.target.value });

                            }}>

                            <option value="">Choose a customer...</option>

                            {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}

                        </select>



                        {selectedCustomer && (

                            <div className="mt-4 p-4 bg-[#0a1024] rounded border border-blue-800 text-sm space-y-1">

                                <p className="text-gray-400">Mobile: <span className="text-white">{selectedCustomer.mobile_no}</span></p>

                                <p className="text-gray-400">Email: <span className="text-white">{selectedCustomer.email || "N/A"}</span></p>

                                <p className="text-gray-400">Address: <span className="text-white">{selectedCustomer.address || "N/A"}</span></p>

                            </div>

                        )}

                    </div>



                    <label className="text-xs text-gray-400 block">1. SELECT ROOM TYPE</label>

                    <div className="grid grid-cols-2 gap-3">

                        {roomTypes.map(type => (

                            <button key={type} onClick={() => setRoomTypeModal(type)}

                                className="bg-blue-900/20 hover:bg-blue-600/40 p-4 rounded-xl border border-blue-500/30 text-center">

                                <Bed className="mx-auto mb-2" />

                                <div className="font-bold">{type}</div>

                            </button>

                        ))}

                    </div>

                </div>



                {/* COLUMN 2: FINANCIALS */}

                <div className="bg-[#0b1224] p-6 rounded-2xl border border-slate-800 space-y-4">

                    {selectedRoom && (

                        <div className="bg-emerald-900/20 p-3 rounded-lg border border-emerald-500/30 flex justify-between items-center">

                            <p className="font-bold">Room {selectedRoom.number} Selected</p>

                            <Check className="text-emerald-500" />

                        </div>

                    )}

                    <div className="grid grid-cols-2 gap-4">

                        <input type="date" value={formData.checkInDate || ""} className="bg-slate-900 p-3 rounded" onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })} />

                        <input type="time" value={formData.checkInTime || ""} className="bg-slate-900 p-3 rounded" onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} />

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        <input type="number" placeholder="Total Amount" value={formData.totalAmount} className="bg-slate-900 p-3 rounded"
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    totalAmount: Number(e.target.value)
                                })
                            }
                        />
                        <input type="number" placeholder="Advance" className="bg-slate-900 p-3 rounded" onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })} />

                    </div>

                    <select className="w-full bg-slate-900 p-3 rounded" value={formData.payMode} onChange={(e) => setFormData({ ...formData, payMode: e.target.value })}>

                        <option value="CASH">Cash</option>

                        <option value="UPI">UPI</option>

                        <option value="CARD">Card/Net Banking</option>

                    </select>

                    <div className="text-xl font-bold text-red-400">Pending: ₹{pendingAmount.toFixed(2)}</div>

                    <button

                        onClick={handleCompleteCheckIn}

                        className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500">

                        COMPLETE CHECK-IN

                    </button>

                </div>

            </div>



            {/* CHECK-IN TABLE */}

            <div className="mt-12 bg-[#0d1735] p-6 rounded-2xl border border-blue-900">

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="text-blue-400" /> Active Check-ins</h2>

                <div className="overflow-x-auto">

                    <table className="w-full text-left border-collapse">

                        <thead>

                            <tr className="text-gray-400 text-xs uppercase border-b border-blue-900">

                                <th className="pb-4">Guest</th><th className="pb-4">Room</th><th className="pb-4">Date</th><th className="pb-4">Time</th><th className="pb-4">Pay Mode</th><th className="pb-4">Pending</th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-blue-900/30">

                            {checkins.length > 0 ? checkins.map((item, idx) => (

                                <tr key={idx} className="hover:bg-blue-900/10">

                                    <td className="py-4">{item.customerName || item.customer_name}</td>

                                    <td className="py-4 text-blue-400 font-bold">{item.roomNumber || item.room_no}</td>

                                    <td className="py-4 text-sm">{item.checkInDate || item.checkin_date}</td>

                                    <td className="py-4 text-sm">{item.checkInTime || item.checkin_time}</td>

                                    <td className="py-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs">{item.payMode || item.pay_mode}</span></td>

                                    <td className="py-4 text-red-400 font-bold">₹{item.pendingAmount || item.pending_amount}</td>

                                </tr>

                            )) : (

                                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No active check-ins found.</td></tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>



            {/* MODAL */}

            {roomTypeModal && (

                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">

                    <div className="bg-[#0d1735] w-full max-w-sm rounded-2xl p-6 border border-slate-700">

                        <div className="flex justify-between mb-4">

                            <h2 className="font-bold">Available {roomTypeModal}</h2>

                            <button onClick={() => setRoomTypeModal(null)}><X /></button>

                        </div>

                        <div className="grid grid-cols-2 gap-3">

                            {rooms.filter(r => r.type === roomTypeModal && r.status === 'available').map(r => (

                                <button key={r.id} onClick={() => {
                                    setSelectedRoom(r); setFormData(prev => ({
                                        ...prev, roomId: String(r.id), totalAmount: Number(r.rent || 0) // Auto-fill room rent
                                    }));

                                    setRoomTypeModal(null);
                                }}
                                    className="p-4 bg-slate-800 hover:bg-blue-600 rounded-lg">

                                    <div className="font-bold text-xl">{r.number}</div>

                                </button>

                            ))}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}