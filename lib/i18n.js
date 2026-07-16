"use client";

import { useEffect, useState } from "react";

export const APP_LANGUAGES = [
  ["en", "English"],
  ["ko", "한국어"],
  ["es", "Español"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["pt", "Português"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
  ["vi", "Tiếng Việt"],
  ["th", "ไทย"]
];

const SUPPORTED = new Set(APP_LANGUAGES.map(([code]) => code));

export function normalizeLanguage(value) {
  const code = String(value || "")
    .toLowerCase()
    .split("-")[0];

  return SUPPORTED.has(code) ? code : "en";
}

export function useAppLanguage() {
  const [appLanguage, setAppLanguageState] = useState("en");
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nowwhat_app_language");
    const detected = normalizeLanguage(
      saved || navigator.language || navigator.languages?.[0]
    );

    setAppLanguageState(detected);
    document.documentElement.lang = detected;
    document.documentElement.dir = detected === "ar" ? "rtl" : "ltr";
    setLanguageReady(true);
  }, []);

  function setAppLanguage(language) {
    const normalized = normalizeLanguage(language);
    setAppLanguageState(normalized);
    window.localStorage.setItem("nowwhat_app_language", normalized);
    document.documentElement.lang = normalized;
    document.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(
      new CustomEvent("nowwhat-language-change", {
        detail: normalized
      })
    );
  }

  return {
    appLanguage,
    setAppLanguage,
    languageReady
  };
}

export function LanguageSelector({
  value,
  onChange,
  label = "Language",
  className = ""
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {APP_LANGUAGES.map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
