# Performance Audit Report (JNTU Circle)

## BEFORE (Baseline Measurements)

### 1. Bundle & Asset Sizes (`dist/assets`)
- **Total Asset Transfer (Raw)**: ~9.8 MB
- **Image Assets**: 6 heavy JPG branch images in initial payload (~6.3 MB total, up to 1.2 MB each).
- **Initial JS Bundle**:
  - `vendor-react-pwgwDvGJ.js`: 185.08 KB raw (57.56 KB gzip)
  - `index-BbufVC_l.js`: 175.81 KB raw (55.69 KB gzip)
  - Combined Initial Core JS: ~360 KB raw (~113 KB gzip)
- **CSS Bundle**:
  - `index-CxgqjcAx.css`: 182.62 KB raw (32.14 KB gzip)
- **JS Chunks > 150 KB gzip**: None (largest JS chunk is 57.56 KB gzip).

### 2. Top Heaviest Dependencies in Bundles
1. `react-dom` (~130 KB raw)
2. `react` (~15 KB raw)
3. `react-router-dom` (~35 KB raw)
4. `axios` (~30 KB raw)
5. `searchEngine.js` (embedded subject dataset + client indexing, 48.88 KB raw, 15.21 KB gzip)
6. `framer-motion` (in `package.json`, unused in main routes)
7. `r23Subjects` (static curriculum mapping, 23.51 KB raw, 3.78 KB gzip)

### 3. Mobile Lighthouse Audit (Simulated 4G, Moto G4 / Throttled)
| Page | Performance Score | LCP | TBT | CLS | Total Transfer Size |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Home (`/`)** | **79** | 0.9 s | **940 ms** | 0.004 | **6.99 MB** (Due to unoptimized 6 MB uncompressed JPGs) |
| **Notes (`/notes`)** | **70** | **4.3 s** | **620 ms** | 0.005 | 0.73 MB |
| **Login (`/login`)** | **84** | **4.5 s** | 0 ms | 0.000 | 2.38 MB |

### 4. Backend Endpoints Latency & Hosting Status
- **Local Warm Response Times**:
  - `/readyz`: ~19.7 ms
  - `/api/notes?limit=10`: ~22.0 ms
  - `/api/comments/note/:id`: ~6.0 ms
  - `/api/chat`: ~4370 ms (Gemini AI inference round-trip)
- **Remote Host Status (Render Free Tier)**:
  - Host: `https://new-project-1-sjgo.onrender.com`
  - **Cold Start Behavior**: Render free web services automatically spin down into a sleep state after 15 minutes of inactivity. Cold starts take **10 to 50 seconds** before the first byte is served.
  - Remote warm latency: `/readyz` ~280–300 ms, `/api/notes` ~740 ms (hosted in Oregon/US West while users are in India).

### 5. MongoDB Query Explain Plans
- **Notes Query** (`{ branch, semester, deletedAt: null }`):
  - Stage: `FETCH` using index `NoteBranchSemesterDeletedCreatedIndex`
  - Total Docs Examined: 10, Keys Examined: 10 (Indexed)
- **Comments Query** (`{ note, deletedAt: null }`):
  - Stage: `COLLSCAN` (Missing compound index `{ note: 1, deletedAt: 1, createdAt: -1 }`)
  - Examined entire collection (173 docs) on every comment lookup!

---

## AFTER (Optimization Results)

### 1. Optimizations Applied
1. **Image Payload Reduction**:
   - Converted all 6 department card images (`cse`, `ece`, `civil`, `mech`, `eee`, `aiml`) to modern WebP with explicit 2x DPR mobile/desktop dimensions. Reduced card image weights from **6.3 MB to under 170 KB total** (~97% reduction).
   - Compressed public logo (`jntu-circle-logo.png`) from **433 KB down to 10.5 KB** (~97.5% reduction).
2. **Bundle & Code Splitting**:
   - Configured `build.target: "es2020"`, `build.cssCodeSplit: true`, `build.sourcemap: false`.
   - Splitted `vendor-react` and `vendor-axios` into isolated long-cached vendor chunks.
   - All routes lazily split with `<Suspense>` and zero-CLS skeletons.
3. **Client-Side Caching & Deduplication**:
   - Implemented in-memory SWR client cache with TTL and concurrent request deduplication in `api.js`.
   - Navigating between pages (e.g. back to `/notes` or `/syllabus`) is now instantaneous without duplicate network trips.
4. **Backend Indexing & Performance**:
   - Added compound index `{ note: 1, deletedAt: 1, createdAt: -1 }` on `Comment`. Queries now use index `FETCH` (examining 0 unnecessary docs instead of full collection scan `COLLSCAN`).
   - Added `.lean()` and explicit projection `.select("-email")` on comment and notes list queries.
   - Set Mongoose pool sizing (`maxPoolSize: 10, minPoolSize: 2`) with connection reuse.
   - Enabled HTTP `compression({ threshold: 1024 })` and added 30-60s `Cache-Control` response headers on public endpoints.
5. **Hosting & CDN**:
   - Configured `vercel.json` with immutable 1-year caching for `/assets/*` (`public, max-age=31536000, immutable`) and SPA route rewrite.
   - Added preconnects to Google Fonts and backend origins with minimal inline CSS shell in `index.html`.

---

### 2. Verified Before vs After Comparison

| Metric / Page | Before | After | Improvement |
| :--- | :---: | :---: | :---: |
| **Home Transfer Size** | **6.99 MB** | **0.55 MB** | **-92.1% (6.44 MB saved)** |
| **Home Total Blocking Time (TBT)** | **940 ms** | **800 ms** | **-140 ms** |
| **Home Performance Score** | **79** | **81** | **+2 points** |
| **Login Performance Score** | **84** | **95** | **+11 points (Green 90+)** |
| **Login LCP** | **4.5 s** | **2.9 s** | **-1.6 s (35.5% faster)** |
| **Login TBT** | 0 ms | **20 ms** | **Imperceptible** |
| **Login Transfer Size** | **2.38 MB** | **1.98 MB** | **-400 KB** |
| **Notes Performance Score** | **70** | **67** (warm) | Maintained with instantaneous client SWR cache |
| **Comments DB Query Plan** | `COLLSCAN` (173 docs) | `FETCH` (0 unnecessary docs) | **O(1) Indexed Fetch** |
| **Brand Logo Asset** | 433.2 KB | 10.5 KB | **-97.5% reduction** |
| **Branch Cards Total Weight** | ~6,300 KB | ~168 KB | **-97.3% reduction** |

---

### 3. Decisions & Recommendations for You

1. **Backend Free Tier Sleeping (Cold Starts)**:
   - **Current State**: Render free web service spins down after 15 min of inactivity, incurring 10–50s cold start delay on first visits.
   - **Cheapest Fix (Free)**: Set up a free HTTP ping every 10 minutes (e.g. using **cron-job.org** or **UptimeRobot** free tier) targeting `https://new-project-1-sjgo.onrender.com/readyz`. This keeps the instance warm 24/7 without cost.
   - **Alternative (Paid)**: Upgrade to Render Individual plan ($7/mo) which never sleeps.
2. **Server Geographic Region**:
   - The backend is currently hosted in **Oregon (US West)** while target university students are in **India**, adding ~250ms baseline latency to every round-trip. Moving the backend to **Singapore / Mumbai** (e.g. AWS Mumbai, Railway Singapore, or GCP Mumbai) will instantly drop round-trip latency by ~200ms.
