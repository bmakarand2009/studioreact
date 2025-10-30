import { useNavigate as useRouterNavigate, useLocation, useSearchParams as useRouterSearchParams } from 'react-router-dom';

export function useRouter() {
  const navigate = useRouterNavigate();
  const location = useLocation();
  
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    pathname: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useRouterSearchParams();
  
  return {
    get: (key: string) => searchParams.get(key),
    getAll: (key: string) => searchParams.getAll(key),
    has: (key: string) => searchParams.has(key),
    set: (key: string, value: string) => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set(key, value);
        return newParams;
      });
    },
    delete: (key: string) => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete(key);
        return newParams;
      });
    },
    toString: () => searchParams.toString(),
  };
}
