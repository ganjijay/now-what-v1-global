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
        const backEvent = new CustomEvent("nowwhat-back", {
          cancelable: true
        });

        window.dispatchEvent(backEvent);

        if (backEvent.defaultPrevented) {
          return;
        }

        const isHomePage =
          window.location.pathname === "/" ||
          window.location.pathname === "";

        if (!isHomePage) {
          window.location.href = "/";
        } else {
          App.exitApp();
        }
      });
    };

    connectBackButton();

    return () => {
      listener?.remove();
    };
  }, []);

  return null;
}