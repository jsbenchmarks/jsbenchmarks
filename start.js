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

async function waitForTwoRafs(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  );
}

function resolveNth(selector, j) {
  if (j === undefined) return selector;
  return selector.replace(/__nth__/g, `${j + 1}`);
}

async function installBenchStartListener(page) {
  await page.evaluate(() => {
    window.__bench = {
      tStart: 0,
      tDone: 0,
      tEnd: 0,
      _scheduled: false,
      _doneSrc: "",
      _doneFn: null,
    };

    const bench = window.__bench;
    function handler(e) {
      try {
        if (bench.tStart) return;
        bench.tStart = performance.now();
        document.removeEventListener("click", handler, true);
      } catch {
        // Ignore unexpected event/DOM errors.
      }
    }

    document.addEventListener("click", handler, true);
  });
}

async function waitForPaintAfterDone(page, done, j) {
  const doneSelector = typeof done === "string" ? done : null;
  const doneSrc = typeof done === "function" ? done.toString() : "";

  await page.waitForFunction(
    (selector, src, arg) => {
      const bench = window.__bench;
      if (!bench) return false;
      if (bench.tEnd) return true;

      let ok = false;
      if (selector) {
        ok = !!document.querySelector(selector);
      } else {
        if (bench._doneSrc !== src) {
          bench._doneSrc = src;
          bench._doneFn = null;
        }
        if (!bench._doneFn) {
          // eslint-disable-next-line no-eval
          bench._doneFn = (0, eval)(`(${src})`);
        }
        ok = !!bench._doneFn(arg);
      }

      if (ok && !bench._scheduled) {
        bench._scheduled = true;
        bench.tDone = bench.tDone || performance.now();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            bench.tEnd = performance.now();
          })
        );
      }

      return !!bench.tEnd;
    },
    { polling: "raf" },
    doneSelector,
    doneSrc,
    j
  );
}

async function executeMeasured(page, tasks, j) {
  if (!tasks.length) {
    return 0;
  }

  const resolvedTasks = tasks.map((t) => ({
    click: resolveNth(t.click, j),
    done: typeof t.done === "string" ? resolveNth(t.done, j) : t.done,
  }));

  await installBenchStartListener(page);

  for (let i = 0; i < resolvedTasks.length; i++) {
    const task = resolvedTasks[i];
    await page.click(task.click);

    const isLast = i === resolvedTasks.length - 1;
    if (!isLast) {
      if (typeof task.done === "string") {
        await page.waitForSelector(task.done);
      } else {
        await page.waitForFunction(task.done, {}, j);
      }
      continue;
    }

    await waitForPaintAfterDone(page, task.done, j);
  }

  const duration = await page.evaluate(() => {
    const bench = window.__bench;
    if (!bench || !bench.tStart || !bench.tEnd) return 0;
    return bench.tEnd - bench.tStart;
  });

  return duration;
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

  let existingResults = [];
  try {
    if (fs.existsSync("results/src/data.ts")) {
      const dataContent = await fs.promises.readFile("results/src/data.ts", "utf8");
      const startIndex = dataContent.indexOf('[');
      const endIndex = dataContent.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1) {
        existingResults = JSON.parse(dataContent.substring(startIndex, endIndex + 1));
      }
    }
  } catch (e) {
    console.error("Failed to read existing results, starting fresh.", e);
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
      "--disable-extensions",
      "--disable-features=Translate,PrivacySandboxSettings4,IPH_SidePanelGenericMenuFeature",
    ],
  });
  
  const currentRunResults = [];
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
        benchmarks: [], 
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
      if (!argv.skipBenchmarks) {
        for (let i = 0; i < benchmarks.length; i++) {
          const benchmark = benchmarks[i];
          const benchmarkResult = {
            name: benchmark.name,
            measurements: [],
          };
          result.benchmarks.push(benchmarkResult);
          for (let i = 0; i < (argv.runs || benchmark.runs); i++) {
           const page = await browser.newPage();
            page.setDefaultTimeout(5000);
            await page.setViewport({ width: 1200, height: 800 });
            await page.goto(uri, { waitUntil: "load" });
            await page.waitForSelector("main");
            await execute(page, benchmark.setup);
            for (let j = 0; j < 5; j++) {
              await execute(page, benchmark.warmup, j);
            }
            await page.click("#clear");
            await page.waitForFunction(() => document.querySelectorAll("tbody tr").length === 0);
            await waitForTwoRafs(page);
            await execute(page, benchmark.setup);
            await page.evaluate(() => window.gc());
            await new Promise(r => setTimeout(r, 100));
            const duration = await executeMeasured(page, benchmark.measure);
            await page.evaluate(() => window.gc());
            await new Promise(r => setTimeout(r, 100));
            const memory = await page.evaluate(() => performance.memory.usedJSHeapSize);
            benchmarkResult.measurements.push({ duration, memory });
            console.log(`${fw} ${benchmark.name}:`, { duration: Math.round(duration), memory: (memory / 1024 / 1024).toFixed(1) + "MB" });
            await page.close();
          }
        }
      }
    } catch (e) {
      console.error(`Failed to benchmark ${fw}:`, e);
      const idx = currentRunResults.findIndex(r => r.framework === fw);
      if (idx !== -1) {
        currentRunResults.splice(idx, 1);
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

  function mergeFrameworkResults(existing, current) {
    if (!existing) return current;

    const bmMap = new Map();
    for (const bm of existing.benchmarks ?? []) bmMap.set(bm.name, bm);
    for (const bm of current.benchmarks ?? []) bmMap.set(bm.name, bm);

    const mergedBenchmarks = Array.from(bmMap.values()).sort(sortBenchmarksCanonical);

    return {
      ...existing,
      ...current,
      website: current.website ?? existing.website,
      version: current.version ?? existing.version,
      rawBundle: current.rawBundle ?? existing.rawBundle,
      gzipBundle: current.gzipBundle ?? existing.gzipBundle,
      brotliBundle: current.brotliBundle ?? existing.brotliBundle,
      stars: current.stars || existing.stars,
      downloads: current.downloads || existing.downloads,
      benchmarks: mergedBenchmarks,
    };
  }

  const resultMap = new Map(existingResults.map(r => [r.framework, r]));
  for (const r of currentRunResults) {
    resultMap.set(r.framework, mergeFrameworkResults(resultMap.get(r.framework), r));
  }
  const results = Array.from(resultMap.values());

  fs.writeFileSync("results/src/data.ts", `export const results = ${JSON.stringify(results)};`);
  const duration = performance.now() - start;
  const minutes = Math.floor(duration / 1000 / 60);
  const seconds = Math.round(duration / 1000) % 60;
  console.log(`benchmark ran in ${minutes}m ${seconds}s`);
})();
