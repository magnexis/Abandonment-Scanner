import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from "react";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const value = useMemo(() => ({
        toasts,
        pushToast(toast) {
            const id = crypto.randomUUID();
            setToasts((current) => [...current, { ...toast, id }]);
            window.setTimeout(() => {
                setToasts((current) => current.filter((item) => item.id !== id));
            }, 3500);
        },
        removeToast(id) {
            setToasts((current) => current.filter((item) => item.id !== id));
        }
    }), [toasts]);
    return _jsx(ToastContext.Provider, { value: value, children: children });
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
