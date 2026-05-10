import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function usePersistentState<T>(
  storageKey: string,
  initialValue: T,
): readonly [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue] as const;
}
