import { useEffect, useState } from "react";
import { Plus, Search, X, Truck, History, PackageOpen } from "lucide-react";
import api from "../api/axios.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { formatVND, formatDate } from "../utils/format.js";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const { confirmAction, notify } = useNotification();

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
      notify(err.response?.data?.message || "Lỗi khi lưu nhà cung cấp");
    }
  };

  const removeSupplier = async (id) => {
    if (!await confirmAction("Bạn có chắc muốn xóa nhà cung cấp này không?", "Xóa nhà cung cấp")) return;
    await api.delete(`/suppliers/${id}`);
    load();
  };

  const openHistory = async (supplier) => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/suppliers/${supplier._id}/history`);
      setHistory(data);
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi tải lịch sử nhập hàng");
    } finally {
      setHistoryLoading(false);
    }
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
                <th className="pb-2 font-medium">Số phiếu nhập</th>
                <th className="pb-2 font-medium">Tổng tiền nhập</th>
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
                  <td className="py-2.5 text-center">{s.purchaseCount || 0}</td>
                  <td className="py-2.5 font-medium text-amber-300">{formatVND(s.totalSpent || 0)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openHistory(s)} className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 mr-3" title="Xem lịch sử nhập hàng">
                      <History size={15} /> Lịch sử
                    </button>
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

      {history && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistory(null)}>
          <div className="card w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg flex items-center gap-2"><PackageOpen size={18} /> Lịch sử nhập hàng</h2>
                <p className="text-sm text-slate-400 mt-1">{history.supplier.name}</p>
              </div>
              <button onClick={() => setHistory(null)} className="text-slate-400 hover:text-white" aria-label="Đóng lịch sử"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Số phiếu nhập</p><p className="text-lg font-semibold text-white mt-1">{history.purchases.length}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Tổng tiền nhập</p><p className="text-lg font-semibold text-amber-300 mt-1">{formatVND(history.purchases.reduce((sum, purchase) => sum + Number(purchase.totalCost || 0), 0))}</p></div>
            </div>
            <div className="overflow-auto max-h-[52vh]">
              {history.purchases.length ? (
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500 border-b border-white/10">
                    <tr><th className="px-3 py-3">Sản phẩm</th><th className="px-3 py-3">Số lượng</th><th className="px-3 py-3">Đơn giá</th><th className="px-3 py-3">Thành tiền</th><th className="px-3 py-3">Ngày nhập</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.purchases.map((purchase) => (
                      <tr key={purchase._id} className="text-slate-300">
                        <td className="px-3 py-3 text-white">{purchase.product?.name || "Sản phẩm đã xóa"}</td>
                        <td className="px-3 py-3">{purchase.quantity}</td>
                        <td className="px-3 py-3">{formatVND(purchase.unitCost)}</td>
                        <td className="px-3 py-3 font-medium text-amber-300">{formatVND(purchase.totalCost)}</td>
                        <td className="px-3 py-3 text-slate-400">{formatDate(purchase.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="py-10 text-center text-sm text-slate-500">Nhà cung cấp chưa có lịch sử nhập hàng.</p>}
            </div>
          </div>
        </div>
      )}

      {historyLoading && !history && <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200 shadow-xl">Đang tải lịch sử...</div>}
    </div>
  );
}
