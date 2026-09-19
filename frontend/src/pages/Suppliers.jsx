import { useEffect, useState } from "react";
import { Plus, Search, X, Truck } from "lucide-react";
import api from "../api/axios.js";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });

  const load = () => {
    api
      .get(`/suppliers${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then((res) => setSuppliers(res.data || []))
      .catch(() => setSuppliers([]));
  };

  useEffect(() => {
    load();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", note: "" });
    setModal(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      note: supplier.note || "",
    });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing?._id) {
        await api.put(`/suppliers/${editing._id}`, form);
      } else {
        await api.post("/suppliers", form);
      }
      setModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi lưu nhà cung cấp");
    }
  };

  const removeSupplier = async (id) => {
    if (!confirm("Xóa nhà cung cấp này?")) return;
    await api.delete(`/suppliers/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Nhà cung cấp</h1>
          <p className="text-slate-400 text-sm mt-1">Dữ liệu nhà cung cấp để chọn nhanh khi nhập hàng. Mặc định vẫn có NCC lẻ.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm nhà cung cấp
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input placeholder="Tìm theo tên, SĐT, email..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-x-auto">
        {suppliers.length ? (
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
              {suppliers.map((s) => (
                <tr key={s._id} className="text-slate-300">
                  <td className="py-2.5">{s.name}</td>
                  <td className="py-2.5">{s.phone || "-"}</td>
                  <td className="py-2.5">{s.email || "-"}</td>
                  <td className="py-2.5">{s.address || "-"}</td>
                  <td className="py-2.5">{s.note || "-"}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-primary-400 hover:text-primary-300 mr-3">Sửa</button>
                    <button onClick={() => removeSupplier(s._id)} className="text-red-400 hover:text-red-300">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">Chưa có nhà cung cấp nào.</div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg flex items-center gap-2"><Truck size={18} /> {editing ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input required placeholder="Tên nhà cung cấp" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Số điện thoại" className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input placeholder="Email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <input placeholder="Địa chỉ" className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <input placeholder="Ghi chú" className="input-field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              <button type="submit" className="btn-primary w-full">{editing ? "Lưu thay đổi" : "Lưu nhà cung cấp"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
