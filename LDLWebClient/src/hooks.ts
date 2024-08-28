import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (v: T) => any] {
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

export const useTransitionInteger = (
  targetValue: number,
  duration: number = 1000
) => {
  duration = Math.max(1, duration);
  const transition = useRef<{
    start: { value: number; time: number };
    end: { value: number; time: number };
  }>({
    start: { value: 0, time: Date.now() },
    end: { value: targetValue, time: Date.now() + duration },
  });
  const [value, _setValue] = useState(0);
  useEffect(() => {
    const now = Date.now();
    transition.current = {
      start: { value, time: now },
      end: { value: targetValue, time: now + duration },
    };
  }, [targetValue]);
  useEffect(() => {
    const callback = () => {
      const t = transition.current;
      const now = Date.now();
      let r = (now - t.start.time) / (t.end.time - t.start.time);
      r = Math.min(1, Math.max(0, r));
      const q = Math.sin((r * Math.PI) / 2);
      const p = t.start.value * (1 - q) + t.end.value * q;
      _setValue(Math.ceil(p));
      requestAnimationFrame(callback);
    };
    const handle = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(handle);
  }, []);
  return value;
};
