import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";
import * as util from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as zlib from "zlib";
import { benchmarks as allBenchmarks } from "./tests.js";

const gzip = util.promisify(zlib.gzip);
const brotli = util.promisify(zlib.brotliCompress);

async function fetchStats(packageName) {
  if (!packageName) return { stars: 0, downloads: 0 };
  
  let stars = 0;
  let downloads = 0;
  
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
  
  return { stars, downloads };
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
  const storagePath = path.join("results", "traces", traceFilename);
  try {
    await fs.promises.unlink(tracePath);
  } catch (e) {}
  
  await page.tracing.start({
    path: tracePath,
    screenshots: false,
    categories: ['devtools.timeline', 'blink.user_timing', 'disabled-by-default-devtools.timeline'],
  });
  
  await page.click(resolveNth(measure.click));
  const doneFn = typeof measure.done === "string" ? resolveNth(measure.done) : measure.done;
  if (typeof doneFn === "string") {
    await page.waitForSelector(doneFn);
  } else {
    await page.waitForFunction(doneFn);
  }
  
  await page.evaluate(() => performance.mark("bench-dom-done"));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await new Promise(r => setTimeout(r, 100));
  await page.tracing.stop();
  
  // Move trace file to storage directory
  fs.mkdirSync(path.join("results", "traces"), { recursive: true });
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
    .help()
    .alias("help", "h")
    .argv;

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

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--js-flags=--expose-gc",
      "--enable-precise-memory-info",
      "--window-size=1200,800",
      "--no-default-browser-check",
      "--disable-sync",
      "--no-first-run",
      "--ash-no-nudges",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-extensions",
      "--disable-features=Translate,PrivacySandboxSettings4,IPH_SidePanelGenericMenuFeature",
    ],
  });
  
  const currentRunResults = [];

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
        benchmarks: benchmarks.map(b => ({ name: b.name, measurements: [] })),
        website: pkg.jsbenchmarks ? pkg.jsbenchmarks.website : pkg.website,
        version: version.replace(/^\^|~/, "")
      };

      const stats = await fetchStats(pkg.jsbenchmarks?.package);
      result.stars = stats.stars;
      result.downloads = stats.downloads;

      const implPath = `frameworks/${fw}/dist`;
      const sizes = await calculateSizes(`./${implPath}`);
      result.gzipBundle = sizes.gzip;
      result.rawBundle = sizes.raw;
      result.brotliBundle = sizes.brotli;

      const uri = `http://localhost:3000/${implPath}/`;
      const isKeyed = await checkKeyed(browser, uri);
      if (!isKeyed) {
        throw new Error(`${fw} behaves as NON-KEYED (should be KEYED)`);
      }

      console.log(`${fw} bundle: gzip ${Math.round(sizes.gzip / 100) / 10}KB, raw ${Math.round(sizes.raw / 100) / 10}KB, brotli ${Math.round(sizes.brotli / 100) / 10}KB`);
      currentRunResults.push(result);
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
            result.benchmarks[benchmarkIndex].measurements.push({ traceFile, memory });
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
            const resIdx = currentRunResults.findIndex(r => r.framework === fw);
            if (resIdx !== -1) currentRunResults.splice(resIdx, 1);
          }
        }
      }
    }
  }
  await browser.close();
  
  const benchmarkOrder = new Map(allBenchmarks.map((b, i) => [b.name, i]));

  function sortBenchmarksCanonical(a, b) {
    const aIdx = benchmarkOrder.has(a.name) ? benchmarkOrder.get(a.name) : Number.POSITIVE_INFINITY;
    const bIdx = benchmarkOrder.has(b.name) ? benchmarkOrder.get(b.name) : Number.POSITIVE_INFINITY;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  }

  for (const r of currentRunResults) {
    if (Array.isArray(r.benchmarks)) {
      r.benchmarks.sort(sortBenchmarksCanonical);
    }
  }

  fs.writeFileSync("results/raw-data.json", JSON.stringify(currentRunResults, null, 2));
  const duration = performance.now() - start;
  const minutes = Math.floor(duration / 1000 / 60);
  const seconds = Math.round(duration / 1000) % 60;
  console.log(`benchmark ran in ${minutes}m ${seconds}s`);
})();
