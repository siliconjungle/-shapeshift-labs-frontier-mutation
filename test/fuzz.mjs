import assert from 'node:assert';
import { applyPatchImmutable, cloneJson, equalsJson } from '@shapeshift-labs/frontier';
import { createMutationPlan, select } from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
const cases = readPositiveInt(args.cases, 400);
let seed = readUint(args.seed, 0x4d757441);
const initialSeed = seed;

for (let id = 0; id < cases; id++) runCase(id);

console.log(`frontier mutation fuzz passed cases=${cases} seed=${initialSeed}`);

function runCase(id) {
  const state = makeState(id);
  const expected = cloneJson(state);
  const plan = createMutationPlan();

  const countDelta = randomInt(9) - 4;
  plan.increment('/count', countDelta);
  expected.count += countDelta;

  if (randomBool()) {
    plan.toggle('/enabled');
    expected.enabled = !expected.enabled;
  }

  const bodyInsert = 'x' + randomInt(100);
  const bodyIndex = randomInt(expected.body.length + 1);
  plan.insertText('/body', bodyIndex, bodyInsert);
  expected.body = expected.body.slice(0, bodyIndex) + bodyInsert + expected.body.slice(bodyIndex);

  const itemValue = { id: 'new-' + id, value: randomInt(50) };
  plan.append('/items', itemValue);
  expected.items.push(cloneJson(itemValue));

  const selectedType = randomBool() ? 'enemy' : 'friend';
  const hpFloor = randomInt(10) - 2;
  const rowDelta = 1 + randomInt(5);
  const selector = select('/entities/*')
    .where('type', '==', selectedType)
    .and('hp', '>', hpFloor)
    .keyBy('id')
    .indexBy('id');
  plan.forEach(selector, (rows) => {
    rows.increment('hp', rowDelta).append('tags', 'hit-' + id);
  });
  for (const entity of expected.entities) {
    if (entity.type === selectedType && entity.hp > hpFloor) {
      entity.hp += rowDelta;
      entity.tags.push('hit-' + id);
    }
  }

  const strategies = ['auto', 'direct', 'row-field', 'dirty-diff', 'materialize-diff'];
  for (const strategy of strategies) {
    const result = plan.compilePatch(cloneJson(state), {
      planner: {
        strategy,
        schema: {
          tables: [{
            path: '/entities',
            key: 'id',
            stableRowShape: true,
            numericFields: ['hp'],
            listFields: ['tags'],
            selectorFields: ['id', 'type', 'hp']
          }]
        }
      }
    });
    const actual = applyPatchImmutable(cloneJson(state), result.patch);
    assert.ok(equalsJson(actual, expected), `case ${id} strategy ${strategy} diverged`);
  }
}

function makeState(id) {
  const entities = [];
  const count = 4 + randomInt(8);
  for (let i = 0; i < count; i++) {
    entities.push({
      id: `e-${id}-${i}`,
      type: randomBool() ? 'enemy' : 'friend',
      hp: randomInt(20) - 4,
      tags: randomBool() ? ['seed'] : []
    });
  }
  return {
    count: randomInt(20) - 10,
    enabled: randomBool(),
    body: 'body-' + id,
    items: [id, 'seed'],
    entities
  };
}

function randomBool() {
  return (nextRandom() & 1) === 1;
}

function randomInt(max) {
  return max <= 1 ? 0 : nextRandom() % max;
}

function nextRandom() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cases') out.cases = argv[++i];
    else if (arg === '--seed') out.seed = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node test/fuzz.mjs [--cases 400] [--seed 1299547201]');
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

function readUint(value, fallback) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number)) throw new Error('expected integer seed, got ' + value);
  return number >>> 0;
}
