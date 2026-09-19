import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Smartphone, Monitor, Package, Trash2, X } from "lucide-react";
import api from "../api/axios.js";

const iconMap = { smartphone: Smartphone, monitor: Monitor, package: Package };
const iconOptions = ["smartphone", "monitor", "package"];
const colorOptions = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "package", color: "#6366f1", description: "" });

  const load = () => api.get("/categories").then((res) => setCategories(res.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/categories", form);
    setModal(false);
    setForm({ name: "", icon: "package", color: "#6366f1", description: "" });
    load();
  };

  const remove = async (id) => {
    if (!confirm("Xóa danh mục này?")) return;
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Danh mục sản phẩm</h1>
          <p className="text-slate-400 text-sm mt-1">Quản lý các nhóm hàng: Phone / Màn hình / Khác...</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const Icon = iconMap[c.icon] || Package;
          return (
            <div key={c._id} className="card group relative">
              <button
                onClick={() => remove(c._id)}
                className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${c.color}22` }}>
                <Icon size={22} style={{ color: c.color }} />
              </div>
              <h3 className="font-semibold text-white text-lg">{c.name}</h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{c.description || "Chưa có mô tả"}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs bg-white/5 px-2.5 py-1 rounded-full text-slate-300">{c.productCount} sản phẩm</span>
                <Link to={`/categories/${c._id}`} className="text-sm text-primary-400 hover:text-primary-300 font-medium">
                  Xem →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Thêm danh mục mới</h2>
              <button onClick={() => setModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <input required placeholder="Tên danh mục (VD: Phone)" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <textarea placeholder="Mô tả ngắn (tùy chọn)" className="input-field resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div>
                <p className="text-xs text-slate-400 mb-2">Biểu tượng</p>
                <div className="flex gap-2">
                  {iconOptions.map((i) => {
                    const Icon = iconMap[i];
                    return (
                      <button type="button" key={i} onClick={() => setForm({ ...form, icon: i })} className={`w-10 h-10 rounded-xl flex items-center justify-center border ${form.icon === i ? "border-primary-500 bg-primary-500/20" : "border-white/10"}`}>
                        <Icon size={18} className="text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Màu sắc</p>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? "border-white" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Lưu danh mục</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
