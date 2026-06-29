"use client";
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
    getRooms, 
    getRoomTypes, 
    createRoom, 
    updateRoom, 
    deleteRoom, 
    updateRoomType, 
    createRoomType,
    Room as ApiRoom, 
    RoomType as ApiRoomType 
} from '../lib/api';
import { Bed, Plus, ArrowLeft, X, Snowflake, Trash2, Pencil, Check, DollarSign } from 'lucide-react';

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
    const [rooms, setRooms] = useState<Room[]>([]);
    const [apiRoomTypes, setApiRoomTypes] = useState<ApiRoomType[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [editingRoomType, setEditingRoomType] = useState<ApiRoomType | null>(null);
    const [draftRoomType, setDraftRoomType] = useState<Partial<ApiRoomType>>({});
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<RoomDraft>(emptyDraft);
    const [addOpen, setAddOpen] = useState<boolean>(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [fetchedRooms, fetchedTypes] = await Promise.all([
                getRooms(),
                getRoomTypes()
            ]);
            setApiRoomTypes(fetchedTypes);

            const mappedRooms: Room[] = fetchedRooms.map(r => {
                const typeObj = fetchedTypes.find(t => t.id === r.room_type);
                return {
                    id: r.id,
                    number: r.room_no,
                    type: typeObj ? typeObj.category : (r.room_type_name || "Unknown"),
                    ac: typeObj ? typeObj.is_ac === "AC" : false,
                    // Prioritize room-specific rent if your API supports it, fallback to typeObj rent
                    rent: (r as any).rent ? Number((r as any).rent) : (typeObj ? Number(typeObj.rent) : 0),
                    status: r.status ? (r.status.toLowerCase() as Room['status']) : 'available'
                };
            });
            setRooms(mappedRooms);
        } catch (error) {
            console.error("Failed to load rooms data", error);
        }
    };

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSelectedRoom(null);
                setAddOpen(false);
                setEditingRoomType(null);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const types = useMemo(() => apiRoomTypes.map(t => t.category), [apiRoomTypes]);

    const typeSummary = useMemo(() => apiRoomTypes.map((t) => ({
        roomType: t,
        type: t.category,
        count: rooms.filter((r) => r.type === t.category).length,
        available: rooms.filter((r) => r.type === t.category && r.status === 'available').length,
    })), [apiRoomTypes, rooms]);

    const roomsInView = selectedType ? rooms.filter((r) => r.type === selectedType) : [];

    function openAdd() {
        setDraft({ ...emptyDraft, type: selectedType || '' });
        setAddOpen(true);
    }

    // Helper function to resolve or create a Room Type based on user text entry
    async function handleRoomTypeResolution(typeName: string): Promise<number> {
        const trimmedName = typeName.trim();
        let existingType = apiRoomTypes.find(t => t.category.toLowerCase() === trimmedName.toLowerCase());
        
        if (!existingType) {
            // Automatically generate a new room type if the user typed an unlisted one
            const newType = await createRoomType({
                category: trimmedName,
                is_ac: draft.ac ? "AC" : "NON_AC",
                rent: draft.rent || "0",
                active: true
            });
            return newType.id;
        }
        return existingType.id;
    }

    async function submitAdd(e: FormEvent) {
        e.preventDefault();
        if (!draft.number.trim() || !draft.type.trim()) return;

        try {
            const roomTypeId = await handleRoomTypeResolution(draft.type);

            await createRoom({
                room_no: draft.number.trim(),
                room_type: roomTypeId,
                status: draft.status.toUpperCase() as any,
                active: true,
                ...({ rent: draft.rent } as any) // Passes room rent separately to the endpoint
            });
            await loadData();
            setAddOpen(false);
        } catch (error) {
            console.error("Failed to create room", error);
            alert("Failed to create room. Please try again.");
        }
    }

    function openRoom(room: Room) {
        setSelectedRoom(room);
        setEditing(false);
    }

    function startEdit() {
        if (!selectedRoom) return;
        setDraft({
            number: selectedRoom.number,
            type: selectedRoom.type,
            ac: selectedRoom.ac,
            rent: String(selectedRoom.rent),
            status: selectedRoom.status
        });
        setEditing(true);
    }

    async function saveEdit(e: FormEvent) {
        e.preventDefault();
        if (!selectedRoom) return;

        try {
            const roomTypeId = await handleRoomTypeResolution(draft.type);

            const updatePayload: any = {
                room_type: roomTypeId,
                status: draft.status.toUpperCase(),
                active: true,
                rent: draft.rent // Updates room rent separately
            };

            if (draft.number.trim() !== selectedRoom.number) {
                updatePayload.room_no = draft.number.trim();
            }

            await updateRoom(selectedRoom.id, updatePayload);
            await loadData();
            setSelectedRoom(null);
            setEditing(false);
        } catch (error: any) {
            console.error("Failed to update room", error.response?.data || error);
            const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Failed to update room: ${errMsg}`);
        }
    }

    async function deleteRoomId(id: number) {
        try {
            await deleteRoom(id);
            await loadData();
            setSelectedRoom(null);
        } catch (error: any) {
            console.error("Failed to delete room", error.response?.data || error);
            const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Failed to delete room: ${errMsg}`);
        }
    }

    async function saveRoomType(e: FormEvent) {
        e.preventDefault();
        if (!editingRoomType) return;
        try {
            await updateRoomType(editingRoomType.id, draftRoomType);
            await loadData();
            setEditingRoomType(null);
        } catch (error: any) {
            console.error("Failed to update room type", error.response?.data || error);
            const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Failed to update room type: ${errMsg}`);
        }
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
                                : 'Hover a room type card to edit it or view its rooms.'}
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
                                <div
                                    key={t.type}
                                    className={`group relative text-left rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 transition-all hover:-translate-y-0.5 ${theme.border}`}
                                >
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity rounded-2xl z-10">
                                        <button
                                            onClick={() => {
                                                setEditingRoomType(t.roomType);
                                                setDraftRoomType({ category: t.roomType.category, rent: t.roomType.rent, is_ac: t.roomType.is_ac });
                                            }}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-xl flex items-center gap-2 text-sm w-3/4 justify-center transition-colors"
                                        >
                                            <Pencil size={15} /> Edit Type
                                        </button>
                                        <button
                                            onClick={() => setSelectedType(t.type)}
                                            className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-xl flex items-center gap-2 text-sm w-3/4 justify-center transition-colors"
                                        >
                                            <Bed size={15} /> View Rooms
                                        </button>
                                    </div>

                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${theme.icon}`}>
                                        <Bed size={19} />
                                    </div>
                                    <div className="font-bold text-lg">{t.type}</div>
                                    <div className="text-slate-400 text-sm mt-0.5">{t.count} room{t.count === 1 ? '' : 's'}</div>
                                    <div className="text-emerald-400 text-xs mt-2">{t.available} available</div>
                                </div>
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
                                    <div className="font-mono text-xl font-bold mt-2 tracking-wider">{room.number}</div>
                                    <div className="text-xs text-blue-400 font-semibold mt-0.5">Rent: ₹{room.rent}</div>
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
                                            <span className="text-slate-400">Room Rent</span>
                                            <span className="text-blue-400 font-semibold">₹{selectedRoom.rent}</span>
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
                                            onClick={() => deleteRoomId(selectedRoom.id)}
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

                {/* EDIT ROOM TYPE MODAL */}
                {editingRoomType && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative">
                            <button
                                onClick={() => setEditingRoomType(null)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                            >
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Pencil size={18} className="text-blue-400" /> Edit Room Type</h2>
                            <form onSubmit={saveRoomType} className="space-y-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Category Name</label>
                                    <input
                                        value={draftRoomType.category || ''}
                                        onChange={(e) => setDraftRoomType({ ...draftRoomType, category: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">Default Type Rent Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={draftRoomType.rent || ''}
                                        onChange={(e) => setDraftRoomType({ ...draftRoomType, rent: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1.5">AC Status</label>
                                    <select
                                        value={draftRoomType.is_ac || 'NON_AC'}
                                        onChange={(e) => setDraftRoomType({ ...draftRoomType, is_ac: e.target.value as 'AC' | 'NON_AC' })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                                    >
                                        <option value="AC">Air Conditioned (AC)</option>
                                        <option value="NON_AC">Non-AC</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={() => setEditingRoomType(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                                        <Check size={15} /> Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

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
                <label className="block text-xs text-slate-400 mb-1.5">Room type (Type to add new or select)</label>
                <input
                    list="room-types-list"
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                    placeholder="Select or type a room type..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    required
                />
                <datalist id="room-types-list">
                    {types.map(t => <option key={t} value={t} />)}
                </datalist>
                
                {types.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {types.map((t) => (
                            <button
                                type="button"
                                key={t}
                                onClick={() => setDraft({ ...draft, type: t })}
                                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs text-slate-400 mb-1.5">Room-Specific Rent Amount (Daily)</label>
                <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1500"
                    value={draft.rent}
                    onChange={(e) => setDraft({ ...draft, rent: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    required
                />
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                <input
                    type="checkbox"
                    id="room-ac-checkbox"
                    checked={draft.ac}
                    onChange={(e) => setDraft({ ...draft, ac: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="room-ac-checkbox" className="text-xs text-slate-300 select-none cursor-pointer">
                    Enable Air Conditioning (AC) for this new type
                </label>
            </div>

            <div>
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