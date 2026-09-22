import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, Trash2, X, Pencil } from "lucide-react";
import api from "../api/axios.js";
import { useNotification } from "../context/NotificationContext.jsx";
import { formatVND, formatDate } from "../utils/format.js";
import StatCard from "../components/StatCard.jsx";

const formatNumberInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
};

const parseFormattedNumber = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const TABS = [
  { key: "purchases", label: "Nhập hàng" },
  { key: "sales", label: "Bán hàng" },
  { key: "expenses", label: "Chi phí" },
];

const EXPENSE_TYPES = {
  shipping: "Vận chuyển",
  repair: "Sửa chữa",
  marketing: "Marketing",
  packaging: "Đóng gói",
  other: "Khác",
};

export default function ProductDetail() {
  const { id } = useParams();
  const { confirmAction, notify } = useNotification();
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierMode, setSupplierMode] = useState("guest");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [quickSupplier, setQuickSupplier] = useState({ name: "", phone: "", address: "" });
  const [customerMode, setCustomerMode] = useState("guest");
  const [customerSearch, setCustomerSearch] = useState("");
  const [quickCustomer, setQuickCustomer] = useState({ name: "", phone: "", address: "" });
  const [tab, setTab] = useState("purchases");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({
    quantity: "",
    unitCost: "",
    supplierId: "guest",
    note: "",
    unitPrice: "",
    customerId: "guest",
    type: "other",
    amount: "",
  });

  const [productForm, setProductForm] = useState({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: "", minStock: "" });
  const [purchaseForm, setPurchaseForm] = useState({ quantity: "", unitCost: "", supplierId: "guest", note: "" });
  const [saleForm, setSaleForm] = useState({ quantity: "", unitPrice: "", customerId: "guest", note: "" });
  const [expenseForm, setExpenseForm] = useState({ type: "other", amount: "", note: "" });

  const load = () => api.get(`/products/${id}`).then((res) => setData(res.data));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data || [])).catch(() => setCustomers([]));
  }, []);
  useEffect(() => {
    api.get("/suppliers").then((res) => setSuppliers(res.data || [])).catch(() => setSuppliers([]));
  }, []);

  useEffect(() => {
    if (data?.product?.stockQty <= 0 && tab === "sales") {
      setTab("purchases");
    }
  }, [data, tab]);

  const submitPurchase = async (e) => {
    e.preventDefault();
    let supplierId;

    if (supplierMode === "existing") {
      if (!purchaseForm.supplierId || purchaseForm.supplierId === "guest") {
        notify("Vui lòng chọn nhà cung cấp trong danh bạ.", "info");
        return;
      }
      supplierId = purchaseForm.supplierId;
    }

    if (supplierMode === "quick") {
      const quickName = quickSupplier.name.trim();
      const quickPhone = quickSupplier.phone.trim();
      const quickAddress = quickSupplier.address.trim();

      if (!quickName) {
        notify("Vui lòng nhập tên nhà cung cấp.", "info");
        return;
      }

      let foundByPhone = null;
      if (quickPhone) {
        foundByPhone = suppliers.find((s) => String(s.phone || "").trim() === quickPhone) || null;
      }

      if (foundByPhone?._id) {
        supplierId = foundByPhone._id;
      } else {
        try {
          const created = await api.post("/suppliers", {
            name: quickName,
            phone: quickPhone,
            address: quickAddress,
          });
          supplierId = created.data?._id;
          if (created.data?._id) {
            setSuppliers((prev) => [...prev, created.data]);
          }
        } catch (createErr) {
          if (!quickPhone) throw createErr;
          const existing = await api.get(`/suppliers?search=${encodeURIComponent(quickPhone)}`);
          const matched = (existing.data || []).find((s) => String(s.phone || "").trim() === quickPhone);
          if (!matched?._id) throw createErr;
          supplierId = matched._id;
        }
      }
    }

    await api.post("/purchases", {
      product: id,
      ...purchaseForm,
      quantity: parseFormattedNumber(purchaseForm.quantity),
      unitCost: parseFormattedNumber(purchaseForm.unitCost),
      supplierId,
    });
    setPurchaseForm({ quantity: "", unitCost: "", supplierId: "guest", note: "" });
    setSupplierMode("guest");
    setSupplierSearch("");
    setQuickSupplier({ name: "", phone: "", address: "" });
    setModal(false);
    load();
  };
  const submitSale = async (e) => {
    e.preventDefault();
    if (data?.product?.stockQty <= 0) {
      notify("Sản phẩm đã hết tồn kho, không thể tạo đơn bán.", "info");
      return;
    }
    try {
      let customerId;

      if (customerMode === "existing") {
        if (!saleForm.customerId || saleForm.customerId === "guest") {
          notify("Vui lòng chọn khách hàng trong danh bạ.", "info");
          return;
        }
        customerId = saleForm.customerId;
      }

      if (customerMode === "quick") {
        const quickName = quickCustomer.name.trim();
        const quickPhone = quickCustomer.phone.trim();
        const quickAddress = quickCustomer.address.trim();

        if (!quickName) {
          notify("Vui lòng nhập tên khách hàng.", "info");
          return;
        }

        let foundByPhone = null;
        if (quickPhone) {
          foundByPhone = customers.find((c) => String(c.phone || "").trim() === quickPhone) || null;
        }

        if (foundByPhone?._id) {
          customerId = foundByPhone._id;
        } else {
          try {
            const created = await api.post("/customers", {
              name: quickName,
              phone: quickPhone,
              address: quickAddress,
            });
            customerId = created.data?._id;
            if (created.data?._id) {
              setCustomers((prev) => [...prev, created.data]);
            }
          } catch (createErr) {
            if (!quickPhone) throw createErr;
            const existing = await api.get(`/customers?search=${encodeURIComponent(quickPhone)}`);
            const matched = (existing.data || []).find((c) => String(c.phone || "").trim() === quickPhone);
            if (!matched?._id) throw createErr;
            customerId = matched._id;
          }
        }
      }

      await api.post("/sales", {
        product: id,
        ...saleForm,
        quantity: parseFormattedNumber(saleForm.quantity),
        unitPrice: parseFormattedNumber(saleForm.unitPrice),
        customerId,
      });
      setSaleForm({ quantity: "", unitPrice: "", customerId: "guest", note: "" });
      setCustomerMode("guest");
      setCustomerSearch("");
      setQuickCustomer({ name: "", phone: "", address: "" });
      setModal(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi tạo đơn bán");
    }
  };
  const submitExpense = async (e) => {
    e.preventDefault();
    await api.post("/expenses", { product: id, ...expenseForm, amount: parseFormattedNumber(expenseForm.amount) });
    setExpenseForm({ type: "other", amount: "", note: "" });
    setModal(false);
    load();
  };

  const openEditProductModal = () => {
    setProductForm({
      name: product?.name || "",
      sku: product?.sku || "",
      costPrice: formatNumberInput(String(product?.costPrice ?? "")),
      sellPrice: formatNumberInput(String(product?.sellPrice ?? "")),
      stockQty: formatNumberInput(String(product?.stockQty ?? 0)),
      minStock: formatNumberInput(String(product?.minStock ?? 2)),
    });
    setEditModal(true);
  };

  const submitProductEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/${id}`, {
        ...productForm,
        costPrice: parseFormattedNumber(productForm.costPrice),
        sellPrice: parseFormattedNumber(productForm.sellPrice),
        stockQty: parseFormattedNumber(productForm.stockQty),
        minStock: parseFormattedNumber(productForm.minStock),
      });
      setEditModal(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi cập nhật sản phẩm");
    }
  };

  const openEditTransactionModal = (type, item) => {
    if (type === "purchases") {
      setEditTxForm({
        quantity: String(item.quantity || ""),
        unitCost: String(item.unitCost || ""),
        supplierId: item.supplierId?._id || item.supplierId || "guest",
        note: item.note || "",
        unitPrice: "",
        customerId: "guest",
        type: "other",
        amount: "",
      });
    }
    if (type === "sales") {
      setEditTxForm({
        quantity: String(item.quantity || ""),
        unitCost: "",
        supplierId: "guest",
        note: item.note || "",
        unitPrice: String(item.unitPrice || ""),
        customerId: item.customerId?._id || item.customerId || "guest",
        type: "other",
        amount: "",
      });
    }
    if (type === "expenses") {
      setEditTxForm({
        quantity: "",
        unitCost: "",
        supplierId: "guest",
        note: item.note || "",
        unitPrice: "",
        customerId: "guest",
        type: item.type || "other",
        amount: String(item.amount || ""),
      });
    }
    setEditTx({ type, item });
  };

  const submitEditTransaction = async (e) => {
    e.preventDefault();
    if (!editTx) return;

    try {
      if (editTx.type === "purchases") {
        await api.put(`/purchases/${editTx.item._id}`, {
          product: id,
          quantity: Number(editTxForm.quantity || 0),
          unitCost: Number(editTxForm.unitCost || 0),
          supplierId: editTxForm.supplierId === "guest" ? null : editTxForm.supplierId,
          note: editTxForm.note,
        });
      }

      if (editTx.type === "sales") {
        await api.put(`/sales/${editTx.item._id}`, {
          product: id,
          quantity: Number(editTxForm.quantity || 0),
          unitPrice: Number(editTxForm.unitPrice || 0),
          customerId: editTxForm.customerId === "guest" ? null : editTxForm.customerId,
          note: editTxForm.note,
        });
      }

      if (editTx.type === "expenses") {
        await api.put(`/expenses/${editTx.item._id}`, {
          type: editTxForm.type,
          amount: Number(editTxForm.amount || 0),
          note: editTxForm.note,
        });
      }

      setEditTx(null);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Lỗi khi cập nhật giao dịch");
    }
  };

  const removeItem = async (type, itemId) => {
    if (!await confirmAction("Bạn có chắc muốn xóa mục này không?", "Xóa giao dịch")) return;
    await api.delete(`/${type}/${itemId}`);
    load();
  };

  if (!data) return <div className="text-slate-400">Đang tải...</div>;
  const { product, purchases, sales, expenses, summary } = data;
  const isOutOfStock = product.stockQty <= 0;
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return [c.name, c.phone, c.email].some((v) => String(v || "").toLowerCase().includes(q));
  });
  const filteredSuppliers = suppliers.filter((s) => {
    if (!supplierSearch.trim()) return true;
    const q = supplierSearch.toLowerCase();
    return [s.name, s.phone, s.email].some((v) => String(v || "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <Link to={`/categories/${product.category._id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={16} /> Quay lại {product.category.name}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          <p className="text-slate-400 text-sm mt-1">Tồn kho hiện tại: <span className="text-white font-semibold">{product.stockQty}</span> · Giá vốn TB: {formatVND(product.costPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openEditProductModal} className="btn-secondary flex items-center gap-2">
            <Pencil size={18} /> Sửa
          </button>
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} label="Tổng chi nhập" value={formatVND(summary.totalPurchaseCost)} color="#f97316" />
        <StatCard icon={TrendingUp} label="Tổng doanh thu" value={formatVND(summary.totalRevenue)} color="#22c55e" />
        <StatCard icon={Wallet} label="Chi phí phát sinh" value={formatVND(summary.totalExpense)} color="#ef4444" />
        <StatCard icon={TrendingUp} label="Lợi nhuận" value={formatVND(summary.profit)} color={summary.profit >= 0 ? "#6366f1" : "#ef4444"} />
      </div>

      <div className="card">
        <div className="flex gap-2 mb-4 border-b border-white/5 pb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (t.key === "sales" && isOutOfStock) return;
                setTab(t.key);
              }}
              disabled={t.key === "sales" && isOutOfStock}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-primary-600/20 text-primary-300"
                  : t.key === "sales" && isOutOfStock
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "purchases" && (
          <TableList
            rows={purchases}
            empty="Chưa có phiếu nhập nào"
            columns={["Ngày", "Số lượng", "Đơn giá", "Thành tiền", "Nhà cung cấp", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              r.quantity,
              formatVND(r.unitCost),
              formatVND(r.totalCost),
              r.supplier || "-",
              <button onClick={() => openEditTransactionModal("purchases", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("purchases", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
          />
        )}
        {tab === "sales" && (
          <TableList
            rows={sales}
            empty="Chưa có đơn bán nào"
            columns={["Ngày", "Số lượng", "Đơn giá", "Doanh thu", "Khách hàng", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              r.quantity,
              formatVND(r.unitPrice),
              formatVND(r.totalRevenue),
              r.customer || "-",
              <button onClick={() => openEditTransactionModal("sales", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("sales", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
          />
        )}
        {tab === "expenses" && (
          <TableList
            rows={expenses}
            empty="Chưa có khoản chi nào"
            columns={["Ngày", "Loại chi phí", "Số tiền", "Ghi chú", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              EXPENSE_TYPES[r.type],
              formatVND(r.amount),
              r.note || "-",
              <button onClick={() => openEditTransactionModal("expenses", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("expenses", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
          />
        )}
      </div>

      {editTx && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditTx(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">
                {editTx.type === "purchases" ? "Sửa phiếu nhập" : editTx.type === "sales" ? "Sửa đơn bán" : "Sửa khoản chi"}
              </h2>
              <button onClick={() => setEditTx(null)} className="text-slate-400"><X size={20} /></button>
            </div>

            {editTx.type === "purchases" && (
              <form onSubmit={submitEditTransaction} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={editTxForm.quantity} onChange={(e) => setEditTxForm({ ...editTxForm, quantity: e.target.value.replace(/\D/g, "") })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá nhập" className="input-field" value={editTxForm.unitCost} onChange={(e) => setEditTxForm({ ...editTxForm, unitCost: e.target.value.replace(/\D/g, "") })} />
                </div>
                <select className="input-field" value={editTxForm.supplierId} onChange={(e) => setEditTxForm({ ...editTxForm, supplierId: e.target.value })}>
                  <option value="guest">NCC lẻ</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <input placeholder="Ghi chú" className="input-field" value={editTxForm.note} onChange={(e) => setEditTxForm({ ...editTxForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu thay đổi</button>
              </form>
            )}

            {editTx.type === "sales" && (
              <form onSubmit={submitEditTransaction} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={editTxForm.quantity} onChange={(e) => setEditTxForm({ ...editTxForm, quantity: e.target.value.replace(/\D/g, "") })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá bán" className="input-field" value={editTxForm.unitPrice} onChange={(e) => setEditTxForm({ ...editTxForm, unitPrice: e.target.value.replace(/\D/g, "") })} />
                </div>
                <select className="input-field" value={editTxForm.customerId} onChange={(e) => setEditTxForm({ ...editTxForm, customerId: e.target.value })}>
                  <option value="guest">Khách lẻ</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <input placeholder="Ghi chú" className="input-field" value={editTxForm.note} onChange={(e) => setEditTxForm({ ...editTxForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu thay đổi</button>
              </form>
            )}

            {editTx.type === "expenses" && (
              <form onSubmit={submitEditTransaction} className="space-y-3">
                <select className="input-field" value={editTxForm.type} onChange={(e) => setEditTxForm({ ...editTxForm, type: e.target.value })}>
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input required type="text" inputMode="numeric" placeholder="Số tiền" className="input-field" value={editTxForm.amount} onChange={(e) => setEditTxForm({ ...editTxForm, amount: e.target.value.replace(/\D/g, "") })} />
                <input placeholder="Ghi chú" className="input-field" value={editTxForm.note} onChange={(e) => setEditTxForm({ ...editTxForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu thay đổi</button>
              </form>
            )}
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Sửa sản phẩm</h2>
              <button onClick={() => setEditModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={submitProductEdit} className="space-y-4">
              <input required placeholder="Tên sản phẩm" className="input-field" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
              <input placeholder="Mã SKU (tùy chọn)" className="input-field" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="numeric" placeholder="Giá vốn" className="input-field" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: formatNumberInput(e.target.value) })} />
                <input type="text" inputMode="numeric" placeholder="Giá bán" className="input-field" value={productForm.sellPrice} onChange={(e) => setProductForm({ ...productForm, sellPrice: formatNumberInput(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="numeric" placeholder="Tồn kho" className="input-field" value={productForm.stockQty} onChange={(e) => setProductForm({ ...productForm, stockQty: formatNumberInput(e.target.value) })} />
                <input type="text" inputMode="numeric" placeholder="Cảnh báo tối thiểu" className="input-field" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: formatNumberInput(e.target.value) })} />
              </div>
              <button type="submit" className="btn-primary w-full">Lưu thay đổi</button>
            </form>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">Thêm giao dịch — {TABS.find((t) => t.key === tab)?.label}</h2>
              <button onClick={() => setModal(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex gap-2 mb-4">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === "sales" && isOutOfStock) return;
                    setTab(t.key);
                  }}
                  disabled={t.key === "sales" && isOutOfStock}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                    tab === t.key
                      ? "bg-primary-600 text-white"
                      : t.key === "sales" && isOutOfStock
                        ? "bg-white/5 text-slate-600 cursor-not-allowed"
                        : "bg-white/5 text-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {isOutOfStock && <p className="text-xs text-amber-400 mb-3">Sản phẩm đã hết tồn kho. Mục Bán hàng đang tạm tắt.</p>}

            {tab === "purchases" && (
              <form onSubmit={submitPurchase} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupplierMode("guest")}
                    className={`py-2 rounded-xl text-xs font-medium ${supplierMode === "guest" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    NCC lẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierMode("existing")}
                    className={`py-2 rounded-xl text-xs font-medium ${supplierMode === "existing" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    Chọn danh bạ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierMode("quick")}
                    className={`py-2 rounded-xl text-xs font-medium ${supplierMode === "quick" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    Nhập nhanh
                  </button>
                </div>

                {supplierMode === "guest" && (
                  <p className="text-xs text-slate-400">Mặc định lưu phiếu nhập cho NCC lẻ.</p>
                )}

                {supplierMode === "existing" && (
                  <div className="space-y-2">
                    <input
                      placeholder="Tìm theo tên/SĐT/email..."
                      className="input-field"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                    />
                    <select className="input-field" value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}>
                      <option value="guest">-- Chọn nhà cung cấp --</option>
                      {filteredSuppliers.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}{s.phone ? ` - ${s.phone}` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                {supplierMode === "quick" && (
                  <div className="space-y-2">
                    <input
                      required
                      placeholder="Tên nhà cung cấp"
                      className="input-field"
                      value={quickSupplier.name}
                      onChange={(e) => setQuickSupplier({ ...quickSupplier, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Số điện thoại"
                        className="input-field"
                        value={quickSupplier.phone}
                        onChange={(e) => setQuickSupplier({ ...quickSupplier, phone: e.target.value })}
                      />
                      <input
                        placeholder="Địa chỉ"
                        className="input-field"
                        value={quickSupplier.address}
                        onChange={(e) => setQuickSupplier({ ...quickSupplier, address: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Khi lưu phiếu nhập, nhà cung cấp sẽ được thêm vào danh bạ để dùng lại.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: formatNumberInput(e.target.value) })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá nhập" className="input-field" value={purchaseForm.unitCost} onChange={(e) => setPurchaseForm({ ...purchaseForm, unitCost: formatNumberInput(e.target.value) })} />
                </div>
                <input placeholder="Ghi chú" className="input-field" value={purchaseForm.note} onChange={(e) => setPurchaseForm({ ...purchaseForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu phiếu nhập</button>
              </form>
            )}
            {tab === "sales" && (
              <form onSubmit={submitSale} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerMode("guest")}
                    className={`py-2 rounded-xl text-xs font-medium ${customerMode === "guest" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    Khách lẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("existing")}
                    className={`py-2 rounded-xl text-xs font-medium ${customerMode === "existing" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    Chọn danh bạ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("quick")}
                    className={`py-2 rounded-xl text-xs font-medium ${customerMode === "quick" ? "bg-primary-600 text-white" : "bg-white/5 text-slate-400"}`}
                  >
                    Nhập nhanh
                  </button>
                </div>

                {customerMode === "guest" && (
                  <p className="text-xs text-slate-400">Mặc định lưu đơn cho Khách lẻ.</p>
                )}

                {customerMode === "existing" && (
                  <div className="space-y-2">
                    <input
                      placeholder="Tìm theo tên/SĐT/email..."
                      className="input-field"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <select className="input-field" value={saleForm.customerId} onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}>
                      <option value="guest">-- Chọn khách hàng --</option>
                      {filteredCustomers.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}{c.phone ? ` - ${c.phone}` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}

                {customerMode === "quick" && (
                  <div className="space-y-2">
                    <input
                      required
                      placeholder="Tên khách hàng"
                      className="input-field"
                      value={quickCustomer.name}
                      onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Số điện thoại"
                        className="input-field"
                        value={quickCustomer.phone}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, phone: e.target.value })}
                      />
                      <input
                        placeholder="Địa chỉ"
                        className="input-field"
                        value={quickCustomer.address}
                        onChange={(e) => setQuickCustomer({ ...quickCustomer, address: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Khi lưu đơn, khách hàng sẽ được thêm vào danh bạ để dùng lại.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={saleForm.quantity} onChange={(e) => setSaleForm({ ...saleForm, quantity: formatNumberInput(e.target.value) })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá bán" className="input-field" value={saleForm.unitPrice} onChange={(e) => setSaleForm({ ...saleForm, unitPrice: formatNumberInput(e.target.value) })} />
                </div>
                <input placeholder="Ghi chú" className="input-field" value={saleForm.note} onChange={(e) => setSaleForm({ ...saleForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu đơn bán</button>
              </form>
            )}
            {tab === "expenses" && (
              <form onSubmit={submitExpense} className="space-y-3">
                <select className="input-field" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input required type="text" inputMode="numeric" placeholder="Số tiền" className="input-field" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: formatNumberInput(e.target.value) })} />
                <input placeholder="Ghi chú" className="input-field" value={expenseForm.note} onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu khoản chi</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableList({ rows, columns, render, empty }) {
  if (!rows.length) return <p className="text-sm text-slate-500 text-center py-8">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 text-xs uppercase">
            {columns.map((c, i) => <th key={i} className="pb-2 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r._id} className="text-slate-300">
              {render(r).map((cell, i) => <td key={i} className="py-2.5">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
