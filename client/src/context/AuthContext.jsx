import { useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "../services/apiClient";
import { getCurrentAdmin, login as loginRequest, logout as logoutRequest } from "../services/authApi";
import { AuthStateContext } from "./AuthStateContext";

const ANONYMOUS = { status: "anonymous", admin: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", admin: null });

  useEffect(() => {
    let cancelled = false;

    getCurrentAdmin()
      .then((admin) => !cancelled && setState({ status: "authenticated", admin }))
      .catch(() => !cancelled && setState(ANONYMOUS));

    // Any admin request that comes back 401 (expired/invalid session) ends the session here.
    setUnauthorizedHandler(() => setState(ANONYMOUS));

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login: async (email, password) => {
        const admin = await loginRequest({ email, password });
        setState({ status: "authenticated", admin });
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          setState(ANONYMOUS);
        }
      },
    }),
    [state]
  );

  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}