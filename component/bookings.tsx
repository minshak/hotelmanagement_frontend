"use client";

import { useState, useMemo } from "react";
import { Bed, Calendar, CreditCard, User, DollarSign } from "lucide-react";

interface Room {
    id: number;
    number: string;
    type: string;
    status: "Available" | "Occupied";
}

interface Customer {
    id: string;
    name: string;
}

const customersData: Customer[] = [
    { id: "CST-8821", name: "Julian Hadrick" },
    { id: "CST-9204", name: "Sarah Miller" },
    { id: "CST-1102", name: "Elena Rodriguez" },
    { id: "CST-0043", name: "Marcus Chen" },
];

const roomsData: Room[] = [
    { id: 1, number: "1001", type: "Single", status: "Available" },
    { id: 2, number: "1002", type: "Single", status: "Occupied" },
    { id: 3, number: "1003", type: "Single", status: "Available" },
    { id: 4, number: "2001", type: "Double", status: "Available" },
    { id: 5, number: "2002", type: "Double", status: "Occupied" },
    { id: 6, number: "2003", type: "Double", status: "Available" },
    { id: 7, number: "3001", type: "Suite", status: "Available" },
    { id: 8, number: "3002", type: "Suite", status: "Occupied" },
];

export default function BookingsPage() {
    const [customers, setCustomers] = useState<Customer[]>(customersData);
    const [selectedCustomer, setSelectedCustomer] = useState("");

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");

    const [roomType, setRoomType] = useState("Single");
    const [selectedRoom, setSelectedRoom] = useState("");

    const [checkInDate, setCheckInDate] = useState("");
    const [checkOutDate, setCheckOutDate] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [depositAmount, setDepositAmount] = useState("");

    const availableRooms = useMemo(() => {
        return roomsData.filter(
            (room) => room.type === roomType && room.status === "Available"
        );
    }, [roomType]);

    const handleCreateBooking = () => {
        if (!selectedCustomer || !selectedRoom || !checkInDate || !checkOutDate) {
            alert("Please fill in all mandatory fields.");
            return;
        }

        console.log({
            selectedCustomer,
            roomType,
            selectedRoom,
            checkInDate,
            checkOutDate,
            paymentMode,
            depositAmount,
        });

        alert(`Reservation successful for Room ${selectedRoom}!`);
    };

    return (
        <div className="min-h-screen bg-[#020b2d] p-6 text-white">
            <div className="max-w-5xl mx-auto">
                <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#08133d] to-[#071028] p-8 shadow-2xl">
                    
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold">New Room Reservation</h1>
                        <p className="text-gray-400">Book future stays and manage guest allocations</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Field */}
                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-400 mb-2 block">Customer</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full bg-[#111c3b] border border-[#233766] rounded-xl pl-10 pr-3 p-3 text-white outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((c) => (
                                            <option key={c.id} value={c.name}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="shrink-0 px-4 py-3 text-xs font-semibold rounded-xl bg-blue-800 hover:bg-blue-900 transition"
                                >
                                    + New Guest
                                </button>
                            </div>
                        </div>

                        {/* Check-In Date */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Check-In Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={checkInDate}
                                    onChange={(e) => setCheckInDate(e.target.value)}
                                    className="w-full bg-[#111c3b] border border-[#233766] rounded-xl pl-10 p-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Check-Out Date */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Check-Out Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={checkOutDate}
                                    onChange={(e) => setCheckOutDate(e.target.value)}
                                    className="w-full bg-[#111c3b] border border-[#233766] rounded-xl pl-10 p-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Guarantee Payment Method</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full bg-[#111c3b] border border-[#233766] rounded-xl pl-10 p-3 text-white outline-none focus:border-blue-500"
                                >
                                    <option>Cash</option>
                                    <option>Card</option>
                                    <option>UPI</option>
                                </select>
                            </div>
                        </div>

                        {/* Booking Deposit */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Advance Deposit Amount ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full bg-[#111c3b] border border-[#233766] rounded-xl pl-10 p-3 text-white outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room Type */}
                    <div className="mt-6">
                        <label className="text-sm text-gray-400 mb-2 block">Preferred Room Type</label>
                        <select
                            value={roomType}
                            onChange={(e) => {
                                setRoomType(e.target.value);
                                setSelectedRoom("");
                            }}
                            className="w-full bg-[#111c3b] border border-[#233766] rounded-xl p-3 outline-none focus:border-blue-500 text-white"
                        >
                            <option>Single</option>
                            <option>Double</option>
                            <option>Suite</option>
                        </select>
                    </div>

                    {/* Available Room Cards */}
                    <div className="mt-8">
                        <h3 className="mb-4 text-lg font-semibold text-gray-200">
                            Select From Available {roomType} Rooms
                        </h3>
                        {availableRooms.length > 0 ? (
                            <div className="grid md:grid-cols-3 gap-4">
                                {availableRooms.map((room) => (
                                    <button
                                        key={room.id}
                                        type="button"
                                        onClick={() => setSelectedRoom(room.number)}
                                        className={`p-5 rounded-2xl border transition-all text-left ${
                                            selectedRoom === room.number
                                                ? "border-blue-500 bg-blue-500/20"
                                                : "border-[#233766] bg-[#0d1735] hover:border-[#3b5998]"
                                        }`}
                                    >
                                        <Bed className="mb-3 text-blue-400" />
                                        <h3 className="text-2xl font-bold">{room.number}</h3>
                                        <p className="text-green-400 text-sm mt-1">Available</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-red-400">No rooms available for this selection.</p>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="flex justify-center gap-4 mt-10">
                        <button
                            onClick={handleCreateBooking}
                            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition"
                        >
                            Confirm Reservation
                        </button>
                        <button
                            type="button"
                            className="px-8 py-3 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white font-semibold transition"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* CUSTOMER MODAL */}
                    {showCustomerModal && (
                        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                            <div className="bg-[#0d1735] border border-[#233766] p-6 rounded-2xl w-[380px] shadow-2xl">
                                <h2 className="text-xl font-semibold mb-4">Add New Customer</h2>
                                <input
                                    type="text"
                                    placeholder="Enter customer name"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    className="w-full p-3 mb-4 rounded-lg bg-[#111c3b] border border-[#233766] text-white outline-none focus:border-blue-500"
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCustomerModal(false)}
                                        className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!newCustomerName.trim()) return;
                                            const newCustomer = {
                                                id: `CST-${Date.now()}`,
                                                name: newCustomerName,
                                            };
                                            setCustomers((prev) => [...prev, newCustomer]);
                                            setSelectedCustomer(newCustomer.name);
                                            setNewCustomerName("");
                                            setShowCustomerModal(false);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 transition"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}