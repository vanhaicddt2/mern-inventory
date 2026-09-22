import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Smartphone,
  Monitor,
  Boxes,
  BarChart3,
  Users,
  Truck,
  LogOut,
  Menu,
  X,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import api from "../api/axios.js";
import PWAInstallPrompt from "./PWAInstallPrompt.jsx";

const iconMap = {
  smartphone: Smartphone,
  monitor: Monitor,
  package: Boxes,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { confirmAction } = useNotification();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const navItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all";
  const activeCls = "bg-primary-600/20 text-primary-300 border border-primary-500/30";
  const idleCls = "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent";

  return (
    <div className="min-h-screen bg-surface flex text-slate-100">
      {/* backdrop mobile */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-full glass border-r border-white/5 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:w-0 lg:overflow-hidden" : "lg:w-72"
        } ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">InvManager</h1>
            <p className="text-xs text-slate-400">Quản lý kinh doanh</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="hidden lg:block text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarCollapsed(true)}
              title="Ẩn Sidebar"
              aria-label="Ẩn Sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
            <button className="lg:hidden text-slate-400" onClick={() => setOpen(false)} aria-label="Đóng menu">
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase px-4 mb-2">Tổng quan</p>
          <NavLink to="/" end className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}>
            <BarChart3 size={18} /> Thống kê doanh thu
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}>
            <Users size={18} /> Khách hàng
          </NavLink>
          <NavLink to="/suppliers" className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}>
            <Truck size={18} /> Nhà cung cấp
          </NavLink>

          <p className="text-xs font-semibold text-slate-500 uppercase px-4 mt-6 mb-2">Danh mục sản phẩm</p>
          {categories.map((c) => {
            const Icon = iconMap[c.icon] || Boxes;
            return (
              <NavLink
                key={c._id}
                to={`/categories/${c._id}`}
                className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}
              >
                <Icon size={18} style={{ color: c.color }} />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full">{c.productCount ?? 0}</span>
              </NavLink>
            );
          })}
          <NavLink to="/categories" className={({ isActive }) => `${navItem} ${isActive ? activeCls : idleCls}`}>
            <Layers size={18} /> Quản lý danh mục
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role === "admin" ? "Quản trị viên" : "Nhân viên"}</p>
            </div>
            <button
              onClick={async () => {
                const confirmed = await confirmAction("Bạn có chắc muốn đăng xuất khỏi tài khoản này không?", "Xác nhận đăng xuất");
                if (!confirmed) return;
                logout();
                navigate("/login");
              }}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed top-4 left-4 z-30 h-10 w-10 items-center justify-center rounded-xl glass text-slate-300 hover:text-white transition-colors"
            title="Mở Sidebar"
            aria-label="Mở Sidebar"
          >
            <PanelLeftOpen size={20} />
          </button>
        )}
        <header className="lg:hidden flex items-center gap-3 px-4 py-4 glass border-b border-white/5 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="text-slate-300">
            <Menu size={22} />
          </button>
          <h1 className="font-bold text-white">InvManager</h1>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <PWAInstallPrompt />
      </div>
    </div>
  );
}
