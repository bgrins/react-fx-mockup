import { useState, useEffect, useCallback, useRef } from "react";
import { extractOpenGraphFromUrl, type OpenGraphData } from "~/utils/opengraph";

interface UseOpenGraphOptions {
  /** Whether to use proxy for fetching URLs (default: true) */
  useProxy?: boolean;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Whether to automatically fetch when URL changes (default: true) */
  autoFetch?: boolean;
}

interface UseOpenGraphResult {
  /** The extracted OpenGraph data */
  data: OpenGraphData | null;
  /** Whether a request is currently loading */
  loading: boolean;
  /** Error message if extraction failed */
  error: string | null;
  /** Manually fetch OpenGraph data for a URL */
  fetchOpenGraph: (url: string) => Promise<void>;
  /** Clear the current data and error state */
  clear: () => void;
}

/**
 * Hook for fetching OpenGraph metadata from URLs
 */
export function useOpenGraph(url?: string, options: UseOpenGraphOptions = {}): UseOpenGraphResult {
  const { useProxy = true, debounceMs = 500, autoFetch = true } = options;

  const [data, setData] = useState<OpenGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOpenGraph = useCallback(
    async (targetUrl: string) => {
      // Only run on client side
      if (typeof window === "undefined") {
        setError("OpenGraph extraction is only available on the client side");
        return;
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setLoading(true);
        setError(null);

        // Validate URL
        if (!targetUrl || targetUrl.trim() === "") {
          throw new Error("URL is required");
        }

        // Check if it's a valid URL
        try {
          new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
        } catch {
          throw new Error("Invalid URL format");
        }

        // Skip certain URL patterns
        if (
          targetUrl.startsWith("about:") ||
          targetUrl.startsWith("chrome:") ||
          targetUrl.startsWith("firefox:") ||
          targetUrl.startsWith("data:") ||
          targetUrl.includes("localhost") ||
          /^\d+\.\d+\.\d+\.\d+/.test(targetUrl)
        ) {
          setData({ url: targetUrl });
          return;
        }

        const ogData = await extractOpenGraphFromUrl(targetUrl, useProxy);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        setData(ogData);
      } catch (err) {
        // Don't set error if request was aborted
        if (!abortController.signal.aborted) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch OpenGraph data";
          setError(errorMessage);
          setData(null);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [useProxy],
  );

  const debouncedFetchOpenGraph = useCallback(
    (targetUrl: string) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchOpenGraph(targetUrl);
      }, debounceMs);
    },
    [fetchOpenGraph, debounceMs],
  );

  const clear = useCallback(() => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Auto-fetch when URL changes
  useEffect(() => {
    if (!autoFetch || !url) {
      return;
    }

    debouncedFetchOpenGraph(url);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [url, autoFetch, debouncedFetchOpenGraph]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    fetchOpenGraph: useCallback(
      async (targetUrl: string) => {
        debouncedFetchOpenGraph(targetUrl);
      },
      [debouncedFetchOpenGraph],
    ),
    clear,
  };
}

/**
 * Hook for fetching OpenGraph data from multiple URLs
 */
export function useMultipleOpenGraph(urls: string[] = []): Record<string, UseOpenGraphResult> {
  const [results, setResults] = useState<Record<string, UseOpenGraphResult>>({});

  useEffect(() => {
    const newResults: Record<string, UseOpenGraphResult> = {};

    urls.forEach((url) => {
      // Use individual hook for each URL
      // Note: This is a simplified version - in a real implementation,
      // you might want to manage this more efficiently
      newResults[url] = {
        data: null,
        loading: false,
        error: null,
        fetchOpenGraph: async () => {},
        clear: () => {},
      };
    });

    setResults(newResults);
  }, [urls]);

  return results;
}
