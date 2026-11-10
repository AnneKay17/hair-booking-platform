
import { useCallback, useEffect, useState } from "react";

/**
 * @param {() => Promise<any>} fetcher
 * @param {any[]} deps - refetch when any of these change
 * @param {{ enabled?: boolean }} [options]
 */
export default function useApiData(fetcher, deps, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  });

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const data = await fetcher();

        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: null, loading: false, error });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadKey]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setReloadKey((key) => key + 1);
  }, []);

  return {
    ...state,
    loading: enabled ? state.loading : false,
    reload,
  };
}
