import { useEffect, useState } from "react";
import { Plus, Search, X, UserRound, History, ShoppingBag } from "lucide-react";
import api from "../api/axios.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { formatVND, formatDate } from "../utils/format.js";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const { confirmAction, notify } = useNotification();

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
      notify(err.response?.data?.message || "Lỗi khi lưu khách hàng");
    }
  };

  const removeCustomer = async (id) => {
    if (!await confirmAction("Bạn có chắc muốn xóa khách hàng này không?", "Xóa khách hàng")) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  const openHistory = async (customer) => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/customers/${customer._id}/history`);
      setHistory(data);
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi tải lịch sử mua hàng");
    } finally {
      setHistoryLoading(false);
    }
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
                <th className="pb-2 font-medium">Số lần mua</th>
                <th className="pb-2 font-medium">Tổng tiền mua</th>
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
                  <td className="py-2.5 text-center">{c.purchaseCount || 0}</td>
                  <td className="py-2.5 font-medium text-emerald-400">{formatVND(c.totalSpent || 0)}</td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openHistory(c)} className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 mr-3" title="Xem lịch sử mua hàng">
                      <History size={15} /> Lịch sử
                    </button>
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

      {history && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setHistory(null)}>
          <div className="card w-full max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-white text-lg flex items-center gap-2"><ShoppingBag size={18} /> Lịch sử mua hàng</h2>
                <p className="text-sm text-slate-400 mt-1">{history.customer.name}</p>
              </div>
              <button onClick={() => setHistory(null)} className="text-slate-400 hover:text-white" aria-label="Đóng lịch sử"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Số lần mua</p><p className="text-lg font-semibold text-white mt-1">{history.sales.length}</p></div>
              <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-400">Tổng tiền mua</p><p className="text-lg font-semibold text-emerald-400 mt-1">{formatVND(history.sales.reduce((sum, sale) => sum + Number(sale.totalRevenue || 0), 0))}</p></div>
            </div>
            <div className="overflow-auto max-h-[52vh]">
              {history.sales.length ? (
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase text-slate-500 border-b border-white/10">
                    <tr><th className="px-3 py-3">Sản phẩm</th><th className="px-3 py-3">Số lượng</th><th className="px-3 py-3">Đơn giá</th><th className="px-3 py-3">Thành tiền</th><th className="px-3 py-3">Ngày mua</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.sales.map((sale) => (
                      <tr key={sale._id} className="text-slate-300">
                        <td className="px-3 py-3 text-white">{sale.product?.name || "Sản phẩm đã xóa"}</td>
                        <td className="px-3 py-3">{sale.quantity}</td>
                        <td className="px-3 py-3">{formatVND(sale.unitPrice)}</td>
                        <td className="px-3 py-3 font-medium text-emerald-400">{formatVND(sale.totalRevenue)}</td>
                        <td className="px-3 py-3 text-slate-400">{formatDate(sale.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="py-10 text-center text-sm text-slate-500">Khách hàng chưa có lịch sử mua hàng.</p>}
            </div>
          </div>
        </div>
      )}

      {historyLoading && !history && <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200 shadow-xl">Đang tải lịch sử...</div>}
    </div>
  );
}
