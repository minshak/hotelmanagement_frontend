"use client";

import { useState, useEffect, useRef } from "react";
import {
    Calendar,
    Clock,
    Plus,
    X,
    Eye,
    ChevronDown,
    Edit2,
    LogOut,
    FileText
} from "lucide-react";

interface CheckoutRecord {
    id: string;
    customer: string;
    roomNumber: string;
}

interface CheckoutData {
    checkinId: string;
    checkoutDate: string;
    checkoutTime: string;
    totalDays: string;
    balancePaid: number;
    payType: string;
}

export default function GuestCheckout() {
    const [activeCheckins] = useState<CheckoutRecord[]>([
        { id: "1", customer: "zara", roomNumber: "Room 2B" },
        { id: "2", customer: "Julian Hadrick", roomNumber: "2001" },
        { id: "3", customer: "Elena Rodriguez", roomNumber: "1001" }
    ]);

    const [formData, setFormData] = useState<CheckoutData>({
        checkinId: "",
        checkoutDate: "",
        checkoutTime: "",
        totalDays: "",
        balancePaid: 0,
        payType: "",
    });

    const [showDropdown, setShowDropdown] = useState(false);
    const [searchSearch, setSearchSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Populate current date and time on mount
    useEffect(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');

        setFormData(prev => ({
            ...prev,
            checkoutDate: `${yyyy}-${mm}-${dd}`,
            checkoutTime: `${hours}:${minutes}`
        }));
    }, []);

    // Handle outside clicks for custom select menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === "balancePaid" ? Number(value) : value,
        });
    };

    const handleAction = (actionType: string) => {
        if (!formData.checkinId) {
            alert("Please select an active check-in record.");
            return;
        }
        const selected = activeCheckins.find(c => c.id === formData.checkinId);
        alert(`Action: ${actionType}\nGuest: ${selected?.customer} (${selected?.roomNumber})\nSettled Balance: $${formData.balancePaid} via ${formData.payType || 'None'}`);
    };

    const selectedCheckinText = activeCheckins.find(c => c.id === formData.checkinId)
        ? `${activeCheckins.find(c => c.id === formData.checkinId)?.customer} - ${activeCheckins.find(c => c.id === formData.checkinId)?.roomNumber}`
        : "----------";

    return (
        <div className="min-h-screen bg-[#020b2d] p-6 text-white flex flex-col items-center justify-start font-sans">
            <div className="max-w-4xl w-full mx-auto space-y-8 mt-4">
                
                <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-[#08133d] to-[#071028] p-8 shadow-2xl">
                    
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tight">Add check out</h1>
                        <p className="text-gray-400 mt-1 font-light">Finalize guest stays, evaluate final metrics, and settle outstanding transaction entries balance matrix formulas.</p>
                    </div>

                    {/* Information Input Grid matching dashboard row layout */}
                    <div className="grid md:grid-cols-2 gap-6 relative">
                        
                        {/* Checkin Selection Input with utility inline buttons */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="text-sm font-medium text-gray-400 mb-2 block">Checkin:</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <button
                                        type="button"
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="w-full text-left bg-[#0d1735] border border-[#233766] rounded-xl pl-10 pr-10 p-3 focus:outline-none focus:border-blue-500 text-white font-medium transition"
                                    >
                                        <span className={formData.checkinId ? "text-white" : "text-slate-400"}>
                                            {selectedCheckinText}
                                        </span>
                                    </button>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>

                            </div>

                            {/* Dropdown Options Box */}
                            {showDropdown && (
                                <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-[#0d1735] border border-[#233766] rounded-xl shadow-2xl z-50 divide-y divide-[#1b2b54]">
                                    <button
                                        type="button"
                                        onClick={() => { setFormData({ ...formData, checkinId: "" }); setShowDropdown(false); }}
                                        className="w-full text-left p-3 text-sm text-slate-400 hover:bg-blue-600/20 hover:text-white transition-colors"
                                    >
                                        ----------
                                    </button>
                                    {activeCheckins.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, checkinId: c.id });
                                                setShowDropdown(false);
                                            }}
                                            className={`w-full text-left p-3 text-sm transition-colors flex items-center justify-between ${
                                                formData.checkinId === c.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-200 hover:bg-blue-600/20 hover:text-white'
                                            }`}
                                        >
                                            <span>{c.customer}</span>
                                            <span className="text-xs font-mono text-gray-400 bg-[#16224f] px-2 py-0.5 rounded border border-[#263870]">{c.roomNumber}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Checkout Date Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-400 block">Checkout date:</label>
                                <span className="text-xs font-light text-slate-400">
                                    <span className="text-blue-400 hover:underline cursor-pointer font-normal" onClick={() => {
                                        const t = new Date();
                                        setFormData(p => ({ ...p, checkoutDate: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}` }));
                                    }}>Today</span> | <Calendar size={13} className="text-blue-400 inline mb-0.5" />
                                </span>
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    name="checkoutDate"
                                    value={formData.checkoutDate}
                                    onChange={handleChange}
                                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl pl-10 p-3 focus:outline-none focus:border-blue-500 text-white scheme-dark"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-light mt-1 pl-1">Note: You are 5.5 hours ahead of server time.</p>
                        </div>

                        {/* Checkout Time Input */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-400 block">Checkout time:</label>
                                <span className="text-xs font-light text-slate-400">
                                    <span className="text-blue-400 hover:underline cursor-pointer font-normal" onClick={() => {
                                        const t = new Date();
                                        setFormData(p => ({ ...p, checkoutTime: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` }));
                                    }}>Now</span> | <Clock size={13} className="text-blue-400 inline mb-0.5" />
                                </span>
                            </div>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="time"
                                    name="checkoutTime"
                                    value={formData.checkoutTime}
                                    onChange={handleChange}
                                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl pl-10 p-3 focus:outline-none focus:border-blue-500 text-white scheme-dark"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-light mt-1 pl-1">Note: You are 5.5 hours ahead of server time.</p>
                        </div>

                        {/* Total Days Input */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 mb-2 block">Total days:</label>
                            <input
                                type="text"
                                name="totalDays"
                                value={formData.totalDays}
                                onChange={handleChange}
                                className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white font-medium"
                            />
                        </div>

                        {/* Balance Paid Input */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 mb-2 block">Balance paid:</label>
                            <input
                                type="number"
                                name="balancePaid"
                                value={formData.balancePaid}
                                onChange={handleChange}
                                className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white font-mono"
                            />
                        </div>

                        {/* Pay Type Selection Field */}
                        <div>
                            <label className="text-sm font-medium text-gray-400 mb-2 block">Pay type:</label>
                            <div className="relative">
                                <select
                                    name="payType"
                                    value={formData.payType}
                                    onChange={handleChange}
                                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl px-4 p-3 focus:outline-none focus:border-blue-500 appearance-none text-white font-medium"
                                >
                                    <option value="">---------</option>
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                    </div>

                    {/* Submission Buttons Row styled exactly like the original SAVE panel */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-10 border-t border-slate-800 pt-6">
                        <button
                            type="button"
                            onClick={() => handleAction("SAVE")}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide text-xs transition-all uppercase"
                        >
                            SAVE
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction("Save and add another")}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold shadow-md transition-all"
                        >
                            Save and add another
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAction("Save and continue editing")}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-all"
                        >
                            Save and continue editing
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}