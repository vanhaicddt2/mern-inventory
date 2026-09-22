import { createContext, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const NotificationContext = createContext(null);

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message, type = "error") => setToast({ message, type });

  const confirmAction = (message, title = "Xác nhận thao tác") => new Promise((resolve) => {
    setConfirmation({ message, title, resolve });
  });

  const closeConfirmation = (result) => {
    confirmation?.resolve(result);
    setConfirmation(null);
  };

  const toastStyles = {
    error: { icon: AlertTriangle, color: "text-red-300", border: "border-red-400/30", bg: "bg-red-500/10" },
    success: { icon: CheckCircle2, color: "text-emerald-300", border: "border-emerald-400/30", bg: "bg-emerald-500/10" },
    info: { icon: Info, color: "text-sky-300", border: "border-sky-400/30", bg: "bg-sky-500/10" },
  };
  const toastStyle = toastStyles[toast?.type] || toastStyles.info;
  const ToastIcon = toastStyle.icon;

  return (
    <NotificationContext.Provider value={{ notify, confirmAction }}>
      {children}

      {toast && (
        <div className={`fixed right-4 bottom-4 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${toastStyle.bg} ${toastStyle.border}`} role="alert">
          <ToastIcon size={20} className={`mt-0.5 shrink-0 ${toastStyle.color}`} />
          <p className="flex-1 text-sm leading-5 text-slate-100">{toast.message}</p>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-white" aria-label="Đóng thông báo">
            <X size={17} />
          </button>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300"><AlertTriangle size={20} /></div>
              <div>
                <h2 className="font-semibold text-white">{confirmation.title}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-400">{confirmation.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => closeConfirmation(false)} className="btn-secondary">Hủy</button>
              <button type="button" onClick={() => closeConfirmation(true)} className="btn-primary">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
