import API from "../api/api";

/**
 * High-Speed Stale-While-Revalidate Client Cache & Request Deduplicator
 * Delivers 0ms instantaneous data renders when the user opens the application.
 */

const CACHE_PREFIX = "andhra_cache_v3_";
const MEMORY_CACHE = new Map();
const IN_FLIGHT_REQUESTS = new Map();

// 24 hour local validity for stale-while-revalidate
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Retrieve cached resource synchronously (0ms)
 */
export function getCachedResource(key) {
  // 1. In-memory check
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key);
  }

  // 2. LocalStorage check
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.data)) {
          // If within max age, populate memory and return
          if (Date.now() - (parsed.timestamp || 0) < MAX_CACHE_AGE_MS) {
            MEMORY_CACHE.set(key, parsed.data);
            return parsed.data;
          }
        }
      }
    } catch (e) {
      console.warn(`[Cache] Error reading key ${key}:`, e);
    }
  }

  return null;
}

/**
 * Check if a valid cache entry exists
 */
export function hasCachedResource(key) {
  const data = getCachedResource(key);
  return Boolean(data && Array.isArray(data) && data.length > 0);
}

/**
 * Save resource to memory and localStorage
 */
export function setCachedResource(key, data) {
  if (!Array.isArray(data)) return;

  MEMORY_CACHE.set(key, data);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn(`[Cache] LocalStorage quota exceeded for key ${key}:`, e);
    }
  }
}

/**
 * Optimistically patch an individual item inside cached resource list
 */
export function updateCachedResourceItem(key, itemId, patch) {
  if (!key || !itemId || !patch) return;
  const cached = getCachedResource(key);
  if (!Array.isArray(cached)) return;

  const updated = cached.map((item) => {
    if (item._id === itemId || item.id === itemId) {
      return { ...item, ...patch };
    }
    return item;
  });

  setCachedResource(key, updated);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("resourceItemUpdated", {
        detail: { key, itemId, patch, updatedItems: updated },
      })
    );
  }
}

/**
 * Deduplicated, cached fetcher for individual resource endpoints
 */
export async function fetchResourceWithCache(key, endpoint) {
  // If an exact fetch is already running, piggyback on that Promise
  if (IN_FLIGHT_REQUESTS.has(key)) {
    return IN_FLIGHT_REQUESTS.get(key);
  }

  const fetchPromise = (async () => {
    try {
      const res = await API.get(endpoint);
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.notes)
            ? res.data.notes
            : Array.isArray(res.data?.papers)
              ? res.data.papers
              : Array.isArray(res.data?.syllabus)
                ? res.data.syllabus
                : Array.isArray(res.data?.programs)
                  ? res.data.programs
                  : [];

      if (data && data.length > 0) {
        setCachedResource(key, data);
      }
      return data;
    } catch (err) {
      console.warn(`[Cache] Fetch failed for ${key}, falling back to cache:`, err.message);
      const fallback = getCachedResource(key);
      if (fallback) return fallback;
      throw err;
    } finally {
      IN_FLIGHT_REQUESTS.delete(key);
    }
  })();

  IN_FLIGHT_REQUESTS.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Fast Consolidated Home Resource Prefetcher
 * Fetches all core home resources in 1 single HTTP request via /api/feed/home,
 * instantly populating the client cache for notes, papers, syllabus, labs, and notifications.
 */
let feedPrefetchPromise = null;

export async function prefetchHomeResources(force = false) {
  if (!force && feedPrefetchPromise) {
    return feedPrefetchPromise;
  }

  feedPrefetchPromise = (async () => {
    try {
      // 1. Try single fast consolidated feed endpoint
      const res = await API.get("/feed/home");
      if (res.data) {
        const { notes, papers, syllabus, labPrograms, notifications } = res.data;

        if (Array.isArray(notes)) setCachedResource("notes", notes);
        if (Array.isArray(papers)) setCachedResource("papers", papers);
        if (Array.isArray(syllabus)) setCachedResource("syllabus", syllabus);
        if (Array.isArray(labPrograms)) setCachedResource("labs", labPrograms);
        if (Array.isArray(notifications)) setCachedResource("notifications", notifications);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("resourcesUpdated", {
              detail: { notes, papers, syllabus, labPrograms, notifications },
            })
          );
        }

        return res.data;
      }
    } catch (feedError) {
      // 2. Fallback to parallel individual requests if /feed/home is not reachable
      try {
        const [notes, papers, syllabus, labs, notifs] = await Promise.allSettled([
          fetchResourceWithCache("notes", "/notes"),
          fetchResourceWithCache("papers", "/papers"),
          fetchResourceWithCache("syllabus", "/syllabus"),
          fetchResourceWithCache("labs", "/lab-programs"),
          fetchResourceWithCache("notifications", "/notifications"),
        ]);

        const getVal = (r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []);

        const fallbackData = {
          notes: getVal(notes),
          papers: getVal(papers),
          syllabus: getVal(syllabus),
          labPrograms: getVal(labs),
          notifications: getVal(notifs),
        };

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("resourcesUpdated", { detail: fallbackData })
          );
        }

        return fallbackData;
      } catch (err) {
        console.warn("[Cache] Parallel fallback also had errors:", err.message);
      }
    } finally {
      feedPrefetchPromise = null;
    }
  })();

  return feedPrefetchPromise;
}
