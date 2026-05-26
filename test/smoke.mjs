import assert from 'node:assert';
import { applyPatchImmutable } from '@shapeshift-labs/frontier';
import {
  canBatchMutationPlans,
  compileMutationPlan,
  captureMutationFrame,
  createMutationPlan,
  createSelectorRegistry,
  evaluateMutationFrame,
  getMutationPlanAccess,
  mutationAccessesConflict,
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
const access = getMutationPlanAccess(plan);
assert.strictEqual(access.dynamic, true);
assert.ok(access.reads.some((entry) => entry.path.join('/') === 'entities/*/hp'));
assert.ok(access.writes.some((entry) => entry.path.join('/') === 'entities/*/hp'));
assert.ok(access.effects.some((entry) => entry.kind === 'selector'));
assert.strictEqual(
  mutationAccessesConflict(plan, createMutationPlan().set('/entities/0/hp', 1)),
  true
);
assert.strictEqual(
  canBatchMutationPlans([plan, createMutationPlan().set('/ui/theme', 'dark')]),
  true
);

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

{
  const transactionState = {
    profile: { stale: true, old: true },
    ui: {}
  };
  const transactionPlan = createMutationPlan()
    .transaction((tx) => {
      tx.remove('/profile/stale');
      tx.set('/ui/theme', 'dark');
      tx.set('/profile/name', 'Ada');
    });
  const transactionResult = compileMutationPlan(transactionPlan, transactionState);
  const transactionNext = applyPatchImmutable(transactionState, transactionResult.patch);
  assert.deepStrictEqual(transactionNext, {
    profile: { old: true, name: 'Ada' },
    ui: { theme: 'dark' }
  });
  const removeIndex = transactionResult.patch.findIndex((op) => op[0] === 1 && op[1].join('/') === 'profile/stale');
  const themeIndex = transactionResult.patch.findIndex((op) => op[1].join('/') === 'ui/theme');
  assert.ok(themeIndex !== -1 && removeIndex !== -1 && removeIndex > themeIndex);

  const overlappingDeletePlan = createMutationPlan()
    .transaction((tx) => {
      tx.remove('/profile/old');
      tx.set('/profile/old', 'Grace');
    });
  assert.deepStrictEqual(
    applyPatchImmutable(transactionState, compileMutationPlan(overlappingDeletePlan, transactionState).patch),
    { profile: { stale: true, old: 'Grace' }, ui: {} }
  );

  const immediateDeletePlan = createMutationPlan()
    .transaction((tx) => {
      tx.remove('/profile/stale');
      tx.set('/ui/theme', 'light');
    }, { deferDeletes: false });
  const immediateResult = compileMutationPlan(immediateDeletePlan, transactionState);
  const immediateRemoveIndex = immediateResult.patch.findIndex((op) => op[0] === 1 && op[1].join('/') === 'profile/stale');
  const immediateThemeIndex = immediateResult.patch.findIndex((op) => op[1].join('/') === 'ui/theme');
  assert.ok(immediateRemoveIndex !== -1 && immediateThemeIndex !== -1 && immediateRemoveIndex < immediateThemeIndex);
}

{
  const authoredState = { version: 1, title: 'draft', flags: { reviewed: false } };
  const framedPlan = createMutationPlan()
    .compareAndSet('/version', 1, 2)
    .set('/title', 'published');
  const frame = captureMutationFrame(authoredState, { plan: framedPlan, version: 'v1' });
  assert.deepStrictEqual(frame.paths.map((entry) => entry.path), [['version']]);

  const valid = evaluateMutationFrame(authoredState, frame, { version: 'v1' });
  assert.strictEqual(valid.ok, true);

  const compiled = compileMutationPlan(framedPlan, authoredState, { frame, frameVersion: 'v1' });
  assert.strictEqual(compiled.frame?.ok, true);

  const unrelated = evaluateMutationFrame({ ...authoredState, flags: { reviewed: true } }, frame, { version: 'v1' });
  assert.strictEqual(unrelated.ok, true);

  const stale = evaluateMutationFrame({ ...authoredState, version: 2 }, frame, { version: 'v1' });
  assert.strictEqual(stale.ok, false);
  assert.deepStrictEqual(stale.changedPaths, [['version']]);
  assert.throws(
    () => compileMutationPlan(framedPlan, { ...authoredState, version: 2 }, { frame, frameVersion: 'v1' }),
    /mutation frame validation failed/
  );

  const writeFrame = captureMutationFrame(authoredState, { plan: framedPlan, includeWrites: true });
  assert.strictEqual(evaluateMutationFrame({ ...authoredState, title: 'changed' }, writeFrame).ok, false);
}

console.log('frontier mutation smoke passed');
