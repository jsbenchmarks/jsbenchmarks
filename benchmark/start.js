import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";
import * as util from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as zlib from "zlib";
import { prepare } from "./prepare.js";
import { benchmarks as allBenchmarks } from "./tests.js";

const gzip = util.promisify(zlib.gzip);
const brotli = util.promisify(zlib.brotliCompress);

async function fetchStats(packageName) {
  if (!packageName) return { stars: 0, downloads: 0 };

  let stars = 0;
  let downloads = 0;
  let url = undefined;

  try {
    const downloadRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${packageName}`);
    if (downloadRes.ok) {
      const data = await downloadRes.json();
      downloads = data.downloads || 0;
    }
  } catch (e) {
    console.error(`Failed to fetch downloads for ${packageName}:`, e.message);
  }

  try {
    const registryRes = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (registryRes.ok) {
      const data = await registryRes.json();
      const repoUrl = data.repository?.url || "";
      const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
      if (match) {
        const owner = match[1];
        let repo = match[2];
        if (repo.endsWith('.git')) repo = repo.slice(0, -4);
        url = `https://github.com/${owner}/${repo}`;
        const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (githubRes.ok) {
          const ghData = await githubRes.json();
          stars = ghData.stargazers_count || 0;
        }
      }
    }
  } catch (e) {
    console.error(`Failed to fetch repo info for ${packageName}:`, e.message);
  }

  return { stars, downloads, url };
}

async function calculateSizes(directoryPath) {
  const files = await fs.promises.readdir(directoryPath);
  let totalRaw = 0;
  let totalGzip = 0;
  let totalBrotli = 0;
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = await fs.promises.stat(filePath);
    if (stats.isFile()) {
      const fileContent = await fs.promises.readFile(filePath);
      totalRaw += fileContent.length;

      const gzippedContent = await gzip(fileContent);
      totalGzip += gzippedContent.length;

      const brotliContent = await brotli(fileContent);
      totalBrotli += brotliContent.length;
    } else {
      const { raw, gzip, brotli } = await calculateSizes(filePath);
      totalRaw += raw;
      totalGzip += gzip;
      totalBrotli += brotli;
    }
  }
  return { raw: totalRaw, gzip: totalGzip, brotli: totalBrotli };
}

async function checkKeyed(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  try {
    await page.goto(url);
    await page.waitForSelector("#create");
    await page.click("#create");
    await page.waitForSelector("tbody tr");

    // Store reference to the first row
    await page.evaluate(() => {
      window.testRow = document.querySelector("tbody tr");
    });

    // Replace rows
    await page.click("#create");

    // Wait for update (short delay to ensure DOM update happens)
    await new Promise(r => setTimeout(r, 200));

    // Check if the node is still connected
    const isKeyed = await page.evaluate(() => !window.testRow.isConnected);
    return isKeyed;
  } catch (e) {
    console.warn("Failed to perform keyed check:", e.message);
    return false;
  } finally {
    await page.close();
  }
}

async function execute(page, tasks, j) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const click = j === undefined ? task.click : task.click.replace(/__nth__/g, `${j + 1}`);
    await page.click(click);
    if (typeof task.done === "string") {
      const done = j === undefined ? task.done : task.done.replace(/__nth__/g, `${j + 1}`);
      await page.waitForSelector(done);
    } else {
      await page.waitForFunction(task.done, {}, j);
    }
  }
}

function resolveNth(selector, j) {
  if (j === undefined) return selector;
  return selector.replace(/__nth__/g, `${j + 1}`);
}

async function executeMeasured(page, measure, framework, benchmarkName, runIndex) {
  const traceFilename = `${framework}-${benchmarkName}-${runIndex}.json`;
  const tracePath = "trace.json";
  const storagePath = path.join("results", "public", "traces", traceFilename);

  // Clean up previous trace if it exists locally
  try {
    await fs.promises.unlink(tracePath);
  } catch (e) { }

  // Start Tracing
  await page.tracing.start({
    path: tracePath,
    screenshots: false,
    categories: ['devtools.timeline', 'blink.user_timing', 'disabled-by-default-devtools.timeline'],
  });

  // Prepare the condition string to be evaluated in the browser context.
  // We resolve the "nth" replacement here in Node before sending the string to the browser.
  const doneFnString = typeof measure.done === "string"
    ? `document.querySelector("${resolveNth(measure.done)}") !== null`
    : `(${measure.done.toString()})()`;

  const clickSelector = resolveNth(measure.click);

  // Execute the benchmark logic entirely inside the browser to minimize IPC latency
  await page.evaluate(async (selector, doneCondition) => {
    return new Promise((resolve, reject) => {
      // 1. Create a function from the condition string
      const check = new Function("return " + doneCondition);

      // 2. Setup MutationObserver to watch for DOM changes
      const observer = new MutationObserver(() => {
        if (check()) {
          // DOM condition met: Mark immediately
          performance.mark("bench-dom-done");
          observer.disconnect();
          resolve();
        }
      });

      // 3. Start observing the body
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });

      // 4. Trigger the Action
      // We use native DOM click to reduce Puppeteer protocol latency overhead
      const btn = document.querySelector(selector);
      if (btn) {
        btn.click();
      } else {
        observer.disconnect();
        reject(new Error(`Benchmark button not found: ${selector}`));
        return;
      }

      // 5. Immediate check (for synchronous updates)
      // If the framework updates the DOM synchronously inside the click handler,
      // the observer callback might not have fired yet or we want to catch it ASAP.
      if (check()) {
        performance.mark("bench-dom-done");
        observer.disconnect();
        resolve();
      }
    });
  }, clickSelector, doneFnString);

  // Wait a buffer period to ensure the Paint/Commit event is captured.
  // The mark happens at the end of Scripting; Painting happens shortly after.
  // We need to keep the trace recording long enough to catch that Paint.
  await new Promise(r => setTimeout(r, 200));

  await page.tracing.stop();

  // Move trace file to storage directory
  fs.mkdirSync(path.join("results", "public", "traces"), { recursive: true });
  await fs.promises.rename(tracePath, storagePath);

  return traceFilename;
}

(async () => {
  const start = performance.now();
  const argv = yargs(hideBin(process.argv))
    .option("frameworks", {
      alias: "f",
      type: "string",
      description: "A comma-separated list of frameworks to use (e.g., 'react,angular,vue')",
    })
    .option("benchmarks", {
      alias: "b",
      type: "string",
      description: "A comma-separated list of benchmarks to run (e.g., 'create,select,clear')",
    })
    .option("skip-benchmarks", {
      type: "boolean",
      description: "Skip running benchmarks, only update stats and sizes",
    })
    .option("runs", {
      type: "number",
      description: "Number of runs to perform",
    })
    .option("skip-build", {
      type: "boolean",
      description: "Skip npm install and npm run build steps",
    })
    .help()
    .alias("help", "h")
    .argv;

  // Ensure directories exist
  await fs.promises.mkdir("results/frameworks", { recursive: true });
  await fs.promises.mkdir("results/public/traces", { recursive: true });

  let frameworks;
  let benchmarks = allBenchmarks;
  if (argv.benchmarks) {
    const names = argv.benchmarks.split(",").map(b => b.trim());
    benchmarks = benchmarks.filter(t => names.includes(t.name));
  }
  if (argv.frameworks) {
    frameworks = argv.frameworks.split(",").map(f => f.trim());
  } else {
    frameworks = (await fs.promises.readdir("./frameworks"));
  }

  await prepare(frameworks, argv.skipBuild);

  // Targeted cleanup of previous runs for the selected frameworks/benchmarks
  if (!argv.skipBenchmarks) {
    const tracesDir = path.join("results", "public", "traces");
    const existingFiles = await fs.promises.readdir(tracesDir);
    for (const fw of frameworks) {
      for (const bench of benchmarks) {
        const prefix = `${fw}-${bench.name}-`;
        for (const file of existingFiles) {
          if (file.startsWith(prefix)) {
            await fs.promises.unlink(path.join(tracesDir, file)).catch(() => { });
          }
        }
      }
    }
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--js-flags=--expose-gc",
      "--enable-precise-memory-info",
      "--window-size=1200,800",
      "--no-default-browser-check",
      "--disable-sync",
      "--no-first-run",
      "--disable-gpu-vsync",
      "--disable-frame-rate-limit",
      "--ash-no-nudges",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-extensions",
      "--disable-features=Translate,PrivacySandboxSettings4,IPH_SidePanelGenericMenuFeature",
    ],
  });

  const frameworkEntries = [];
  for (const fw of frameworks) {
    try {
      const pkg = JSON.parse(await fs.promises.readFile(path.join("frameworks", fw, "package.json"), "utf8"));
      let version = "unknown";
      if (pkg.jsbenchmarks && pkg.jsbenchmarks.package) {
        const packageName = pkg.jsbenchmarks.package;
        if (pkg.dependencies && pkg.dependencies[packageName]) {
          version = pkg.dependencies[packageName];
        } else if (pkg.devDependencies && pkg.devDependencies[packageName]) {
          version = pkg.devDependencies[packageName];
        }
      }

      const result = {
        framework: fw,
        benchmarks: [], // We don't need to prepopulate this for the file
        website: pkg.jsbenchmarks ? pkg.jsbenchmarks.website : pkg.website,
        version: version.replace(/^\^|~/, "")
      };

      const stats = await fetchStats(pkg.jsbenchmarks?.package);
      result.stars = stats.stars;
      result.downloads = stats.downloads;
      result.gitHubUrl = stats.url;

      const implPath = `frameworks/${fw}/dist`;
      const sizes = await calculateSizes(`./${implPath}`);
      result.gzipBundle = sizes.gzip;
      result.rawBundle = sizes.raw;
      result.brotliBundle = sizes.brotli;

      // Save framework metadata immediately
      await fs.promises.writeFile(
        path.join("results", "frameworks", `${fw}.json`),
        JSON.stringify(result, null, 2)
      );

      const uri = `http://localhost:3000/${implPath}/`;
      const isKeyed = await checkKeyed(browser, uri);
      if (!isKeyed) {
        throw new Error(`${fw} behaves as NON-KEYED (should be KEYED)`);
      }

      console.log(`${fw} bundle: gzip ${Math.round(sizes.gzip / 100) / 10}KB, raw ${Math.round(sizes.raw / 100) / 10}KB, brotli ${Math.round(sizes.brotli / 100) / 10}KB`);
      frameworkEntries.push({ fw, uri, result });
    } catch (e) {
      console.error(`Failed to benchmark ${fw}:`, e);
    }
  }

  if (!argv.skipBenchmarks) {
    const maxRuns = argv.runs ?? benchmarks.reduce((max, b) => Math.max(max, b.runs ?? 0), 0);

    for (let runIndex = 0; runIndex < maxRuns; runIndex++) {
      for (let benchmarkIndex = 0; benchmarkIndex < benchmarks.length; benchmarkIndex++) {
        const benchmark = benchmarks[benchmarkIndex];
        const runsForBenchmark = argv.runs ?? benchmark.runs;
        if (runIndex >= runsForBenchmark) continue;

        for (const entry of [...frameworkEntries]) {
          const { fw, uri, result } = entry;
          let failed = false;
          let page;
          try {
            page = await browser.newPage();
            page.setDefaultTimeout(5000);
            await page.setViewport({ width: 1200, height: 800 });
            await page.goto(uri, { waitUntil: "load" });
            await page.bringToFront();
            await page.waitForSelector("main");
            await execute(page, benchmark.setup);
            for (let j = 0; j < 5; j++) {
              await execute(page, benchmark.warmup, j);
            }
            await page.click("#clear");
            await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 0);
            await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
            await execute(page, benchmark.setup);
            await page.evaluate(() => window.gc());
            await new Promise(r => setTimeout(r, 100));
            const traceFile = await executeMeasured(page, benchmark.measure, fw, benchmark.name, runIndex);
            await page.evaluate(() => window.gc());
            await new Promise(r => setTimeout(r, 10));
            const metrics = await page.metrics();
            const memory = metrics.JSHeapUsedSize;

            // Save measurement metadata
            const meta = {
              framework: fw,
              benchmark: benchmark.name,
              runIndex,
              memory,
              traceFile: traceFile
            };
            await fs.promises.writeFile(
              path.join("results", "public", "traces", `${traceFile}.meta.json`),
              JSON.stringify(meta, null, 2)
            );

            console.log(`${fw} ${benchmark.name}:`, { trace: traceFile, memory: (memory / 1024 / 1024).toFixed(1) + "MB" });
          } catch (e) {
            console.error(`Failed to benchmark ${fw} (${benchmark.name}, run ${runIndex + 1}):`, e);
            failed = true;
          } finally {
            if (page) await page.close();
          }

          if (failed) {
            const idx = frameworkEntries.findIndex(e => e.fw === fw);
            if (idx !== -1) frameworkEntries.splice(idx, 1);
            // No need to remove from currentRunResults as we don't use it anymore
          }
        }
      }
    }
  }
  await browser.close();

  const duration = performance.now() - start;
  const minutes = Math.floor(duration / 1000 / 60);
  const seconds = Math.round(duration / 1000) % 60;
  console.log(`benchmark ran in ${minutes}m ${seconds}s`);
})();
