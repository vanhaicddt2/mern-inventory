import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone || dismissed || !deferredPrompt) return null;

  const install = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="glass border border-white/10 rounded-2xl p-3 flex items-center gap-3">
        <button
          type="button"
          onClick={install}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <Download size={16} /> Cài app trên điện thoại
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-9 h-9 rounded-xl bg-white/5 text-slate-400 hover:text-white"
          aria-label="Đóng"
        >
          <X size={16} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}
