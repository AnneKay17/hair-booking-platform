import { useCallback, useState } from "react";
import ConfirmDialog from "../components/admin/ConfirmDialog";

export default function useConfirmDialog() {
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const confirm = useCallback((next) => {
    setError(null);
    setConfig(next);
  }, []);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await config.action();
      setConfig(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dialog = config ? (
    <ConfirmDialog
      {...config}
      busy={busy}
      error={error}
      onConfirm={run}
      onCancel={() => !busy && setConfig(null)}
    />
  ) : null;

  return { confirm, dialog };
}