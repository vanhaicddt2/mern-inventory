import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Wallet, Trash2, X, Pencil, BarChart3, ChevronDown, ChevronUp, LayoutGrid, Table2 } from "lucide-react";
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
  const [transactionView, setTransactionView] = useState(() => window.matchMedia("(max-width: 639px)").matches ? "card" : "table");
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({
    quantity: "",
    unitCost: "",
    supplierId: "guest",
    note: "",
    unitPrice: "",
    profit: "",
    customerId: "guest",
    type: "other",
    amount: "",
  });

  const [productForm, setProductForm] = useState({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: "", minStock: "" });
  const [purchaseForm, setPurchaseForm] = useState({ name: "", quantity: "", unitCost: "", supplierId: "guest", note: "" });
  const [saleForm, setSaleForm] = useState({ name: "", quantity: "", unitPrice: "", profit: "", customerId: "guest", note: "" });
  const [expenseForm, setExpenseForm] = useState({ name: "", type: "other", amount: "", note: "" });

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateView = (event) => setTransactionView(event.matches ? "card" : "table");
    mediaQuery.addEventListener("change", updateView);
    return () => mediaQuery.removeEventListener("change", updateView);
  }, []);

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
    setPurchaseForm({ name: "", quantity: "", unitCost: "", supplierId: "guest", note: "" });
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
        profit: parseFormattedNumber(saleForm.profit),
        customerId,
      });
      setSaleForm({ name: "", quantity: "", unitPrice: "", profit: "", customerId: "guest", note: "" });
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
    setExpenseForm({ name: "", type: "other", amount: "", note: "" });
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
        name: item.name || item.product?.name || product.name,
        quantity: String(item.quantity || ""),
        unitCost: formatNumberInput(String(item.unitCost || "")),
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
        name: item.name || item.product?.name || product.name,
        quantity: String(item.quantity || ""),
        unitCost: "",
        supplierId: "guest",
        note: item.note || "",
        unitPrice: formatNumberInput(String(item.unitPrice || "")),
        profit: formatNumberInput(String(item.profit ?? "")),
        customerId: item.customerId?._id || item.customerId || "guest",
        type: "other",
        amount: "",
      });
    }
    if (type === "expenses") {
      setEditTxForm({
        name: item.name || item.product?.name || product.name,
        quantity: "",
        unitCost: "",
        supplierId: "guest",
        note: item.note || "",
        unitPrice: "",
        customerId: "guest",
        type: item.type || "other",
        amount: formatNumberInput(String(item.amount || "")),
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
          name: editTxForm.name,
          quantity: Number(editTxForm.quantity || 0),
          unitCost: parseFormattedNumber(editTxForm.unitCost),
          supplierId: editTxForm.supplierId === "guest" ? null : editTxForm.supplierId,
          note: editTxForm.note,
        });
      }

      if (editTx.type === "sales") {
        await api.put(`/sales/${editTx.item._id}`, {
          product: id,
          name: editTxForm.name,
          quantity: Number(editTxForm.quantity || 0),
          unitPrice: parseFormattedNumber(editTxForm.unitPrice),
          profit: parseFormattedNumber(editTxForm.profit),
          customerId: editTxForm.customerId === "guest" ? null : editTxForm.customerId,
          note: editTxForm.note,
        });
      }

      if (editTx.type === "expenses") {
        await api.put(`/expenses/${editTx.item._id}`, {
          name: editTxForm.name,
          type: editTxForm.type,
          amount: parseFormattedNumber(editTxForm.amount),
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
  const purchaseNames = [...new Set(purchases.map((purchase) => purchase.name || purchase.product?.name).filter(Boolean))];
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{product.name}</h1>
          <p className="text-slate-400 text-sm mt-1">Tồn kho: <span className="text-white font-semibold">{product.stockQty}</span> · Giá vốn: {formatVND(product.costPrice)}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button onClick={openEditProductModal} className="btn-secondary flex h-11 flex-1 items-center justify-center gap-2 px-3 sm:h-auto sm:flex-none sm:px-4" title="Sửa sản phẩm" aria-label="Sửa sản phẩm">
            <Pencil size={18} /> <span className="hidden sm:inline">Sửa</span>
          </button>
          <button onClick={() => { setPurchaseForm((prev) => ({ ...prev, name: product.name })); setSaleForm((prev) => ({ ...prev, name: product.name })); setExpenseForm((prev) => ({ ...prev, name: product.name })); setModal(true); }} className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 px-3 sm:h-auto sm:flex-none sm:px-4" title="Thêm giao dịch" aria-label="Thêm giao dịch">
            <Plus size={18} /> <span className="hidden sm:inline">Thêm giao dịch</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileStatsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200"
        >
          <span className="flex items-center gap-2"><BarChart3 size={17} /> Thống kê sản phẩm</span>
          {mobileStatsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className={`${mobileStatsOpen ? "grid" : "hidden"} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4 lg:gap-4`}>
        <StatCard icon={TrendingDown} label="Tổng chi nhập" value={formatVND(summary.totalPurchaseCost)} color="#f97316" />
        <StatCard icon={TrendingUp} label="Tổng doanh thu" value={formatVND(summary.totalRevenue)} color="#22c55e" />
        <StatCard icon={Wallet} label="Chi phí phát sinh" value={formatVND(summary.totalExpense)} color="#ef4444" />
        <StatCard icon={TrendingUp} label="Lợi nhuận" value={formatVND(summary.profit)} color={summary.profit >= 0 ? "#6366f1" : "#ef4444"} />
      </div>

      <div className="card p-3 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-white/5 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  if (t.key === "sales" && isOutOfStock) return;
                  setTab(t.key);
                }}
                disabled={t.key === "sales" && isOutOfStock}
                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
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
          <div className="flex self-end rounded-xl border border-white/10 bg-white/5 p-1">
            <button type="button" onClick={() => setTransactionView("card")} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${transactionView === "card" ? "bg-primary-500 text-white" : "text-slate-400 hover:text-white"}`} title="Xem dạng card" aria-label="Xem dạng card">
              <LayoutGrid size={15} /> <span>Card</span>
            </button>
            <button type="button" onClick={() => setTransactionView("table")} className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${transactionView === "table" ? "bg-primary-500 text-white" : "text-slate-400 hover:text-white"}`} title="Xem dạng bảng" aria-label="Xem dạng bảng">
              <Table2 size={15} /> <span>Bảng</span>
            </button>
          </div>
        </div>

        {tab === "purchases" && (
          <TableList
            rows={purchases}
            viewMode={transactionView}
            empty="Chưa có phiếu nhập nào"
            columns={["Ngày", "Tên sản phẩm", "Số lượng", "Đơn giá", "Thành tiền", "Nhà cung cấp", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              r.name || r.product?.name || product.name,
              r.quantity,
              formatVND(r.unitCost),
              formatVND(r.totalCost),
              r.supplier || "-",
              <button onClick={() => openEditTransactionModal("purchases", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("purchases", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
            cardRender={(r) => (
              <TransactionCard
                title="Phiếu nhập"
                date={r.date}
                details={["Số lượng", r.quantity, "Đơn giá", formatVND(r.unitCost), "Thành tiền", formatVND(r.totalCost), "Nhà cung cấp", r.supplier || "-"]}
                note={r.note}
                actions={[<button onClick={() => openEditTransactionModal("purchases", r)} className="text-slate-400 hover:text-blue-400" aria-label="Sửa phiếu nhập"><Pencil size={16} /></button>, <button onClick={() => removeItem("purchases", r._id)} className="text-slate-400 hover:text-red-400" aria-label="Xóa phiếu nhập"><Trash2 size={16} /></button>]}
              />
            )}
          />
        )}
        {tab === "sales" && (
          <TableList
            rows={sales}
            viewMode={transactionView}
            empty="Chưa có đơn bán nào"
            columns={["Ngày", "Tên sản phẩm", "Số lượng", "Đơn giá", "Doanh thu", "Lãi", "Khách hàng", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              r.name || r.product?.name || product.name,
              r.quantity,
              formatVND(r.unitPrice),
              formatVND(r.totalRevenue),
              formatVND(r.profit || 0),
              r.customer || "-",
              <button onClick={() => openEditTransactionModal("sales", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("sales", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
            cardRender={(r) => (
              <TransactionCard
                title="Đơn bán"
                date={r.date}
                details={["Số lượng", r.quantity, "Đơn giá", formatVND(r.unitPrice), "Doanh thu", formatVND(r.totalRevenue), "Lãi", formatVND(r.profit || 0), "Khách hàng", r.customer || "-"]}
                note={r.note}
                actions={[<button onClick={() => openEditTransactionModal("sales", r)} className="text-slate-400 hover:text-blue-400" aria-label="Sửa đơn bán"><Pencil size={16} /></button>, <button onClick={() => removeItem("sales", r._id)} className="text-slate-400 hover:text-red-400" aria-label="Xóa đơn bán"><Trash2 size={16} /></button>]}
              />
            )}
          />
        )}
        {tab === "expenses" && (
          <TableList
            rows={expenses}
            viewMode={transactionView}
            empty="Chưa có khoản chi nào"
            columns={["Ngày", "Tên sản phẩm", "Loại chi phí", "Số tiền", "Ghi chú", "", ""]}
            render={(r) => [
              <div>
                <div>{formatDate(r.date)}</div>
                {r.note && <div className="text-[10px] text-slate-500 mt-1">{r.note}</div>}
              </div>,
              r.name || r.product?.name || product.name,
              EXPENSE_TYPES[r.type],
              formatVND(r.amount),
              r.note || "-",
              <button onClick={() => openEditTransactionModal("expenses", r)} className="text-slate-500 hover:text-blue-400"><Pencil size={15} /></button>,
              <button onClick={() => removeItem("expenses", r._id)} className="text-slate-500 hover:text-red-400"><Trash2 size={15} /></button>,
            ]}
            cardRender={(r) => (
              <TransactionCard
                title={EXPENSE_TYPES[r.type] || "Chi phí"}
                date={r.date}
                details={["Số tiền", formatVND(r.amount)]}
                note={r.note}
                actions={[<button onClick={() => openEditTransactionModal("expenses", r)} className="text-slate-400 hover:text-blue-400" aria-label="Sửa khoản chi"><Pencil size={16} /></button>, <button onClick={() => removeItem("expenses", r._id)} className="text-slate-400 hover:text-red-400" aria-label="Xóa khoản chi"><Trash2 size={16} /></button>]}
              />
            )}
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
                <input required placeholder="Tên sản phẩm" className="input-field" value={editTxForm.name || ""} onChange={(e) => setEditTxForm({ ...editTxForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={editTxForm.quantity} onChange={(e) => setEditTxForm({ ...editTxForm, quantity: e.target.value.replace(/\D/g, "") })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá nhập" className="input-field" value={editTxForm.unitCost} onChange={(e) => setEditTxForm({ ...editTxForm, unitCost: formatNumberInput(e.target.value) })} />
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
                <input required placeholder="Tên sản phẩm" className="input-field" value={editTxForm.name || ""} onChange={(e) => setEditTxForm({ ...editTxForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input required type="text" inputMode="numeric" placeholder="Số lượng" className="input-field" value={editTxForm.quantity} onChange={(e) => setEditTxForm({ ...editTxForm, quantity: e.target.value.replace(/\D/g, "") })} />
                  <input required type="text" inputMode="numeric" placeholder="Đơn giá bán" className="input-field" value={editTxForm.unitPrice} onChange={(e) => setEditTxForm({ ...editTxForm, unitPrice: formatNumberInput(e.target.value) })} />
                  <input required type="text" inputMode="numeric" placeholder="Lãi" className="input-field" value={editTxForm.profit || ""} onChange={(e) => setEditTxForm({ ...editTxForm, profit: formatNumberInput(e.target.value) })} />
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
                <input required placeholder="Tên sản phẩm" className="input-field" value={editTxForm.name || ""} onChange={(e) => setEditTxForm({ ...editTxForm, name: e.target.value })} />
                <select className="input-field" value={editTxForm.type} onChange={(e) => setEditTxForm({ ...editTxForm, type: e.target.value })}>
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input required type="text" inputMode="numeric" placeholder="Số tiền" className="input-field" value={editTxForm.amount} onChange={(e) => setEditTxForm({ ...editTxForm, amount: formatNumberInput(e.target.value) })} />
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
                <input required placeholder="Tên sản phẩm" className="input-field" value={purchaseForm.name} onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })} />
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
                <input required list="purchase-name-options" placeholder="Tên sản phẩm" className="input-field" value={saleForm.name} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })} />
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
                  <input required type="text" inputMode="numeric" placeholder="Lãi" className="input-field" value={saleForm.profit} onChange={(e) => setSaleForm({ ...saleForm, profit: formatNumberInput(e.target.value) })} />
                </div>
                <input placeholder="Ghi chú" className="input-field" value={saleForm.note} onChange={(e) => setSaleForm({ ...saleForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu đơn bán</button>
              </form>
            )}
            {tab === "expenses" && (
              <form onSubmit={submitExpense} className="space-y-3">
                <input required list="purchase-name-options" placeholder="Tên sản phẩm" className="input-field" value={expenseForm.name} onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })} />
                <select className="input-field" value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                  {Object.entries(EXPENSE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input required type="text" inputMode="numeric" placeholder="Số tiền" className="input-field" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: formatNumberInput(e.target.value) })} />
                <input placeholder="Ghi chú" className="input-field" value={expenseForm.note} onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })} />
                <button type="submit" className="btn-primary w-full">Lưu khoản chi</button>
              </form>
            )}
            <datalist id="purchase-name-options">
              {purchaseNames.map((name) => <option key={name} value={name} />)}
            </datalist>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionCard({ title, date, details, note, actions }) {
  const detailItems = [];
  for (let index = 0; index < details.length; index += 2) {
    detailItems.push({ label: details[index], value: details[index + 1] });
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/85 to-slate-900/90 p-4 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-400/30 hover:shadow-xl hover:shadow-primary-950/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/60 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{formatDate(date)}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-black/15 p-1 opacity-80 transition-opacity group-hover:opacity-100">{actions}</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {detailItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.035] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 break-words text-sm font-medium text-slate-200">{item.value}</p>
          </div>
        ))}
      </div>
      {note && <p className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-500">{note}</p>}
    </article>
  );
}

function TableList({ rows, columns, render, cardRender, viewMode, empty }) {
  if (!rows.length) return <p className="text-sm text-slate-500 text-center py-8">{empty}</p>;
  if (viewMode === "card") return <div className="grid grid-cols-1 gap-3">{rows.map((row) => <div key={row._id}>{cardRender(row)}</div>)}</div>;

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
