import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type PropsWithChildren,
  type ReactNode
} from "react";

type RouterLocation = {
  pathname: string;
  hash: string;
  search: string;
};

type NavigateOptions = {
  replace?: boolean;
};

type RouterContextValue = {
  location: RouterLocation;
  navigate: (to: string, options?: NavigateOptions) => void;
};

type LinkProps = PropsWithChildren<{
  to: string;
  replace?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  className?: string;
  role?: string;
  children?: ReactNode;
}>;

const RouterContext = createContext<RouterContextValue | null>(null);

const readLocation = (): RouterLocation => ({
  pathname: window.location.pathname || "/",
  hash: window.location.hash || "",
  search: window.location.search || ""
});

export function RouterProvider({ children }: PropsWithChildren) {
  const [location, setLocation] = useState<RouterLocation>(readLocation);

  useEffect(() => {
    const syncLocation = () => setLocation(readLocation());

    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);

    return () => {
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("hashchange", syncLocation);
    };
  }, []);

  const navigate = (to: string, options: NavigateOptions = {}) => {
    const method = options.replace ? "replaceState" : "pushState";
    window.history[method]({}, "", to);
    setLocation(readLocation());
  };

  const value = useMemo<RouterContextValue>(
    () => ({
      location,
      navigate
    }),
    [location]
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
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

export function Link({ to, replace = false, onClick, target, children, ...props }: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      {...props}
      href={to}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          target === "_blank" ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }

        event.preventDefault();
        navigate(to, { replace });
      }}
    >
      {children}
    </a>
  );
}
