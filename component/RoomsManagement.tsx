"use client";

import { useEffect, useState } from "react";
import {
  getRoomTypes,
  getRooms,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  createRoom,
  updateRoom,
  deleteRoom,
  RoomType,
  Room,
} from "../lib/api";
import { 
  Bed, 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Snowflake, 
  DollarSign, 
  CheckCircle2 
} from "lucide-react";

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Modal Visibility States
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);

  // Form States
  const [newType, setNewType] = useState({ category: "", is_ac: "AC" as "AC" | "NON_AC", rent: "", active: true });
  const [newRoom, setNewRoom] = useState({ room_no: "", room_type: "", status: "AVAILABLE" as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE", active: true });
  const [editRoomData, setEditRoomData] = useState<Partial<Room>>({});
  const [editTypeData, setEditTypeData] = useState<Partial<RoomType>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const types = await getRoomTypes();
      const roomData = await getRooms();
      setRoomTypes(types || []);
      setRooms(roomData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // --- ACTIONS ---
  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.category || !newType.rent) return alert("Please fill all fields");
    try {
      await createRoomType(newType);
      setNewType({ category: "", is_ac: "AC", rent: "", active: true });
      setShowAddTypeModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to create room category.");
    }
  };

  const handleUpdateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    try {
      const updated = await updateRoomType(selectedType.id, editTypeData);
      setSelectedType(updated);
      setIsEditingType(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to update category settings.");
    }
  };

  // UPDATED: Handles clean cascade deletion or normal deletion
  const handleDeleteRoomType = async (id: number) => {
    const connectedRooms = rooms.filter((r) => r.room_type === id);
    
    if (connectedRooms.length > 0) {
      // Prompt user if they want to clear everything out dynamically
      const cascadeConfirm = confirm(
        `This category has ${connectedRooms.length} room(s) linked to it.\n\nWould you like to delete all associated rooms first and then remove this category?`
      );
      
      if (!cascadeConfirm) return;

      try {
        // Delete all rooms attached to this category
        await Promise.all(connectedRooms.map((room) => deleteRoom(room.id)));
      } catch (err) {
        console.error("Error clearing child rooms:", err);
        return alert("Failed to clear out individual rooms. Aborting deletion.");
      }
    } else {
      // Normal confirmation fallback if no rooms are attached
      if (!confirm("Delete this category permanently?")) return;
    }

    try {
      await deleteRoomType(id);
      setSelectedType(null);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Server Error (500): Could not delete category. Verify your backend constraints.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTypeId = selectedType ? selectedType.id : Number(newRoom.room_type);
    if (!newRoom.room_no || !targetTypeId) return alert("Please specify room details completely");
    try {
      await createRoom({
        room_no: newRoom.room_no,
        room_type: targetTypeId,
        status: newRoom.status,
        active: newRoom.active,
      });
      setNewRoom({ room_no: "", room_type: "", status: "AVAILABLE", active: true });
      setShowAddRoomModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to deploy new room.");
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    try {
      const updated = await updateRoom(selectedRoom.id, editRoomData);
      setSelectedRoom(updated);
      setIsEditingRoom(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to update room configuration.");
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteRoom(id);
      setSelectedRoom(null);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete room item.");
    }
  };

  const filteredRooms = selectedType
    ? rooms.filter((room) => room.room_type === selectedType.id)
    : [];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-10 font-sans selection:bg-blue-500/30">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center mb-10">
        <div>
          {!selectedType ? (
            <>
              <div className="flex items-center gap-3">
                <Bed className="w-8 h-8 text-blue-400" />
                <h1 className="text-4xl font-extrabold tracking-tight">Rooms Management</h1>
              </div>
              <p className="text-sm text-slate-400 mt-2">Tap a room type to see every room, tap a room to see its details.</p>
            </>
          ) : (
            <>
              <button onClick={() => setSelectedType(null)} className="text-sm text-slate-400 hover:text-white mb-2 flex items-center gap-1 transition">
                &larr; All room types
              </button>
              <div className="flex items-center gap-4">
                <Bed className="w-8 h-8 text-blue-400" />
                <h1 className="text-4xl font-extrabold tracking-tight">{selectedType.category} Rooms</h1>
              </div>
              <p className="text-sm text-slate-400 mt-1">{filteredRooms.length} rooms of this type</p>
            </>
          )}
        </div>

        <button 
          onClick={() => selectedType ? setShowAddRoomModal(true) : setShowAddTypeModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Room
        </button>
      </div>

      {/* --- ROOM TYPES GRID VIEW --- */}
      {!selectedType && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roomTypes.map((type, idx) => {
            const count = rooms.filter((r) => r.room_type === type.id).length;
            const available = rooms.filter((r) => r.room_type === type.id && r.status === "AVAILABLE").length;
            const icons = ["text-blue-400 bg-blue-950/40", "text-purple-400 bg-purple-950/40", "text-amber-400 bg-amber-950/40"];

            return (
              <div
                key={type.id}
                onClick={() => { setSelectedType(type); setEditTypeData(type); }}
                className="cursor-pointer rounded-2xl border border-slate-800/80 p-6 bg-[#0b1329]/50 hover:bg-[#0b1329] hover:border-slate-700 transition-all duration-200 group relative"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${icons[idx % 3]}`}>
                  <Bed className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-wide text-white group-hover:text-blue-400 transition-colors">{type.category}</h2>
                <p className="text-slate-400 text-sm mt-1">{count} rooms</p>
                <p className="text-emerald-400 text-sm font-medium mt-3">{available} available</p>
              </div>
            );
          })}

          {/* Dotted Placeholder to Create New Type */}
          <div 
            onClick={() => setShowAddTypeModal(true)}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-600 bg-transparent py-12 flex flex-col items-center justify-center gap-3 transition"
          >
            <div className="w-10 h-10 border border-dashed border-slate-600 rounded-xl flex items-center justify-center text-slate-400">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm text-slate-400 font-medium">Add Room Type</span>
          </div>
        </div>
      )}

      {/* --- INDIVIDUAL ROOMS LIST VIEW --- */}
      {selectedType && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const isAvailable = room.status === "AVAILABLE";
              return (
                <div
                  key={room.id}
                  onClick={() => { setSelectedRoom(room); setEditRoomData(room); setIsEditingRoom(false); }}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all ${
                    isAvailable 
                      ? "bg-gradient-to-br from-[#0f2430] to-[#0b1329] border-emerald-950/50 hover:border-emerald-500/50" 
                      : "bg-gradient-to-br from-[#1e1625] to-[#0b1329] border-amber-950/50 hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-5 rounded bg-amber-500/90 shadow-sm" />
                    <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">{selectedType.category}</span>
                  </div>
                  <h2 className="text-4xl font-black mt-6 tracking-wider text-slate-100 font-mono">{room.room_no}</h2>
                  <div className="mt-6 flex justify-end items-center gap-1.5 text-xs font-semibold">
                    <span className={isAvailable ? "text-emerald-400" : "text-amber-400"}>&bull;</span>
                    <span className={isAvailable ? "text-emerald-400/90" : "text-amber-400/90"}>
                      {room.status.charAt(0) + room.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="mt-12 flex gap-4 border-t border-slate-900 pt-6">
            <button onClick={() => setIsEditingType(true)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Category Settings
            </button>
            <button onClick={() => handleDeleteRoomType(selectedType.id)} className="bg-red-950/40 hover:bg-red-950/80 border border-red-900/30 text-red-400 px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Category
            </button>
          </div>
        </>
      )}

      {/* --- DETAILED DIALOG / MODAL --- */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl w-full max-w-[480px] shadow-2xl relative">
            
            <button 
              onClick={() => { setSelectedRoom(null); setIsEditingRoom(false); }} 
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {!isEditingRoom ? (
              <>
                <h2 className="text-5xl font-black tracking-wider text-white font-mono">{selectedRoom.room_no}</h2>
                <p className="text-slate-400 font-medium text-base mt-1">{selectedType?.category} room</p>

                <div className="mt-8 space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-blue-400" /> AC status
                    </span>
                    <span className="text-white font-medium">{selectedType?.is_ac === "AC" ? "Air Conditioned" : "Non-AC"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-800/80 pt-4">
                    <span className="text-slate-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Rent (daily)
                    </span>
                    <span className="text-white font-bold text-base font-mono">${selectedType?.rent}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-800/80 pt-4">
                    <span className="text-slate-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" /> Status
                    </span>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-wide ${
                      selectedRoom.status === "AVAILABLE" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                    }`}>
                      {selectedRoom.status.charAt(0) + selectedRoom.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={() => { setEditRoomData(selectedRoom); setIsEditingRoom(true); }} 
                    className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700/60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(selectedRoom.id)} 
                    className="bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-red-200 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            ) : (
              /* Inline Room Edit View */
              <form onSubmit={handleUpdateRoom} className="space-y-4">
                <h3 className="text-xl font-bold mb-4 text-white">Edit Room Settings</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Room Number</label>
                  <input
                    type="text"
                    value={editRoomData.room_no || ""}
                    onChange={(e) => setEditRoomData({ ...editRoomData, room_no: e.target.value })}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Status Flag</label>
                  <select
                    value={editRoomData.status || "AVAILABLE"}
                    onChange={(e) => setEditRoomData({ ...editRoomData, status: e.target.value as any })}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditingRoom(false)} className="bg-slate-800 text-white py-2.5 rounded-xl text-sm">Cancel</button>
                  <button type="submit" className="bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold">Save Configuration</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- ADD NEW CATEGORY MODAL --- */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateRoomType} className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl w-full max-w-[440px] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Create Room Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category Profile Name</label>
                <input
                  type="text"
                  placeholder="e.g. Single, Double, Executive Suite"
                  value={newType.category}
                  onChange={(e) => setNewType({ ...newType, category: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Base Price Rate (Daily)</label>
                <input
                  type="number"
                  placeholder="Rent Value"
                  value={newType.rent}
                  onChange={(e) => setNewType({ ...newType, rent: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Climatic System Type</label>
                <select
                  value={newType.is_ac}
                  onChange={(e) => setNewType({ ...newType, is_ac: e.target.value as any })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none"
                >
                  <option value="AC">Air Conditioned</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button type="button" onClick={() => setShowAddTypeModal(false)} className="bg-slate-800 text-slate-300 py-3 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold">Build Class</button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD NEW ROOM UNIT MODAL --- */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateRoom} className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl w-full max-w-[440px] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Add New Room Space</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Room Index Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1001"
                  value={newRoom.room_no}
                  onChange={(e) => setNewRoom({ ...newRoom, room_no: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono outline-none focus:border-blue-500"
                />
              </div>

              {!selectedType && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Category Assignment</label>
                  <select
                    value={newRoom.room_type}
                    onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                    className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category...</option>
                    {roomTypes.map(t => <option key={t.id} value={t.id}>{t.category}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Initial Status Layout</label>
                <select
                  value={newRoom.status}
                  onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value as any })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button type="button" onClick={() => setShowAddRoomModal(false)} className="bg-slate-800 text-slate-300 py-3 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold">Deploy Room</button>
            </div>
          </form>
        </div>
      )}

      {/* --- EDIT CATEGORY MODAL --- */}
      {isEditingType && selectedType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateRoomType} className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl w-full max-w-[440px] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Category Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category Name</label>
                <input
                  type="text"
                  value={editTypeData.category || ""}
                  onChange={(e) => setEditTypeData({ ...editTypeData, category: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rent Amount</label>
                <input
                  type="number"
                  value={editTypeData.rent || ""}
                  onChange={(e) => setEditTypeData({ ...editTypeData, rent: e.target.value })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Climatic System Type</label>
                <select
                  value={editTypeData.is_ac || "AC"}
                  onChange={(e) => setEditTypeData({ ...editTypeData, is_ac: e.target.value as "AC" | "NON_AC" })}
                  className="w-full bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="AC">Air Conditioned</option>
                  <option value="NON_AC">Non-AC</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button type="button" onClick={() => setIsEditingType(false)} className="bg-slate-800 text-white py-2.5 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}