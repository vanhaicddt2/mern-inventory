import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, TrendingUp, Package, AlertTriangle, ShoppingCart, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";
import { formatVND, monthLabel } from "../utils/format.js";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    api.get(`/stats/overview?year=${year}`).then((res) => setOverview(res.data));
    api.get(`/stats/monthly?year=${year}`).then((res) => setMonthly(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Xin chào 👋</h1>
        <p className="text-slate-400 text-sm mt-1">Tổng quan hoạt động kinh doanh năm {year}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Doanh thu năm" value={formatVND(overview?.totalRevenue)} color="#6366f1" />
        <StatCard icon={TrendingUp} label="Lợi nhuận" value={formatVND(overview?.profit)} color="#22c55e" />
        <StatCard icon={ShoppingCart} label="Đơn bán" value={overview?.orderCount ?? 0} color="#f59e0b" />
        <StatCard icon={Package} label="Sản phẩm" value={overview?.productCount ?? 0} sub={`${overview?.categoryCount ?? 0} danh mục`} color="#ec4899" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Doanh thu theo tháng</h2>
            <Link to="/statistics" className="text-xs text-primary-400 hover:text-primary-300">Xem chi tiết →</Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="month" tickFormatter={monthLabel} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000000}tr`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }}
                formatter={(v) => formatVND(v)}
                labelFormatter={monthLabel}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400" />
            <h2 className="font-semibold text-white">Sắp hết hàng</h2>
          </div>
          {overview?.lowStock?.length ? (
            <div className="space-y-3">
              {overview.lowStock.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <span className="text-amber-400 font-semibold shrink-0 ml-2">{p.stockQty} còn lại</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Tất cả sản phẩm đều đủ hàng 🎉</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Wallet} label="Chi phí nhập hàng" value={formatVND(overview?.totalPurchaseCost)} color="#f97316" />
        <StatCard icon={Wallet} label="Chi phí phát sinh" value={formatVND(overview?.totalExpense)} color="#ef4444" />
      </div>
    </div>
  );
}
