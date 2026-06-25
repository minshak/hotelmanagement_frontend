"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import { Pencil, Trash2Pencil, Trash2, Plus, Eye } from "lucide-react";

interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  mobile_no: string;
  email: string;
  address: string;
  id_type: string;
  id_proof: string;
  is_active: boolean;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [sortOrder, setSortOrder] = useState<
  "default" | "asc" | "desc"
>("default");

  const [formData, setFormData] = useState({
    customer_name: "",
    mobile_no: "",
    email: "",
    address: "",
    id_type: "",
    id_proof: null as File | null,
  });

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/master/customers/");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = () => {
    setEditingCustomer(null);

    setFormData({
      customer_name: "",
      mobile_no: "",
      email: "",
      address: "",
      id_type: "",
      id_proof: null,
    });

    setOpenModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    setFormData({
      customer_name: customer.customer_name,
      mobile_no: customer.mobile_no,
      email: customer.email,
      address: customer.address,
      id_type: customer.id_type,
      id_proof: null,
    });

    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      const form = new FormData();

      form.append("customer_name", formData.customer_name);
      form.append("mobile_no", formData.mobile_no);
      form.append("email", formData.email);
      form.append("address", formData.address);
      form.append("id_type", formData.id_type);

      if (formData.id_proof) {
        form.append("id_proof", formData.id_proof);
      }

      if (editingCustomer) {
        await api.patch(
          `/master/customers/${editingCustomer.id}/`,
          form,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        form.append("customer_code", `CST-${Date.now()}`);

        await api.post("/master/customers/", form, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      fetchCustomers();
      setOpenModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete customer?")) return;

    try {
      await api.delete(`/master/customers/${id}/`);
      fetchCustomers();
    } catch (error) {
      console.error(error);
    }
  };
const filteredCustomers = [...customers]
  .filter(
    (customer) =>
      customer.customer_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      customer.mobile_no.includes(search) ||
      customer.customer_code
        .toLowerCase()
        .includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (sortOrder === "asc") {
      return a.customer_name.localeCompare(b.customer_name);
    }

    if (sortOrder === "desc") {
      return b.customer_name.localeCompare(a.customer_name);
    }

    return 0; 
  });

  return (
    <div className="p-6 bg-[#020b2d] min-h-screen text-white">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Customer Management</h1>

        <button
          onClick={handleAdd}
          className="bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} />
          Add Customer
        </button>
      </div>
<div className="flex gap-3 mb-4">
  <input
    placeholder="Search customer..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-1 p-3 rounded-lg bg-slate-800"
  />

  <select
    value={sortOrder}
    onChange={(e) =>
      setSortOrder(
        e.target.value as "default" | "asc" | "desc"
      )
    }
    className="p-3 rounded-lg bg-slate-800"
  >
    <option value="default">
      Customer Arrival Order
    </option>
    <option value="asc">
      Customer Name (A-Z)
    </option>
    <option value="desc">
      Customer Name (Z-A)
    </option>
  </select>
</div>
      
      <div className="overflow-auto rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-800">
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">ID Type</th>
              <th className="p-3 text-left">Proof</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-700">
                <td className="p-3">{customer.customer_code}</td>
                <td className="p-3">{customer.customer_name}</td>
                <td className="p-3">{customer.mobile_no}</td>
                <td className="p-3">{customer.email}</td>
                <td className="p-3">{customer.id_type}</td>

                <td className="p-3">
                  {customer.id_proof ? (
                    <a
                      href={customer.id_proof}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400"
                    >
                      <Eye size={18} />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="bg-yellow-600 p-2 rounded"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="bg-red-600 p-2 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-xl w-[500px]">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </h2>

            <div className="space-y-3">
              <input
                placeholder="Name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData({ ...formData, customer_name: e.target.value })
                }
                className="w-full p-3 bg-slate-800 rounded"
              />

              <input
                placeholder="Mobile"
                value={formData.mobile_no}
                onChange={(e) =>
                  setFormData({ ...formData, mobile_no: e.target.value })
                }
                className="w-full p-3 bg-slate-800 rounded"
              />

              <input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-3 bg-slate-800 rounded"
              />

              <input
                placeholder="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full p-3 bg-slate-800 rounded"
              />

              {/* ID TYPE DROPDOWN */}
              <select
                value={formData.id_type}
                onChange={(e) =>
                  setFormData({ ...formData, id_type: e.target.value })
                }
                className="w-full p-3 bg-slate-800 rounded"
              >
                <option value="">Select ID Type</option>
                <option value="AADHAR">Aadhar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="PASSPORT">Passport</option>
              </select>

              {/* FILE UPLOAD */}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    id_proof: e.target.files?.[0] || null,
                  })
                }
                className="w-full p-3 bg-slate-800 rounded"
              />
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOpenModal(false)}
                className="flex-1 bg-slate-700 py-3 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 py-3 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}