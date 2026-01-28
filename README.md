# JS Benchmarks

Experimental JavaScript framework benchmark.

## Introduction

This project acts as a benchmarking tool for various JavaScript frameworks. It is heavily inspired by [krausest/js-framework-benchmark](https://github.com/krausest/js-framework-benchmark).

<img width="2370" height="1172" alt="image" src="https://github.com/user-attachments/assets/8454ef37-e86f-44cc-afd4-84cbef78cb3f" />

## Goals

- **Benchmark common patterns**: Focus on varied and representative list reconciliation patterns found in real-world applications.
- **Maintainable scope**: Limit the number of implementations to a reasonable set. This facilitates easier exploration of results and allows the benchmark suite to evolve without the burden of updating a vast number of implementations.

## Implementation Requirements

- **Framework Selection**: Implementations must use frameworks that are either highly popular or notably efficient. (Specific metrics TBD).
- **Maintenance**: Frameworks must be actively maintained. (Specific criteria TBD).
- **Single Submission**: Only one submission per framework is allowed. Exceptions may be granted for major version changes or significant features in beta.
- **Component Structure**: Table rows must be implemented as a separate component. This ensures the benchmark correctly measures the efficiency of the framework's component abstraction.
- **Idiomatic Code**: Implementations must follow idiomatic patterns. "Cheating" techniques such as manual DOM manipulation or manual event delegation are prohibited, with the sole exception of the Vanilla JS implementation.

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

## Contributing

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
