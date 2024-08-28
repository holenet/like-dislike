import { useEffect, useMemo, useState } from "preact/hooks";

export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (v: T) => any] {
  const [_value, _setValue] = useState<T>();

  useEffect(() => {
    const v = localStorage.getItem(key);
    _setValue(v !== null ? JSON.parse(v) : defaultValue);
  }, [key]);

  const setValue = useMemo(() => {
    return (v: T) => {
      _setValue(v);
      localStorage.setItem(key, JSON.stringify(v));
    };
  }, [key]);

  return [_value, setValue];
}
