"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export default function CapacitorBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener;

    const connectBackButton = async () => {
      listener = await App.addListener("backButton", () => {
        if (
          window.nowWhatPricingOpen &&
          typeof window.closeNowWhatPricing === "function"
        ) {
          window.closeNowWhatPricing();
          return;
        }

        const isHomePage =
          window.location.pathname === "/" ||
          window.location.pathname === "";

        if (!isHomePage) {
          window.location.href = "/";
          return;
        }

        App.exitApp();
      });
    };

    connectBackButton();

    return () => {
      listener?.remove();
    };
  }, []);

  return null;
}