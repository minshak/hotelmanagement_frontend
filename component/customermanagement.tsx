"use client";

import api from "../lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard
} from "lucide-react";

interface Customer {
  id: number;
  customer_code: string;
  name: string;
  mobile: string;
  email: string;
  idType: string;
  proof: string;
  address: string;
  active: boolean;
}

export default function CustomerManagement() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState<Customer>({
    id: 0,
    customer_code: "",
    name: "",
    mobile: "",
    email: "",
    idType: "",
    proof: "",
    address: "",
    active: true,
  });

  const fetchCustomers = async () => {
    try {
      const response = await api.get(
        "/master/customers/"
      );

      const customerData = response.data.map((customer: any) => ({
        id: customer.id,
        customer_code: customer.customer_code,
        name: customer.customer_name,
        mobile: customer.mobile_no,
        email: customer.email || "",
        idType: customer.id_type,
        proof: customer.id_proof || "",
        address: customer.address,
        active: customer.is_active,
      }));

      setCustomers(customerData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setSelectedFile(null);
    setFormData({
      id: 0,
      customer_code: "",
      name: "",
      mobile: "",
      email: "",
      idType: "",
      proof: "",
      address: "",
      active: true,
    });
    setOpenModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setSelectedFile(null);
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const form = new FormData();
      form.append("customer_name", formData.name);
      form.append("mobile_no", formData.mobile);
      form.append("email", formData.email);
      form.append("address", formData.address);
      form.append("id_type", formData.idType);
      form.append("is_active", String(formData.active));

      if (selectedFile) {
        form.append("id_proof", selectedFile);
      }

      if (editingCustomer) {
        form.append("customer_code", editingCustomer.customer_code);
        await api.patch(
          `/master/customers/${editingCustomer.id}/`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        form.append(
          "customer_code",
          `CST-${Math.floor(1000 + Math.random() * 9000)}`
        );
        await api.post(
          "/master/customers/",
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      fetchCustomers();
      setOpenModal(false);
      setEditingCustomer(null);
    } catch (error: any) {
      console.error("API Error:", error.response?.data || error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer record?")) return;
    try {
      await api.delete(`/master/customers/${id}/`);
      fetchCustomers();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const toggleStatus = async (customer: Customer) => {
    try {
      const form = new FormData();
      form.append("is_active", String(!customer.active));
      await api.patch(
        `/master/customers/${customer.id}/`,
        form
      );
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, active: !c.active } : c))
      );
    } catch (error) {
      console.error("Failed to toggle active status", error);
    }
  };

  // Navigates directly to the check-in module passing customer data
  const handleCheckInRedirect = (customer: Customer) => {
    const queryParams = new URLSearchParams({
      customerId: String(customer.id),
      customerName: customer.name,
      customerCode: customer.customer_code
    }).toString();
    
    router.push(`/checkin?${queryParams}`);
  };

  return (
    <div className="min-h-screen bg-[#020b2d] text-white p-6 font-sans">
      <div className="max-w-6xl w-full mx-auto space-y-8 mt-4">
        
        {/* Top Header Row Layout */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Customer Management</h1>
            <p className="text-gray-400 mt-1 font-light">
              Review, monitor, and manage corporate accounts and system profiles.
            </p>
            <span className="inline-block mt-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-full font-medium">
              {customers.length} registered entries
            </span>
          </div>

          <button
            onClick={handleAddCustomer}
            className="self-start md:self-center bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-bold tracking-wide transition shadow-lg shadow-blue-600/10"
          >
            <Plus size={18} className="stroke-[2.5]" />
            ADD CUSTOMER
          </button>
        </div>

        {/* Customer Data Display Card System Grid */}
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-[#08133d] to-[#071028] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Identification and Toggle Header Block */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg">
                      {customer.name ? customer.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg tracking-tight text-white">{customer.name}</h3>
                      <p className="text-blue-400 text-xs font-mono mt-0.5">{customer.customer_code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(customer)}
                      className={`w-10 h-5 rounded-full relative transition ${
                        customer.active ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                          customer.active ? "right-0.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Information Segment Matrices */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-slate-800/60 pt-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-0.5">Mobile</span>
                    <span className="text-gray-200 font-medium flex items-center gap-1"><Phone size={12} className="text-slate-500" />{customer.mobile || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-0.5">Email</span>
                    <span className="text-gray-200 font-medium flex items-center gap-1 truncate"><Mail size={12} className="text-slate-500" />{customer.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-0.5">ID Type</span>
                    <span className="mt-1 inline-block bg-[#16224f] text-slate-300 px-2 py-0.5 rounded border border-[#263870] font-semibold text-[10px]">
                      {customer.idType || "NONE"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-0.5">Verification</span>
                    <div className="mt-1.5 flex items-center">
                      {customer.proof ? (
                        <a href={customer.proof} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 font-medium">
                          <Eye size={14} /> View File
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Unattached</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-800/60 pt-3 text-xs">
                  <span className="text-gray-400 font-medium block uppercase tracking-wider text-[10px] mb-0.5">Address</span>
                  <span className="text-gray-200 font-medium flex items-start gap-1"><MapPin size={12} className="text-slate-500 mt-0.5 shrink-0" />{customer.address || "No address on file"}</span>
                </div>
              </div>

              {/* Functional Row Layout Operations Area containing connection link */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-6 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCustomer(customer)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 transition border border-slate-700"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 px-3 py-2 rounded-xl text-xs font-semibold transition border border-red-900/40"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>

                {/* Direct workflow bridge execution connector linking to Checkin module */}
                <button
                  type="button"
                  onClick={() => handleCheckInRedirect(customer)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/20"
                >
                  <LogOut size={13} className="rotate-180" />
                  CHECK IN
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Sheet Structure Area */}
        {openModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="rounded-3xl border border-blue-500/30 bg-[#08133d] w-full max-w-xl p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-400" />
                  {editingCustomer ? "Edit Customer Record" : "Register New Customer"}
                </h2>
                <button onClick={() => setOpenModal(false)} className="text-slate-400 hover:text-white p-1 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block pl-1">Full Name</label>
                  <input
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block pl-1">Mobile Number</label>
                  <input
                    name="mobile"
                    placeholder="+1 555-0199"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block pl-1">Email Address</label>
                  <input
                    name="email"
                    placeholder="example@domain.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block pl-1">ID Type Verification</label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white text-sm appearance-none"
                  >
                    <option value="">Select identification type</option>
                    <option value="PASSPORT">Passport File</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="NATIONAL_ID">National Card</option>
                    <option value="CORPORATE_ID">Corporate Identifier</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block pl-1">Upload ID File Proof</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl px-2 py-2 focus:outline-none focus:border-blue-500 text-white text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block pl-1">Physical Address</label>
                  <input
                    name="address"
                    placeholder="Street, City, Country, ZIP"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-[#0d1735] border border-[#233766] rounded-xl p-3 focus:outline-none focus:border-blue-500 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 border-t border-slate-800 pt-4">
                <button
                  onClick={() => setOpenModal(false)}
                  className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide py-3 rounded-xl transition text-sm shadow-md"
                >
                  {editingCustomer ? "UPDATE RECORD" : "CREATE CUSTOMER"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}