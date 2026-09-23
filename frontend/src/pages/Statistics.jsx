import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import api from "../api/axios.js";
import { formatVND, monthLabel } from "../utils/format.js";

export default function Statistics() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    api.get(`/stats/monthly?year=${year}`).then((res) => setMonthly(res.data));
    api.get(`/stats/by-category?year=${year}`).then((res) => setByCategory(res.data));
  }, [year]);

  useEffect(() => {
    api.get("/stats/yearly").then((res) => setYearly(res.data));
  }, []);

  const totalRevenueYear = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalProfitYear = monthly.reduce((s, m) => s + m.profit, 0);
  const totalSaleProfitYear = monthly.reduce((s, m) => s + (m.saleProfit || 0), 0);
  const selectedMonthData = monthly.find((month) => month.month === selectedMonth);
  const selectedCategories = selectedMonthData?.categories || [];
  const selectedCategoryTotals = selectedCategories.reduce((totals, category) => ({
    revenue: totals.revenue + category.revenue,
    saleProfit: totals.saleProfit + category.saleProfit,
    purchaseCost: totals.purchaseCost + category.purchaseCost,
    expense: totals.expense + category.expense,
    profit: totals.profit + category.profit,
  }), { revenue: 0, saleProfit: 0, purchaseCost: 0, expense: 0, profit: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Thống kê doanh thu</h1>
          <p className="text-slate-400 text-sm mt-1">Doanh thu · lợi nhuận theo tháng và theo năm</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-32">
          {yearly.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-400 uppercase">Tổng doanh thu năm {year}</p>
          <p className="text-3xl font-bold text-white mt-1">{formatVND(totalRevenueYear)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 uppercase">Tổng lãi bán hàng năm {year}</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{formatVND(totalSaleProfitYear)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 uppercase">Tổng lợi nhuận năm {year}</p>
          <p className={`text-3xl font-bold mt-1 ${totalProfitYear >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatVND(totalProfitYear)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-4">Doanh thu, lãi bán hàng &amp; lợi nhuận theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthLabel} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000000}tr`} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }} formatter={(v) => formatVND(v)} labelFormatter={monthLabel} />
            <Legend />
            <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="saleProfit" name="Lãi bán hàng" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="profit" name="Lợi nhuận" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white">Lãi theo danh mục từng tháng</h2>
            <p className="mt-1 text-xs text-slate-500">So sánh doanh thu, lãi bán hàng và các khoản chi của từng category.</p>
          </div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="input-field w-36">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={month}>{monthLabel(month)}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Doanh thu</th>
                <th className="px-3 py-3">Lãi bán hàng</th>
                <th className="px-3 py-3">Chi nhập</th>
                <th className="px-3 py-3">Chi phí</th>
                <th className="px-3 py-3">Lợi nhuận ròng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {selectedCategories.map((category) => (
                <tr key={String(category.categoryId)} className="text-slate-300">
                  <td className="px-3 py-3 font-medium text-white">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.category}
                  </td>
                  <td className="px-3 py-3">{formatVND(category.revenue)}</td>
                  <td className="px-3 py-3 text-amber-300">{formatVND(category.saleProfit)}</td>
                  <td className="px-3 py-3">{formatVND(category.purchaseCost)}</td>
                  <td className="px-3 py-3">{formatVND(category.expense)}</td>
                  <td className={`px-3 py-3 font-semibold ${category.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatVND(category.profit)}
                  </td>
                </tr>
              ))}
              {selectedCategories.length > 0 && (
                <tr className="border-t border-white/10 bg-white/5 font-semibold text-white">
                  <td className="px-3 py-3">Tổng cộng tất cả category</td>
                  <td className="px-3 py-3">{formatVND(selectedCategoryTotals.revenue)}</td>
                  <td className="px-3 py-3 text-amber-300">{formatVND(selectedCategoryTotals.saleProfit)}</td>
                  <td className="px-3 py-3">{formatVND(selectedCategoryTotals.purchaseCost)}</td>
                  <td className="px-3 py-3">{formatVND(selectedCategoryTotals.expense)}</td>
                  <td className={`px-3 py-3 ${selectedCategoryTotals.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatVND(selectedCategoryTotals.profit)}
                  </td>
                </tr>
              )}
              {!selectedCategories.length && (
                <tr><td colSpan="6" className="px-3 py-8 text-center text-slate-500">Chưa có dữ liệu category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Xu hướng doanh thu theo năm</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000000}tr`} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }} formatter={(v) => formatVND(v)} />
              <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="saleProfit" name="Lãi bán hàng" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Doanh thu theo danh mục ({year})</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={(d) => d.category}>
                {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }} formatter={(v) => formatVND(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
