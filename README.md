# JS Benchmarks

Experimental JavaScript framework benchmark.

## Description
This project acts as a benchmarking tool for various JavaScript frameworks.

<img width="2370" height="1172" alt="image" src="https://github.com/user-attachments/assets/8454ef37-e86f-44cc-afd4-84cbef78cb3f" />

## Running Benchmarks Locally

1. Install dependencies:

```bash
npm i
```

2. Start the static server (leave this running):

```bash
npm run serve
```

3. In another terminal, run the benchmarks (requires the server):

```bash
npm run bench
```

Notes:

- The benchmark runner loads each framework from `http://localhost:3000/frameworks/<framework>/dist/`, so each framework must be built before benchmarking.

## Running Results UI

To view the benchmark results in a graphical interface:

```bash
cd results
npm i
npm run dev
```

## Benchmark CLI Flags

`npm run bench` runs `node benchmark/start.js`.

- `--frameworks` / `-f`: Comma-separated list of frameworks (directory names under `frameworks/`). Default: all frameworks.
- `--benchmarks` / `-b`: Comma-separated list of benchmarks to run. Default: all benchmarks.
- `--help` / `-h`: Show help.

Examples:

```bash
npm run bench -- -f react,vue
npm run bench -- -b create,select,clear
```

## Submission Requirements

For each framework submission under `frameworks/<name>/`:

- Must include `npm run build`.
- `npm run build` must output the production build to a directory named `dist`.
- `package.json` must include `jsbenchmarks` metadata.

Example `frameworks/<name>/package.json`:

```json
{
  "name": "my-framework",
  "jsbenchmarks": {
    "website": "https://example.com",
    "package": "my-framework"
  },
  "scripts": {
    "build": "..."
  }
}
```
