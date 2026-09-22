import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Search, X, AlertTriangle, Package, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, Trash2, Pencil, LayoutGrid, Table2 } from "lucide-react";
import api from "../api/axios.js";
import { formatVND } from "../utils/format.js";
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

export default function CategoryPage() {
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [productTotals, setProductTotals] = useState({});
  const [category, setCategory] = useState(null);
  const [categoryStats, setCategoryStats] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("card");
  const [modal, setModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: 0, minStock: 2 });

  const load = () => {
    api.get(`/products?category=${id}${search ? `&search=${search}` : ""}`).then((res) => setProducts(res.data));
  };

  useEffect(() => {
    api.get("/categories").then((res) => setCategory(res.data.find((c) => c._id === id)));
  }, [id]);

  useEffect(() => { load(); }, [id, search]);

  useEffect(() => {
    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const loadCategoryStats = async () => {
      try {
        const [productsRes, salesRes, purchasesRes, expensesRes] = await Promise.all([
          api.get(`/products?category=${id}`),
          api.get("/sales"),
          api.get("/purchases"),
          api.get("/expenses"),
        ]);

        const categoryProducts = productsRes.data || [];
        const productIdSet = new Set(categoryProducts.map((p) => String(p._id)));
        const productById = new Map(categoryProducts.map((p) => [String(p._id), p]));

        const categorySales = (salesRes.data || []).filter((s) => {
          const pid = String(s?.product?._id || s?.product);
          return productIdSet.has(pid);
        });
        const categoryPurchases = (purchasesRes.data || []).filter((p) => {
          const pid = String(p?.product?._id || p?.product);
          return productIdSet.has(pid);
        });
        const categoryExpenses = (expensesRes.data || []).filter((e) => {
          const pid = String(e?.product?._id || e?.product);
          return productIdSet.has(pid);
        });

        const totals = {};
        categoryProducts.forEach((product) => {
          totals[String(product._id)] = { purchaseCost: 0, salesRevenue: 0 };
        });
        categoryPurchases.forEach((purchase) => {
          const pid = String(purchase?.product?._id || purchase?.product);
          if (totals[pid]) totals[pid].purchaseCost += toNumber(purchase.totalCost);
        });
        categorySales.forEach((sale) => {
          const pid = String(sale?.product?._id || sale?.product);
          if (totals[pid]) totals[pid].salesRevenue += toNumber(sale.totalRevenue);
        });
        setProductTotals(totals);

        const totalProducts = categoryProducts.length;
        const totalStockQty = categoryProducts.reduce((sum, p) => sum + toNumber(p.stockQty), 0);
        const totalSoldQty = categorySales.reduce((sum, s) => sum + toNumber(s.quantity), 0);
        const totalRevenue = categorySales.reduce((sum, s) => sum + toNumber(s.totalRevenue), 0);
        const totalPurchaseCost = categoryPurchases.reduce((sum, p) => sum + toNumber(p.totalCost), 0);
        const totalExpense = categoryExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        const estimatedCOGS = categorySales.reduce((sum, s) => {
          const pid = String(s?.product?._id || s?.product);
          const product = productById.get(pid);
          const avgCost = toNumber(product?.costPrice);
          return sum + toNumber(s.quantity) * avgCost;
        }, 0);

        const grossProfit = totalRevenue - estimatedCOGS;
        const netProfit = totalRevenue - totalPurchaseCost - totalExpense;

        const inventoryCostValue = categoryProducts.reduce((sum, p) => sum + toNumber(p.stockQty) * toNumber(p.costPrice), 0);
        const inventorySellValue = categoryProducts.reduce((sum, p) => sum + toNumber(p.stockQty) * toNumber(p.sellPrice), 0);

        const lowStockCount = categoryProducts.filter((p) => toNumber(p.stockQty) <= toNumber(p.minStock)).length;
        const outOfStockCount = categoryProducts.filter((p) => toNumber(p.stockQty) <= 0).length;

        const sellThroughRate = totalSoldQty + totalStockQty > 0
          ? (totalSoldQty / (totalSoldQty + totalStockQty)) * 100
          : 0;
        const avgMarginRate = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        setCategoryStats({
          totalProducts,
          totalStockQty,
          totalSoldQty,
          totalRevenue,
          totalPurchaseCost,
          totalExpense,
          grossProfit,
          netProfit,
          inventoryCostValue,
          inventorySellValue,
          lowStockCount,
          outOfStockCount,
          sellThroughRate,
          avgMarginRate,
        });
      } catch {
        setCategoryStats(null);
        setProductTotals({});
      }
    };

    if (id) loadCategoryStats();
  }, [id]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: 0, minStock: 2 });
    setModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      costPrice: formatNumberInput(String(product.costPrice ?? "")),
      sellPrice: formatNumberInput(String(product.sellPrice ?? "")),
      stockQty: formatNumberInput(String(product.stockQty ?? 0)),
      minStock: formatNumberInput(String(product.minStock ?? 2)),
    });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      category: id,
      costPrice: parseFormattedNumber(form.costPrice),
      sellPrice: parseFormattedNumber(form.sellPrice),
      stockQty: parseFormattedNumber(form.stockQty),
      minStock: parseFormattedNumber(form.minStock),
    };

    if (editingProduct) {
      await api.put(`/products/${editingProduct._id}`, payload);
    } else {
      await api.post("/products", payload);
    }

    setModal(false);
    setEditingProduct(null);
    setForm({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: 0, minStock: 2 });
    load();
  };

  const remove = async (productId) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/${productId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa sản phẩm");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{category?.name || "Danh mục"}</h1>
          <p className="text-slate-400 text-sm mt-1">{category?.description || `Quản lý sản phẩm thuộc ${category?.name}`}</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Thêm sản phẩm
        </button>
      </div>

      {categoryStats && (
        <div className="card p-0 overflow-hidden" style={{padding: '0 10px'}}>
          <button
            type="button"
            onClick={() => setStatsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-white text-left">Thống kê category</p>
              <p className="text-xs text-slate-400 text-left mt-0.5">
                Tổng tồn: {categoryStats.totalStockQty} · Đã bán: {categoryStats.totalSoldQty} · Doanh thu: {formatVND(categoryStats.totalRevenue)}
              </p>
            </div>
            {statsOpen ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
          </button>

          {statsOpen && (
            <div className="space-y-4 px-4 pb-4 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <StatCard icon={Package} label="Tổng số lượng" value={categoryStats.totalStockQty} sub={`${categoryStats.totalProducts} sản phẩm`} color="#6366f1" />
                <StatCard icon={TrendingUp} label="Đã bán" value={categoryStats.totalSoldQty} sub={`Sell-through ${categoryStats.sellThroughRate.toFixed(1)}%`} color="#22c55e" />
                <StatCard icon={Wallet} label="Doanh thu đã bán" value={formatVND(categoryStats.totalRevenue)} color="#0ea5e9" />
                <StatCard
                  icon={categoryStats.netProfit >= 0 ? TrendingUp : TrendingDown}
                  label="Lời / lỗ ròng"
                  value={formatVND(categoryStats.netProfit)}
                  sub={`Biên gộp TB ${categoryStats.avgMarginRate.toFixed(1)}%`}
                  color={categoryStats.netProfit >= 0 ? "#22c55e" : "#ef4444"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Số lượng còn lại</p>
                  <p className="text-xl font-bold text-white mt-1">{categoryStats.totalStockQty}</p>
                </div>
                <div className="card py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Giá vốn hàng tồn</p>
                  <p className="text-xl font-bold text-white mt-1">{formatVND(categoryStats.inventoryCostValue)}</p>
                </div>
                <div className="card py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Giá trị bán tồn kho</p>
                  <p className="text-xl font-bold text-white mt-1">{formatVND(categoryStats.inventorySellValue)}</p>
                </div>
                <div className="card py-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Lợi nhuận gộp ước tính</p>
                  <p className={`text-xl font-bold mt-1 ${categoryStats.grossProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatVND(categoryStats.grossProfit)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  Sắp hết hàng: {categoryStats.lowStockCount}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  Hết hàng: {categoryStats.outOfStockCount}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/20">
                  Tổng chi nhập: {formatVND(categoryStats.totalPurchaseCost)}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/20">
                  Chi phí phát sinh: {formatVND(categoryStats.totalExpense)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input placeholder="Tìm sản phẩm..." className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1" aria-label="Kiểu hiển thị sản phẩm">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${viewMode === "card" ? "bg-primary-500 text-white" : "text-slate-400 hover:text-white"}`}
            aria-label="Xem dạng thẻ"
            title="Xem dạng thẻ"
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Thẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${viewMode === "table" ? "bg-primary-500 text-white" : "text-slate-400 hover:text-white"}`}
            aria-label="Xem dạng bảng"
            title="Xem dạng bảng"
          >
            <Table2 size={16} />
            <span className="hidden sm:inline">Bảng</span>
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link key={p._id} to={`/products/${p._id}`} className="card group relative hover:border-primary-500/40 transition-colors border border-transparent">
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button type="button" onClick={(e) => { e.preventDefault(); openEditModal(p); }} className="text-slate-500 hover:text-blue-400 transition-colors" aria-label="Sửa sản phẩm">
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); remove(p._id); }} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Xóa sản phẩm">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-white">{p.name}</h3>
                {p.stockQty <= p.minStock && <AlertTriangle size={16} className="text-amber-400 shrink-0" />}
              </div>
              {p.sku && <p className="text-xs text-slate-500 mt-0.5">SKU: {p.sku}</p>}
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-xs text-slate-400">Giá bán</p>
                  <p className="font-semibold text-primary-400">{formatVND(p.sellPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Tồn kho</p>
                  <p className={`font-semibold ${p.stockQty <= p.minStock ? "text-amber-400" : "text-white"}`}>{p.stockQty}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Giá vốn</th>
                <th className="px-4 py-3">Giá bán</th>
                <th className="px-4 py-3">Tổng tiền nhập</th>
                <th className="px-4 py-3">Tổng tiền đã bán</th>
                <th className="px-4 py-3">Tồn kho</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => (
                <tr key={p._id} className="text-slate-300 transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link to={`/products/${p._id}`} className="flex items-center gap-2 font-medium text-white hover:text-primary-400">
                      {p.name}
                      {p.stockQty <= p.minStock && <AlertTriangle size={15} className="text-amber-400" />}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.sku || "-"}</td>
                  <td className="px-4 py-3">{formatVND(p.costPrice)}</td>
                  <td className="px-4 py-3 font-medium text-primary-400">{formatVND(p.sellPrice)}</td>
                  <td className="px-4 py-3">{formatVND(productTotals[String(p._id)]?.purchaseCost || 0)}</td>
                  <td className="px-4 py-3 font-medium text-emerald-400">{formatVND(productTotals[String(p._id)]?.salesRevenue || 0)}</td>
                  <td className={`px-4 py-3 font-medium ${p.stockQty <= p.minStock ? "text-amber-400" : "text-white"}`}>{p.stockQty}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => openEditModal(p)} className="text-slate-500 hover:text-blue-400" aria-label="Sửa sản phẩm" title="Sửa sản phẩm"><Pencil size={16} /></button>
                      <button type="button" onClick={() => remove(p._id)} className="text-slate-500 hover:text-red-400" aria-label="Xóa sản phẩm" title="Xóa sản phẩm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.length === 0 && (
        <p className="text-slate-500 text-sm col-span-full text-center py-12">Chưa có sản phẩm nào trong danh mục này.</p>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white text-lg">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
              <button onClick={() => {
                setModal(false);
                setEditingProduct(null);
                setForm({ name: "", sku: "", costPrice: "", sellPrice: "", stockQty: 0, minStock: 2 });
              }} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <input required placeholder="Tên sản phẩm" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Mã SKU (tùy chọn)" className="input-field" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="numeric" placeholder="Giá vốn" className="input-field" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: formatNumberInput(e.target.value) })} />
                <input type="text" inputMode="numeric" placeholder="Giá bán" className="input-field" value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: formatNumberInput(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" inputMode="numeric" placeholder="Tồn kho ban đầu" className="input-field" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: formatNumberInput(e.target.value) })} />
                <input type="text" inputMode="numeric" placeholder="Cảnh báo tồn tối thiểu" className="input-field" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: formatNumberInput(e.target.value) })} />
              </div>
              <button type="submit" className="btn-primary w-full">{editingProduct ? "Lưu thay đổi" : "Lưu sản phẩm"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
