import assert from 'node:assert';
import { applyPatchImmutable } from '@shapeshift-labs/frontier';
import {
  compileMutationPlan,
  createMutationPlan,
  createSelectorRegistry,
  select
} from '../dist/index.js';

const state = {
  turn: 1,
  log: [],
  entities: [
    { id: 'e1', type: 'enemy', hp: 10, tags: [] },
    { id: 'e2', type: 'friend', hp: 12, tags: [] },
    { id: 'e3', type: 'enemy', hp: 0, tags: [] }
  ]
};

const activeEnemies = select('/entities/*')
  .where('type', '==', 'enemy')
  .and('hp', '>', 0)
  .keyBy('id')
  .indexBy('id');

const registry = createSelectorRegistry()
  .define('activeEnemies', activeEnemies.named('activeEnemies'));

const plan = createMutationPlan()
  .forEach(registry.get('activeEnemies'), (rows) => {
    rows.increment('hp', -5)
      .append('tags', 'damaged');
  })
  .increment('/turn', 1)
  .append('/log', 'hit');

const result = compileMutationPlan(plan, state, {
  planner: {
    strategy: 'auto',
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

assert.strictEqual(result.matched, 2);
assert.ok(result.patch.length > 0);
assert.ok(result.decisions.length >= 3);

const next = applyPatchImmutable(state, result.patch);
assert.deepStrictEqual(next, {
  turn: 2,
  log: ['hit'],
  entities: [
    { id: 'e1', type: 'enemy', hp: 5, tags: ['damaged'] },
    { id: 'e2', type: 'friend', hp: 12, tags: [] },
    { id: 'e3', type: 'enemy', hp: 0, tags: [] }
  ]
});

console.log('frontier mutation smoke passed');
