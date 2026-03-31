import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const RouterContext = createContext(null);
const readLocation = () => ({
    pathname: window.location.pathname || "/",
    hash: window.location.hash || "",
    search: window.location.search || ""
});
export function RouterProvider({ children }) {
    const [location, setLocation] = useState(readLocation);
    useEffect(() => {
        const syncLocation = () => setLocation(readLocation());
        window.addEventListener("popstate", syncLocation);
        window.addEventListener("hashchange", syncLocation);
        return () => {
            window.removeEventListener("popstate", syncLocation);
            window.removeEventListener("hashchange", syncLocation);
        };
    }, []);
    const navigate = (to, options = {}) => {
        const method = options.replace ? "replaceState" : "pushState";
        window.history[method]({}, "", to);
        setLocation(readLocation());
    };
    const value = useMemo(() => ({
        location,
        navigate
    }), [location]);
    return _jsx(RouterContext.Provider, { value: value, children: children });
}
function useRouterContext() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error("Router hooks must be used within RouterProvider");
    }
    return context;
}
export function useLocation() {
    return useRouterContext().location;
}
export function useNavigate() {
    return useRouterContext().navigate;
}
export function Link({ to, replace = false, onClick, target, children, ...props }) {
    const navigate = useNavigate();
    return (_jsx("a", { ...props, href: to, target: target, onClick: (event) => {
            onClick?.(event);
            if (event.defaultPrevented ||
                event.button !== 0 ||
                target === "_blank" ||
                event.metaKey ||
                event.altKey ||
                event.ctrlKey ||
                event.shiftKey) {
                return;
            }
            event.preventDefault();
            navigate(to, { replace });
        }, children: children }));
}
