/**
 * Node built-in load benchmark for main endpoints
 * Evaluates requests per second (RPS) and latency percentiles (p50, p90, p99)
 */

const http = require("http");

async function benchmark(endpoint, totalRequests = 200, concurrency = 20) {
  console.log(`\n--- Benchmarking ${endpoint} (${totalRequests} requests, concurrency ${concurrency}) ---`);
  
  const latencies = [];
  let completed = 0;
  let inFlight = 0;
  let index = 0;

  const startTime = Date.now();

  return new Promise((resolve) => {
    function launch() {
      while (inFlight < concurrency && index < totalRequests) {
        index++;
        inFlight++;
        const reqStart = Date.now();

        http.get(`http://localhost:5000${endpoint}`, (res) => {
          res.resume();
          res.on("end", () => {
            latencies.push(Date.now() - reqStart);
            inFlight--;
            completed++;
            if (completed === totalRequests) {
              const totalDurationMs = Date.now() - startTime;
              latencies.sort((a, b) => a - b);
              const p50 = latencies[Math.floor(latencies.length * 0.5)];
              const p90 = latencies[Math.floor(latencies.length * 0.9)];
              const p99 = latencies[Math.floor(latencies.length * 0.99)];
              const rps = (totalRequests / (totalDurationMs / 1000)).toFixed(1);

              console.log(`Results for ${endpoint}:`);
              console.log(`  Requests / sec : ${rps}`);
              console.log(`  Latency p50    : ${p50} ms`);
              console.log(`  Latency p90    : ${p90} ms`);
              console.log(`  Latency p99    : ${p99} ms`);
              resolve({ endpoint, rps, p50, p90, p99 });
            } else {
              launch();
            }
          });
        }).on("error", (err) => {
          inFlight--;
          completed++;
          if (completed === totalRequests) resolve();
        });
      }
    }

    launch();
  });
}

async function run() {
  await benchmark("/healthz", 300, 25);
  await benchmark("/readyz", 100, 10);
  await benchmark("/api/v1/notes", 150, 15);
  process.exit(0);
}

run();

