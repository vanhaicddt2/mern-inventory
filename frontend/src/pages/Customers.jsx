import { useEffect, useState } from "react";
import { Plus, Search, X, UserRound } from "lucide-react";
import api from "../api/axios.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });

  const load = () => {
    api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => setCustomers(res.data || []))
      .catch(() => setCustomers([]));
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", note: "" });
    setModal(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      note: customer.note || "",
    });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing?._id) {
        await api.put(`/customers/${editing._id}`, form);
      } else {
        await api.post("/customers", form);
      }
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi lưu khách hàng");
    }
  };

  const removeCustomer = async (id) => {
    if (!confirm("Xóa khách hàng này?")) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Khách hàng</h1>
          <p className="text-slate-400 text-sm mt-1">Dữ liệu khách hàng để chọn nhanh khi tạo đơn bán. Mặc định vẫn có Khách lẻ.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm khách hàng
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input placeholder="Tìm theo tên, SĐT, email..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        {customers.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase">
                <th className="pb-2 font-medium">Tên</th>
                <th className="pb-2 font-medium">SĐT</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Địa chỉ</th>
                <th className="pb-2 font-medium">Ghi chú</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customers.map((c) => (
                <tr key={c._id} className="text-slate-300">
                  <td className="py-2.5">{c.name}</td>
                  <td className="py-2.5">{c.phone || "-"}</td>
                  <td className="py-2.5">{c.email || "-"}</td>
                  <td className="py-2.5">{c.address || "-"}</td>
                  <td className="py-2.5">{c.note || "-"}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="text-primary-400 hover:text-primary-300 mr-3">Sửa</button>
                    <button onClick={() => removeCustomer(c._id)} className="text-red-400 hover:text-red-300">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">Chưa có khách hàng nào.</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2"><UserRound size={18} /> {editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Tên khách hàng" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Số điện thoại" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input placeholder="Email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <input placeholder="Địa chỉ" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <input placeholder="Ghi chú" className="input-field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <button type="submit" className="btn-primary w-full">{editing ? "Lưu thay đổi" : "Lưu khách hàng"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
