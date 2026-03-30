import { useState, useEffect, useCallback, useRef } from 'react';

interface FieldSchema {
  name: string;
  defaultValue: string;
}

function parseHash(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params = new URLSearchParams(hash);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function writeHash(values: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== '') {
      params.set(key, value);
    }
  }
  const hash = params.toString();
  window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
}

function readLocalStorage(storageKey: string): Record<string, string> {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeLocalStorage(storageKey: string, values: Record<string, string>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // localStorage unavailable or full
  }
}

export function useToolState(storageKey: string, fields: FieldSchema[]) {
  const initializedRef = useRef(false);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }
    return defaults;
  });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }

    const stored = readLocalStorage(storageKey);
    const hashParams = parseHash();
    const merged: Record<string, string> = { ...defaults, ...stored, ...hashParams };
    setValues(merged);
  }, [storageKey, fields]);

  useEffect(() => {
    if (!initializedRef.current) return;
    writeHash(values);
    writeLocalStorage(storageKey, values);
  }, [values, storageKey]);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setMultipleValues = useCallback((updates: Record<string, string>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetValues = useCallback(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }
    setValues(defaults);
  }, [fields]);

  return { values, setValue, setMultipleValues, resetValues };
}
