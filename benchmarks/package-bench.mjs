import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { applyPatchImmutable } from '@shapeshift-labs/frontier';
import {
  createMutationPlan,
  select
} from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const args = parseArgs(process.argv.slice(2));
const rounds = readPositiveInt(args.rounds, 9);
const outPath = args.out ? path.resolve(rootDir, args.out) : null;

let sink = 0;

const rows = [
  runSelectorFixture(makeSparseSelectorFixture()),
  runSelectorFixture(makeIndexedIdFixture()),
  runSelectorFixture(makeDenseSelectorFixture()),
  runDirectFixture(makeRepeatedArithmeticFixture()),
  runDirectFixture(makeRepeatedTextFixture())
];

const report = {
  package: '@shapeshift-labs/frontier-mutation',
  version: readPackageVersion(),
  generatedAt: new Date().toISOString(),
  node: process.version,
  platform: process.platform + ' ' + process.arch,
  rounds,
  rows
};

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
}

printReport(report);
if (sink === 42) console.log('sink=' + sink);

function runSelectorFixture(fixture) {
  const result = fixture.plan.compilePatch(fixture.state, fixture.options);
  assert.strictEqual(result.matched, fixture.expectedMatches);
  const next = applyPatchImmutable(fixture.state, result.patch);
  assert.ok(next);
  const compileTiming = measure(() => {
    const compiled = fixture.plan.compilePatch(fixture.state, fixture.options);
    sink += compiled.patch.length + compiled.matched;
  }, fixture.compileInner || 20);
  const applyTiming = measure(() => {
    const applied = applyPatchImmutable(fixture.state, result.patch);
    sink += applied.rows.length;
  }, fixture.applyInner || 1000);
  return {
    fixture: fixture.name,
    matches: result.matched,
    strategy: result.decisions[0]?.strategy || 'unknown',
    patchOps: result.patch.length,
    jsonPatchBytes: Buffer.byteLength(JSON.stringify(result.patch)),
    compileMedianUs: round(compileTiming.median),
    compileP95Us: round(compileTiming.p95),
    applyMedianUs: round(applyTiming.median),
    applyP95Us: round(applyTiming.p95)
  };
}

function runDirectFixture(fixture) {
  const result = fixture.plan.compilePatch(fixture.state, fixture.options);
  const next = applyPatchImmutable(fixture.state, result.patch);
  assert.ok(next);
  const compileTiming = measure(() => {
    const compiled = fixture.plan.compilePatch(fixture.state, fixture.options);
    sink += compiled.patch.length;
  }, fixture.compileInner || 5000);
  const applyTiming = measure(() => {
    const applied = applyPatchImmutable(fixture.state, result.patch);
    sink += Object.keys(applied || {}).length;
  }, fixture.applyInner || 10000);
  return {
    fixture: fixture.name,
    matches: result.matched,
    strategy: result.decisions[0]?.strategy || 'direct',
    patchOps: result.patch.length,
    jsonPatchBytes: Buffer.byteLength(JSON.stringify(result.patch)),
    compileMedianUs: round(compileTiming.median),
    compileP95Us: round(compileTiming.p95),
    applyMedianUs: round(applyTiming.median),
    applyP95Us: round(applyTiming.p95)
  };
}

function makeSparseSelectorFixture() {
  const state = { rows: makeRows(10000) };
  const selector = select('/rows/*')
    .where('bucket100', 'eq', 0)
    .keyBy('id')
    .indexBy('id');
  return {
    name: 'Selector increment, 1% sparse 10k-row table',
    state,
    plan: createMutationPlan().forEach(selector).increment('score', 1),
    options: mutationOptions(),
    expectedMatches: 100,
    compileInner: 10,
    applyInner: 1000
  };
}

function makeIndexedIdFixture() {
  const state = { rows: makeRows(10000) };
  const ids = new Array(100);
  for (let i = 0; i < ids.length; i++) ids[i] = 'row-' + (i * 97);
  const selector = select('/rows/*')
    .where('id', 'in', ids)
    .keyBy('id')
    .indexBy('id');
  return {
    name: 'Selector increment, indexed id IN',
    state,
    plan: createMutationPlan().forEach(selector).increment('score', 1),
    options: mutationOptions(),
    expectedMatches: 100,
    compileInner: 10,
    applyInner: 1000
  };
}

function makeDenseSelectorFixture() {
  const state = { rows: makeRows(10000) };
  const selector = select('/rows/*')
    .where('bucket10', 'eq', 0)
    .keyBy('id')
    .indexBy('id');
  return {
    name: 'Selector increment, 10% 10k-row table',
    state,
    plan: createMutationPlan().forEach(selector).increment('score', 1),
    options: mutationOptions(),
    expectedMatches: 1000,
    compileInner: 8,
    applyInner: 1000
  };
}

function makeRepeatedArithmeticFixture() {
  return {
    name: 'Repeated arithmetic fold, 1000x',
    state: { count: 0 },
    plan: createMutationPlan().increment('/count', 1).repeat(1000),
    options: { compact: true, strategy: 'auto' },
    compileInner: 5000,
    applyInner: 10000
  };
}

function makeRepeatedTextFixture() {
  return {
    name: 'Repeated text append fold, 1000x',
    state: { body: '' },
    plan: createMutationPlan().appendText('/body', 'x').repeat(1000),
    options: { compact: true, strategy: 'auto' },
    compileInner: 3000,
    applyInner: 10000
  };
}

function mutationOptions() {
  return {
    compact: true,
    strategy: 'auto',
    planner: {
      schema: {
        tables: [{
          path: '/rows',
          key: 'id',
          stableRowShape: true,
          numericFields: ['score', 'bucket10', 'bucket100'],
          selectorFields: ['id', 'bucket10', 'bucket100']
        }]
      }
    }
  };
}

function makeRows(count) {
  const rows = new Array(count);
  for (let i = 0; i < count; i++) {
    rows[i] = {
      id: 'row-' + i,
      score: i,
      bucket10: i % 10,
      bucket100: i % 100,
      label: 'row ' + i
    };
  }
  return rows;
}

function measure(fn, inner) {
  for (let i = 0; i < inner; i++) fn();
  const samples = new Array(rounds);
  for (let roundIndex = 0; roundIndex < rounds; roundIndex++) {
    const start = performance.now();
    for (let i = 0; i < inner; i++) fn();
    samples[roundIndex] = ((performance.now() - start) * 1000) / inner;
  }
  samples.sort((left, right) => left - right);
  return {
    median: percentile(samples, 0.5),
    p95: percentile(samples, 0.95)
  };
}

function printReport(report) {
  console.log('@shapeshift-labs/frontier-mutation package benchmark');
  console.log('Node ' + report.node + ' on ' + report.platform + ', rounds=' + rounds);
  console.log('These are Frontier-only package measurements, not competitor comparisons.');
  console.log('');
  console.log(padRight('Fixture', 43) + padLeft('Matches', 9) + padLeft('Strategy', 12) + padLeft('Patch', 8) + padLeft('Bytes', 9) + padLeft('Compile', 12) + padLeft('C p95', 11) + padLeft('Apply', 11));
  for (const row of report.rows) {
    console.log(
      padRight(row.fixture, 43) +
      padLeft(String(row.matches), 9) +
      padLeft(row.strategy, 12) +
      padLeft(String(row.patchOps), 8) +
      padLeft(formatBytes(row.jsonPatchBytes), 9) +
      padLeft(formatUs(row.compileMedianUs), 12) +
      padLeft(formatUs(row.compileP95Us), 11) +
      padLeft(formatUs(row.applyMedianUs), 11)
    );
  }
  if (outPath) console.log('\nwrote ' + path.relative(rootDir, outPath));
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).version;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--rounds') out.rounds = argv[++i];
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run bench -- [--rounds 9] [--out benchmarks/results/frontier-mutation-package-bench.json]');
      process.exit(0);
    } else {
      throw new Error('unknown argument: ' + arg);
    }
  }
  return out;
}

function readPositiveInt(value, fallback) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error('expected positive integer, got ' + value);
  return number;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function formatUs(value) {
  return value >= 1000 ? (value / 1000).toFixed(2) + ' ms' : value.toFixed(2) + ' us';
}

function formatBytes(value) {
  return value < 1024 ? value + ' B' : (value / 1024).toFixed(1) + ' KiB';
}

function padRight(value, width) {
  return String(value).padEnd(width);
}

function padLeft(value, width) {
  return String(value).padStart(width);
}
