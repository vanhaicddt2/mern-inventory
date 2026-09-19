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

  useEffect(() => {
    api.get(`/stats/monthly?year=${year}`).then((res) => setMonthly(res.data));
    api.get(`/stats/by-category?year=${year}`).then((res) => setByCategory(res.data));
  }, [year]);

  useEffect(() => {
    api.get("/stats/yearly").then((res) => setYearly(res.data));
  }, []);

  const totalRevenueYear = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalProfitYear = monthly.reduce((s, m) => s + m.profit, 0);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs text-slate-400 uppercase">Tổng doanh thu năm {year}</p>
          <p className="text-3xl font-bold text-white mt-1">{formatVND(totalRevenueYear)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-400 uppercase">Tổng lợi nhuận năm {year}</p>
          <p className={`text-3xl font-bold mt-1 ${totalProfitYear >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatVND(totalProfitYear)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-white mb-4">Doanh thu &amp; Lợi nhuận theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" tickFormatter={monthLabel} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v / 1000000}tr`} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }} formatter={(v) => formatVND(v)} labelFormatter={monthLabel} />
            <Legend />
            <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="profit" name="Lợi nhuận" fill="#22c55e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
