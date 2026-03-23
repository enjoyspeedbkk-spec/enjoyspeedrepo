"use client";

import { useState, useEffect, useRef } from "react";

// =============================================
// LIFF (LINE Front-end Framework) Hook
// Loads SDK from CDN, detects LINE context, captures profile
// =============================================

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffState {
  initialized: boolean;
  isInClient: boolean;
  profile: LiffProfile | null;
  error: string | null;
  loading: boolean;
}

const LIFF_TIMEOUT_MS = 5000;
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
const LIFF_CDN = "https://static.line-scdn.net/liff/edge/2/sdk.js";

// Global to avoid re-loading the script
let liffLoadPromise: Promise<void> | null = null;

function loadLiffScript(): Promise<void> {
  if (liffLoadPromise) return liffLoadPromise;

  liffLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== "undefined" && (window as any).liff) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = LIFF_CDN;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
    document.head.appendChild(script);
  });

  return liffLoadPromise;
}

/**
 * React hook for LIFF integration.
 *
 * Loads the LIFF SDK from LINE CDN, initializes it, and fetches user profile
 * if the user opened the page from within LINE (rich menu, push message link).
 *
 * Gracefully degrades — returns { isInClient: false } if:
 * - No LIFF ID is configured
 * - LIFF SDK fails to load
 * - Initialization times out (5s)
 * - User is in a regular browser (not LINE)
 */
export function useLiff(): LiffState {
  const [state, setState] = useState<LiffState>({
    initialized: false,
    isInClient: false,
    profile: null,
    error: null,
    loading: true,
  });
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (!LIFF_ID) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    initLiff();

    async function initLiff() {
      try {
        // Load LIFF SDK from CDN
        await Promise.race([
          loadLiffScript(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("LIFF script load timeout")), LIFF_TIMEOUT_MS)
          ),
        ]);

        const liff = (window as any).liff;
        if (!liff) throw new Error("LIFF SDK not available");

        // Initialize LIFF
        await Promise.race([
          liff.init({ liffId: LIFF_ID }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("LIFF init timeout")), LIFF_TIMEOUT_MS)
          ),
        ]);

        const isInClient = liff.isInClient();

        if (!isInClient) {
          setState({
            initialized: true,
            isInClient: false,
            profile: null,
            error: null,
            loading: false,
          });
          return;
        }

        // Inside LINE — get profile
        let profile: LiffProfile | null = null;
        try {
          const lineProfile = await liff.getProfile();
          profile = {
            userId: lineProfile.userId,
            displayName: lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            statusMessage: lineProfile.statusMessage,
          };
        } catch {
          // Profile fetch failed — continue without it
        }

        setState({
          initialized: true,
          isInClient: true,
          profile,
          error: null,
          loading: false,
        });
      } catch (err) {
        console.warn("LIFF initialization failed:", err);
        setState({
          initialized: false,
          isInClient: false,
          profile: null,
          error: err instanceof Error ? err.message : "LIFF init failed",
          loading: false,
        });
      }
    }
  }, []);

  return state;
}
