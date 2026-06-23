import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to automatically add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface RoomType {
  id: number;
  category: string;
  is_ac: "AC" | "NON_AC";
  rent: string;
  active: boolean;
}

export interface Room {
  id: number;
  room_no: string;
  room_type: number;
  room_type_name?: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  active: boolean;
}

export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  mobile_no: string;
  email?: string;
  address: string;
  id_type: string;
  id_proof: string;
  is_active: boolean;
}

export interface CheckIn {
  id: number;
  room: number;
  customer: number;
  customer_name?: string;
  room_no?: string;
  checkin_date: string;
  checkin_time: string;
  advance_amount: string;
  pending_amount: string;
  pay_mode: string;
  status: string;
  created_at: string;
}

export const getRooms = async (): Promise<Room[]> => {
  const response = await api.get<Room[]>("/master/rooms/");
  return response.data;
};

export const getRoomTypes = async (): Promise<RoomType[]> => {
  const response = await api.get<RoomType[]>("/master/room-types/");
  return response.data;
};

export const createRoom = async (roomData: Omit<Room, "id" | "room_type_name">): Promise<Room> => {
  const response = await api.post<Room>("/master/rooms/", roomData);
  return response.data;
};

export const updateRoom = async (id: number, roomData: Partial<Room>): Promise<Room> => {
  const response = await api.patch<Room>(`/master/rooms/${id}/`, roomData);
  return response.data;
};

export const deleteRoom = async (id: number): Promise<void> => {
  await api.delete(`/master/rooms/${id}/`);
};

export const getCheckIns = async (): Promise<CheckIn[]> => {
  const response = await api.get<CheckIn[]>("/reservations/checkins/");
  return response.data;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get<Customer[]>("/master/customers/");
  return response.data;
};

export default api;
