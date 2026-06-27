"use client";
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { Bed, Plus, ArrowLeft, X, Snowflake, DollarSign, Trash2, Pencil, Check } from 'lucide-react';

// Define strict interfaces for our state data
interface Room {
    id: number;
    number: string;
    type: string;
    ac: boolean;
    rent: number;
    status: 'available' | 'occupied' | 'maintenance';
}

interface RoomDraft {
    number: string;
    type: string;
    ac: boolean;
    rent: string;
    status: string;
}

const initialRooms: Room[] = [
    { id: 1, number: '1001', type: 'Single', ac: true, rent: 1000, status: 'available' },
    { id: 2, number: '1002', type: 'Single', ac: true, rent: 1000, status: 'occupied' },
    { id: 3, number: '1003', type: 'Single', ac: true, rent: 1000, status: 'available' },
    { id: 4, number: '2001', type: 'Double', ac: true, rent: 1800, status: 'available' },
    { id: 5, number: '2002', type: 'Double', ac: false, rent: 1500, status: 'maintenance' },
    { id: 6, number: '2003', type: 'Double', ac: true, rent: 1800, status: 'occupied' },
    { id: 7, number: '3001', type: 'Suite', ac: true, rent: 3500, status: 'occupied' },
    { id: 8, number: '3002', type: 'Suite', ac: true, rent: 3500, status: 'available' },
];

const THEMES = [
    { icon: 'bg-blue-500/15 text-blue-400', border: 'hover:border-blue-500/60' },
    { icon: 'bg-purple-500/15 text-purple-400', border: 'hover:border-purple-500/60' },
    { icon: 'bg-amber-500/15 text-amber-400', border: 'hover:border-amber-500/60' },
    { icon: 'bg-teal-500/15 text-teal-400', border: 'hover:border-teal-500/60' },
    { icon: 'bg-rose-500/15 text-rose-400', border: 'hover:border-rose-500/60' },
];

const STATUS = {
    available: { label: 'Available', pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400', card: 'from-slate-800 to-emerald-950/50 border-emerald-700/30' },
    occupied: { label: 'Occupied', pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', card: 'from-slate-800 to-amber-950/50 border-amber-700/30' },
    maintenance: { label: 'Maintenance', pill: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-400', card: 'from-slate-800 to-red-950/50 border-red-700/30' },
};

const emptyDraft: RoomDraft = { number: '', type: '', ac: true, rent: '', status: 'available' };

export default function RoomsManagement() {
    const [rooms, setRooms] = useState<Room[]>(initialRooms);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<RoomDraft>(emptyDraft);
    const [addOpen, setAddOpen] = useState<boolean>(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSelectedRoom(null);
                setAddOpen(false);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const types = useMemo(() => Array.from(new Set(rooms.map((r) => r.type))), [rooms]);

    const typeSummary = useMemo(() => types.map((t) => ({
        type: t,
        count: rooms.filter((r) => r.type === t).length,
        available: rooms.filter((r) => r.type === t && r.status === 'available').length,
    })), [types, rooms]);

    const roomsInView = selectedType ? rooms.filter((r) => r.type === selectedType) : [];

    function openAdd() {
        setDraft({ ...emptyDraft, type: selectedType || '' });
        setAddOpen(true);
    }

    function submitAdd(e: FormEvent) {
        e.preventDefault();
        if (!draft.number.trim() || !draft.type.trim() || !draft.rent) return;
        setRooms((prev) => [
            ...prev,
            {
                id: Date.now(),
                number: draft.number.trim(),
                type: draft.type.trim(),
                ac: draft.ac,
                rent: Number(draft.rent),
                status: draft.status as Room['status']
            },
        ]);
        setAddOpen(false);
    }

    function openRoom(room: Room) {
        setSelectedRoom(room);
        setEditing(false);
    }

    function startEdit() {
        if (!selectedRoom) return; // Guard clause solves 'possibly null' issues
        setDraft({
            number: selectedRoom.number,
            type: selectedRoom.type,
            ac: selectedRoom.ac,
            rent: String(selectedRoom.rent),
            status: selectedRoom.status
        });
        setEditing(true);
    }

    function saveEdit(e: FormEvent) {
        e.preventDefault();
        if (!selectedRoom) return;
        const updatedRent = Number(draft.rent);

        setRooms((prev) => prev.map((r) => (r.id === selectedRoom.id ? { ...r, ...draft, rent: updatedRent, status: draft.status as Room['status'] } : r)));
        setSelectedRoom((r) => r ? { ...r, ...draft, rent: updatedRent, status: draft.status as Room['status'] } : null);
        setEditing(false);
    }

    function deleteRoom(id: number) {
        setRooms((prev) => prev.filter((r) => r.id !== id));
        setSelectedRoom(null);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-5 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        {selectedType ? (
                            <button
                                onClick={() => setSelectedType(null)}
                                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                            >
                                <ArrowLeft size={15} /> All room types
                            </button>
                        ) : null}
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2.5">
                            <Bed className="text-blue-400" size={26} />
                            {selectedType ? `${selectedType} Rooms` : 'Rooms Management'}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {selectedType
                                ? `${roomsInView.length} room${roomsInView.length === 1 ? '' : 's'} of this type`
                                : 'Tap a room type to see every room, tap a room to see its details.'}
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        <Plus size={18} /> Add Room
                    </button>
                </div>

                {/* TYPE GRID VIEW */}
                {!selectedType && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {typeSummary.map((t, i) => {
                            const theme = THEMES[i % THEMES.length];
                            return (
                                <button
                                    key={t.type}
                                    onClick={() => setSelectedType(t.type)}
                                    className={`text-left rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 transition-all hover:-translate-y-0.5 ${theme.border} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.icon}`}>
                                        <Bed size={19} />
                                    </div>
                                    <div className="font-bold text-lg">{t.type}</div>
                                    <div className="text-slate-400 text-sm mt-0.5">{t.count} room${t.count === 1 ? '' : 's'}</div>
                                    <div className="text-emerald-400 text-xs mt-2">{t.available} available</div>
                                </button>
                            );
                        })}
                        <button
                            onClick={openAdd}
                            className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-blue-400 p-5 min-h-[140px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                                <Plus size={18} />
                            </div>
                            <span className="text-sm font-medium">Add Room</span>
                        </button>
                    </div>
                )}

                {/* ROOMS OF SELECTED TYPE */}
                {selectedType && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {roomsInView.map((room) => {
                            const s = STATUS[room.status] || STATUS.available;
                            return (
                                <button
                                    key={room.id}
                                    onClick={() => openRoom(room)}
                                    className={`relative aspect-[8/5] rounded-xl border bg-gradient-to-br ${s.card} p-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
                                >
                                    <div className="w-6 h-4 rounded-sm bg-gradient-to-br from-amber-300 to-amber-600 opacity-80" />
                                    <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wide text-slate-400">{room.type}</div>
                                    <div className="font-mono text-xl font-bold mt-3 tracking-wider">{room.number}</div>
                                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                        <span className="text-[10px] text-slate-400">{s.label}</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30 rounded-b-xl" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ROOM DETAILS MODAL */}
                {selectedRoom && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative">
                            <button
                                onClick={() => setSelectedRoom(null)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            >
                                <X size={18} />
                            </button>

                            {!editing ? (
                                <>
                                    <div className="font-mono text-3xl font-bold tracking-wider">{selectedRoom.number}</div>
                                    <div className="text-slate-400 text-sm mb-5">{selectedRoom.type} room</div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                            <span className="flex items-center gap-2 text-slate-400"><Snowflake size={15} /> AC status</span>
                                            <span>{selectedRoom.ac ? 'Air Conditioned' : 'Non-AC'}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                            <span className="flex items-center gap-2 text-slate-400"><DollarSign size={15} /> Rent (daily)</span>
                                            <span>${Number(selectedRoom.rent).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Status</span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full border ${(STATUS[selectedRoom.status] || STATUS.available).pill}`}>
                                                {(STATUS[selectedRoom.status] || STATUS.available).label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={startEdit}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
                                        >
                                            <Pencil size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => deleteRoom(selectedRoom.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 text-sm font-medium py-2.5 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <RoomForm draft={draft} setDraft={setDraft} types={types} onSubmit={saveEdit} submitLabel="Save changes" onCancel={() => setEditing(false)} />
                            )}
                        </div>
                    </div>
                )}

                {/* ADD ROOM MODAL */}
                {addOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative">
                            <button
                                onClick={() => setAddOpen(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            >
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18} className="text-blue-400" /> Add Room</h2>
                            <RoomForm draft={draft} setDraft={setDraft} types={types} onSubmit={submitAdd} submitLabel="Add Room" onCancel={() => setAddOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Strictly Typed Props interface for the child component
interface RoomFormProps {
    draft: RoomDraft;
    setDraft: React.Dispatch<React.SetStateAction<RoomDraft>>;
    types: string[];
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
    onCancel: () => void;
}

function RoomForm({ draft, setDraft, types, onSubmit, submitLabel, onCancel }: RoomFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <label className="block text-xs text-slate-400 mb-1.5">Room number</label>
                <input
                    value={draft.number}
                    onChange={(e) => setDraft({ ...draft, number: e.target.value })}
                    placeholder="e.g. 1004"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    required
                />
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1.5">Room type</label>
                <input
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                    placeholder="e.g. Single, Double, Suite"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    required
                />
                {types.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {types.map((t) => (
                            <button
                                type="button"
                                key={t}
                                onClick={() => setDraft({ ...draft, type: t })}
                                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1.5">Rent (daily)</label>
                    <input
                        type="number"
                        value={draft.rent}
                        onChange={(e) => setDraft({ ...draft, rent: e.target.value })}
                        placeholder="1000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        required
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                    <select
                        value={draft.status}
                        onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setDraft({ ...draft, ac: !draft.ac })}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-colors ${draft.ac ? 'bg-blue-500/15 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
                <Snowflake size={15} /> {draft.ac ? 'Air Conditioned' : 'Non-AC'}
            </button>

            <div className="flex gap-2 pt-1">
                <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-colors">
                    Cancel
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                    <Check size={15} /> {submitLabel}
                </button>
            </div>
        </form>
    );
}