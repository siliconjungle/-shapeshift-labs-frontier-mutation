import assert from 'node:assert';
import { applyPatchImmutable } from '@shapeshift-labs/frontier';
import {
  canBatchMutationPlans,
  compileMutationPlan,
  captureMutationFrame,
  createActionRegistry,
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

{
  const actionState = {
    todos: [
      { id: 'a', text: 'Alpha', done: false },
      { id: 'b', text: 'Beta', done: true }
    ],
    audit: []
  };
  const engine = {
    get() {
      return actionState;
    },
    commitPatch(patch) {
      const next = applyPatchImmutable(actionState, patch);
      Object.keys(actionState).forEach((key) => delete actionState[key]);
      Object.assign(actionState, next);
    }
  };
  const logRecords = [];
  const events = [];
  const actions = createActionRegistry({
    state: engine,
    actor: 'local-user',
    logger: {
      info: (_message, record) => logRecords.push(record),
      error: (_message, record) => logRecords.push(record)
    },
    eventLog: { append: (event) => events.push(event) },
    now: (() => {
      let now = 1000;
      return () => now++;
    })()
  });
  actions.register({
    id: 'todo.toggle',
    input(value) {
      return {
        valid: value !== null && typeof value === 'object' && typeof value.id === 'string',
        issues: [{ path: '/id', message: 'id must be a string' }]
      };
    },
    reads: ['/todos/*/done'],
    writes: ['/todos/*/done'],
    affects: ['dom.binding:todo-row'],
    metadata: { feature: 'todos' },
    run(ctx, input) {
      const todo = ctx.query('/todos/*', { id: input.id });
      assert.ok(todo);
      ctx.commit([[0, ['todos', todo.index, 'done'], !todo.value.done]], {
        causeId: 'test:toggle',
        affected: ['view:openTodos']
      });
    }
  });
  actions.register({
    id: 'audit.add',
    input: {
      safeParse(value) {
        if (value !== null && typeof value === 'object' && typeof value.message === 'string') {
          return { success: true, data: { message: value.message } };
        }
        return { success: false, error: 'message must be a string' };
      }
    },
    writes: ['/audit'],
    run(ctx, input) {
      return ctx.plan().append('/audit', input.message);
    }
  });

  const dispatched = actions.dispatch('todo.toggle', { id: 'a' }, {
    causeId: 'click:todo-a',
    reads: ['/todos/0/id'],
    affected: ['dom.binding:todo-toggle']
  });
  assert.strictEqual(actionState.todos[0].done, true);
  assert.strictEqual(dispatched.record.actionId, 'todo.toggle');
  assert.strictEqual(dispatched.record.actor, 'local-user');
  assert.ok(dispatched.record.reads.some((path) => path.join('/') === 'todos/*/done'));
  assert.ok(dispatched.record.reads.some((path) => path.join('/') === 'todos/*'));
  assert.ok(dispatched.record.writes.some((path) => path.join('/') === 'todos/0/done'));
  assert.ok(dispatched.record.reads.some((path) => path.join('/') === 'todos/0/id'));
  assert.deepStrictEqual(dispatched.record.affected, ['dom.binding:todo-row', 'dom.binding:todo-toggle', 'view:openTodos']);

  assert.throws(
    () => actions.dispatch('todo.toggle', { id: 1 }),
    /mutation action input failed validation for todo\.toggle/
  );
  const failed = actions.history().at(-1);
  assert.strictEqual(failed.actionId, 'todo.toggle');
  assert.strictEqual(failed.status, 'error');
  assert.strictEqual(failed.patch.length, 0);

  actions.dispatch('audit.add', { message: 'toggled a' });
  assert.deepStrictEqual(actionState.audit, ['toggled a']);

  const scheduledTasks = [];
  const fakeScheduler = {
    schedule(task) {
      scheduledTasks.push(task);
      return task;
    },
    run() {
      while (scheduledTasks.length !== 0) scheduledTasks.shift().run();
    }
  };
  const scheduled = actions.schedule('audit.add', { message: 'queued action' }, {
    scheduler: fakeScheduler,
    autoRun: true,
    causeId: 'timer:audit',
    key: 'audit:add'
  });
  assert.strictEqual(scheduled.type, 'frontier.mutation.action');
  assert.strictEqual(scheduled.key, 'audit:add');
  assert.deepStrictEqual(actionState.audit, ['toggled a', 'queued action']);
  assert.strictEqual(actions.history().at(-1).metadata.scheduled, true);

  const direct = actions.commitPatch([[0, ['todos', 1, 'done'], false]], {
    actionId: 'external.patch',
    causeId: 'class:TodoService',
    reads: ['/todos/1/id'],
    affected: ['dom.binding:todo-row-b']
  });
  assert.strictEqual(actionState.todos[1].done, false);
  assert.strictEqual(direct.actionId, 'external.patch');
  assert.ok(direct.reads.some((path) => path.join('/') === 'todos/1/id'));
  assert.ok(direct.writes.some((path) => path.join('/') === 'todos/1/done'));

  const graph = actions.inspect();
  assert.ok(graph.actions.some((action) => action.id === 'todo.toggle'));
  assert.ok(graph.records.length >= 4);
  assert.ok(graph.edges.some((edge) => edge.kind === 'declares-write' && edge.from === 'action:todo.toggle'));
  assert.ok(graph.edges.some((edge) => edge.kind === 'runtime-write' && edge.to === 'path:["todos",0,"done"]'));
  assert.strictEqual(logRecords.length, 5);
  assert.strictEqual(events.length, 5);
}

console.log('frontier mutation smoke passed');
