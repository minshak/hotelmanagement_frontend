import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Attach the bearer token safely
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token) {
        // Fallback-safe approach for attaching headers across all Axios versions
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request! Token may be expired or missing.");
      
      if (typeof window !== "undefined") {
        // Optional: Clear expired tokens and boot user to login page
        localStorage.removeItem("access");
        // window.location.href = "/login"; 
      }
    }
    return Promise.reject(error);
  }
);

/* ============================ TYPES ============================ */
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
  mobile_no?: string;
  room_no?: string;
  checkin_date: string;
  checkin_time: string;
  advance_amount: string;
  pending_amount: string;
  total_amount: string;
  pay_mode: "CASH" | "CARD" | "UPI" | "NET_BANKING";
  status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  remarks?: string | null;
  created_at: string;
}
export interface Checkout {
  id: number;
  checkin: number;
  checkout_date: string;
  checkout_time: string;
  total_days: number;
  balance_paid: string;
  pay_type: "CASH" | "CARD" | "UPI" | "NET_BANKING";
  remarks?: string | null;
  created_at: string;
}

/* ============================ ROOMS & ROOM TYPES CRUD ============================ */
export const getRooms = async (): Promise<Room[]> => {
  const response = await api.get<Room[]>("/master/rooms/");
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

export const getRoomTypes = async (): Promise<RoomType[]> => {
  const response = await api.get<RoomType[]>("/master/room-types/");
  return response.data;
};

export const createRoomType = async (roomTypeData: Omit<RoomType, "id">): Promise<RoomType> => {
  const response = await api.post<RoomType>("/master/room-types/", roomTypeData);
  return response.data;
};

export const updateRoomType = async (id: number, roomTypeData: Partial<RoomType>): Promise<RoomType> => {
  const response = await api.patch<RoomType>(`/master/room-types/${id}/`, roomTypeData);
  return response.data;
};

export const deleteRoomType = async (id: number): Promise<void> => {
  await api.delete(`/master/room-types/${id}/`);
};

/* ============================ CUSTOMER CRUD ============================ */
export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get<Customer[]>("/master/customers/");
  return response.data;
};

export const createCustomer = async (customerData: Omit<Customer, "id" | "customer_code">): Promise<Customer> => {
  const response = await api.post<Customer>("/master/customers/", customerData);
  return response.data;
};

export const updateCustomer = async (id: number, customerData: Partial<Customer>): Promise<Customer> => {
  const response = await api.patch<Customer>(`/master/customers/${id}/`, customerData);
  return response.data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/master/customers/${id}/`);
};

/* ============================ CHECK-IN CRUD ============================ */
export const getCheckIns = async (
  status: "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" = "CHECKED_IN"
): Promise<CheckIn[]> => {
  const response = await api.get<CheckIn[]>(
    `/reservations/checkins/?status=${status}`
  );
  return response.data;
};

export const createCheckIn = async (
  checkInData: Omit<CheckIn, "id" | "created_at" | "customer_name" | "room_no" | "mobile_no">
): Promise<CheckIn> => {
  const response = await api.post<CheckIn>("/reservations/checkins/", checkInData);
  return response.data;
};

export const updateCheckIn = async (id: number, checkInData: Partial<CheckIn>): Promise<CheckIn> => {
  const response = await api.patch<CheckIn>(`/reservations/checkins/${id}/`, checkInData);
  return response.data;
};

export const deleteCheckIn = async (id: number): Promise<void> => {
  await api.delete(`/reservations/checkins/${id}/`);
};

/* ============================ CHECKOUT CRUD ============================ */
export const getCheckouts = async (): Promise<Checkout[]> => {
  const response = await api.get<Checkout[]>("/reservations/checkouts/");
  return response.data;
};

export const getCheckout = async (): Promise<Checkout> => {
  const response = await api.get<Checkout>(`/reservations/checkouts/`);
  return response.data;
};

export const createCheckout = async (
  checkoutData: Omit<Checkout, "id" | "created_at">
): Promise<Checkout> => {
  const response = await api.post<Checkout>("/reservations/checkouts/", checkoutData);
  return response.data;
};

export const updateCheckout = async (
  checkoutData: Partial<Checkout>
): Promise<Checkout> => {
  const response = await api.patch<Checkout>(`/reservations/checkouts/`, checkoutData);
  return response.data;
};
export const deleteCheckout = async (): Promise<void> => {
  await api.delete(`/reservations/checkouts/`);
};
export default api;