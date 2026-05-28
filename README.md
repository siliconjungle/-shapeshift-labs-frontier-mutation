# Frontier Mutation

Explicit mutation and selector plans for Frontier.

This package keeps write intent above Frontier's concrete patch layer. A mutation plan can express operations such as increments, toggles, text/list appends, and selector-targeted row updates, then compile them into ordinary Frontier patches or safe CRDT operations.

- npm: [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation)
- source: [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- license: MIT

## Related Packages

The published Frontier package family is generated from one shared package catalog so READMEs stay in sync across packages:

- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): Core JSON diff/apply, compact patch tuples, JSON Pointer, equality, clone, validation, Unicode helpers.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): Shared query-key, selector path, condition, entity identity, and table-shape primitives.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): Patch serialization, binary frames, canonical JSON, and patch-history codecs.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): Stateful planned diff engine, adaptive profiles, schema plans, and engine-level history helpers.
- [`@shapeshift-labs/frontier-state`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state): Patch-routed app-state subscriptions, owned commits, maintained views, and path mapping.
- [`@shapeshift-labs/frontier-state-cache`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache): Normalized query-result cache with entity/query watchers, persistence, change logs, optimistic layers, and mutation bridge.
- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-schema`](https://www.npmjs.com/package/@shapeshift-labs/frontier-schema): JSON Schema validation, Frontier profile generation, CloudEvent envelopes, and query/table schema helpers.
- [`@shapeshift-labs/frontier-event-log`](https://www.npmjs.com/package/@shapeshift-labs/frontier-event-log): Bounded event logs, replay cursors, consumer acknowledgements, keyed compaction, checkpoints, and Frontier patch event records.
- [`@shapeshift-labs/frontier-logging`](https://www.npmjs.com/package/@shapeshift-labs/frontier-logging): Opt-in structured logging, browser telemetry, file sinks, exporters, benchmark traces, and Frontier patch/update summaries.
- [`@shapeshift-labs/frontier-crdt`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt): Native CRDT documents, update tooling, awareness, branches, conflict introspection, version frames, and undo.
- [`@shapeshift-labs/frontier-crdt-sync`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-sync): CRDT sync endpoints, repo/storage/provider contracts, document URLs, local networks, model checking, forensics, and text binding contracts.
- [`@shapeshift-labs/frontier-crdt-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-crdt-websocket): WebSocket client/server transports for Frontier CRDT sync providers.
- [`@shapeshift-labs/frontier-react`](https://www.npmjs.com/package/@shapeshift-labs/frontier-react): React external-store hooks and adapters for Frontier state, cache, and CRDT surfaces.
- [`@shapeshift-labs/frontier-richtext`](https://www.npmjs.com/package/@shapeshift-labs/frontier-richtext): Rich text Delta normalization/application, marks, embeds, ranges, and cursor/selection transforms for local editor integrations.
- [`@shapeshift-labs/frontier-realtime`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime): Shared realtime command, tick, snapshot, prediction, reconciliation, interpolation, rollback, message, and delta primitives.
- [`@shapeshift-labs/frontier-realtime-server`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-server): Authoritative realtime room, tick, command validation, rate-limit, session, and snapshot-history runtime.
- [`@shapeshift-labs/frontier-realtime-websocket`](https://www.npmjs.com/package/@shapeshift-labs/frontier-realtime-websocket): WebSocket client, wire, and Node room-server transport for Frontier realtime.
- [`@shapeshift-labs/frontier-game`](https://www.npmjs.com/package/@shapeshift-labs/frontier-game): Game-facing entity, component, player, room, ownership, spatial interest, rollback, physics, and replication helpers above realtime.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-state`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier-schema`](https://github.com/siliconjungle/-shapeshift-labs-frontier-schema)
- [`siliconjungle/-shapeshift-labs-frontier-event-log`](https://github.com/siliconjungle/-shapeshift-labs-frontier-event-log)
- [`siliconjungle/-shapeshift-labs-frontier-logging`](https://github.com/siliconjungle/-shapeshift-labs-frontier-logging)
- [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- [`siliconjungle/-shapeshift-labs-frontier-crdt`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-sync`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-sync)
- [`siliconjungle/-shapeshift-labs-frontier-crdt-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-crdt-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-react`](https://github.com/siliconjungle/-shapeshift-labs-frontier-react)
- [`siliconjungle/-shapeshift-labs-frontier-richtext`](https://github.com/siliconjungle/-shapeshift-labs-frontier-richtext)
- [`siliconjungle/-shapeshift-labs-frontier-realtime`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-server`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-server)
- [`siliconjungle/-shapeshift-labs-frontier-realtime-websocket`](https://github.com/siliconjungle/-shapeshift-labs-frontier-realtime-websocket)
- [`siliconjungle/-shapeshift-labs-frontier-game`](https://github.com/siliconjungle/-shapeshift-labs-frontier-game)

## Install

```sh
npm install @shapeshift-labs/frontier @shapeshift-labs/frontier-query @shapeshift-labs/frontier-mutation
```

## Usage

```js
import { createMutationPlan, select } from '@shapeshift-labs/frontier-mutation';

const enemies = select('/entities/*')
  .where('type', '==', 'enemy')
  .and('hp', '>', 0)
  .keyBy('id')
  .indexBy('id');

const plan = createMutationPlan()
  .forEach(enemies)
  .increment('hp', -5);

const result = plan.compilePatch(state);
```

The compiled patch contains concrete paths, indexes, and values. Queries are compile-time selectors, not replay-time patch semantics.

## API

```ts
import {
  canBatchMutationPlans,
  compileMutationPlan,
  commitCrdtMutation,
  commitMutation,
  captureMutationFrame,
  createActionRegistry,
  createMutationPlan,
  createSelectorRegistry,
  evaluateMutationFrame,
  getMutationPlanAccess,
  mutationAccessesConflict,
  select,
  type MutationCompileResult,
  type MutationFrameEvaluation,
  type MutationFrameReference,
  type MutationPlanAccess,
  type MutationPlannerDecision,
  type MutationPlanLike,
  type MutationActionRecord,
  type MutationStateEngine
} from '@shapeshift-labs/frontier-mutation';
```

Core exports:

- `select(path)` creates a selector builder for array/object-map rows.
- `createSelectorRegistry(initial?)` stores reusable named selectors.
- `createMutationPlan()` creates a fluent mutation plan.
- `compileMutationPlan(plan, state, options?)` compiles intent into a normal Frontier patch.
- `commitMutation(stateEngine, plan, options?)` compiles and commits to any state engine with `get()` and `commitPatch()`.
- `commitCrdtMutation(doc, plan, options?)` lowers safe intent to native CRDT operations when the document supports them.
- `createActionRegistry(options?)` registers callable actions, dispatches them from any host, commits their patches, and records provenance.
- `getMutationPlanAccess(plan)` exposes declared read/write/effect tuples without compiling against state.
- `mutationAccessesConflict(left, right)` and `canBatchMutationPlans(plans)` check whether declared access sets can safely batch.
- `captureMutationFrame(state, options?)` and `evaluateMutationFrame(state, frame, options?)` validate optimistic work against the authored state/version before compiling.

The public surface is intentionally small: build selectors, build a mutation plan, then compile or commit it. Planner choices, compiler passes, and CRDT lowering stay behind options and result metadata.

## Actions And Provenance

Use an action registry when mutations need to be callable from DOM events, service classes, game systems, tests, or AI tools while still leaving an inspectable state graph:

```js
import { createActionRegistry } from '@shapeshift-labs/frontier-mutation';

const actions = createActionRegistry({
  state,
  actor: 'local-user',
  logger,
  eventLog
});

const todoIdInput = (value) => ({
  valid: value && typeof value.id === 'string',
  issues: [{ path: '/id', message: 'id must be a string' }]
});

actions.register({
  id: 'todo.toggle',
  input: todoIdInput,
  reads: ['/todos/*/done'],
  writes: ['/todos/*/done'],
  affects: ['dom.binding:todo-row', 'view:openTodos'],
  run(ctx, input) {
    const todo = ctx.query('/todos/*', { id: input.id });
    if (!todo) return;
    ctx.commit([[0, ['todos', todo.index, 'done'], !todo.value.done]]);
  }
});

actions.dispatch('todo.toggle', { id: 'a' }, {
  causeId: 'click:todo-a',
  reads: ['/todos/0/id'],
  affected: ['dom.binding:b:toggle:action:click']
});

actions.schedule('todo.toggle', { id: 'a' }, {
  scheduler,
  lane: 'action',
  key: 'todo:a',
  causeId: 'timer:todo-a',
  autoRun: true
});
```

Every dispatch records the static declaration and the runtime mutation:

```js
const graph = actions.inspect();

graph.records.at(-1);
// {
//   actionId: 'todo.toggle',
//   causeId: 'click:todo-a',
//   actor: 'local-user',
//   reads: [['todos', '*', 'done'], ['todos', 0, 'id'], ['todos', '*']],
//   writes: [['todos', '*', 'done'], ['todos', 0, 'done']],
//   patch: [[0, ['todos', 0, 'done'], true]],
//   affected: ['dom.binding:todo-row', 'dom.binding:b:toggle:action:click', 'view:openTodos']
// }
```

`actions.schedule(...)` queues the same action through any structural scheduler with `schedule()`, and the eventual run still records provenance as a normal dispatch. `actions.commitPatch(patch, { actionId, causeId, reads, affected })` records unregistered/direct patch writes through the same graph. DOM and other adapters can pass origin `reads`, `writes`, and `affected` nodes when they assemble an action input outside the action body. Logging, scheduler, and event-log integration are structural: pass any object with `info()`, `schedule()`, or `append()` methods; the mutation package does not import logging, DOM, React, CRDT sync, scheduler, or event-log packages.

`input` is structural too. It accepts `frontier-schema` compiled validators, simple validation functions, or schema-like objects with `validate()`, `check()`, `parse()`, or `safeParse()`.

## Authored-State Frames

Mutation frames are bounded snapshots of the exact paths a plan read while it was authored. Use them for optimistic mutations, deferred validation, or UI work that should only compile if the fields it depended on are still unchanged:

```ts
const plan = createMutationPlan()
  .compareAndSet('/version', 1, 2)
  .set('/title', 'Published');

const frame = captureMutationFrame(stateAtAuthorTime, {
  plan,
  version: 'view-1'
});

const result = compileMutationPlan(plan, currentState, {
  frame,
  frameVersion: 'view-1'
});

console.log(result.frame?.ok);
```

By default, frames capture non-pattern declared reads. Pass explicit `paths`, `includeWrites: true`, or `maxPaths` when an optimistic workflow needs a wider or stricter frame.

## Selectors

Selectors support arrays, object maps, and multiple wildcard segments:

```js
const inNestedRooms = select('/rooms/*/entities/*')
  .where('type', '==', 'enemy')
  .keyBy('id');

const byMapKey = select('/entitiesById/*')
  .where('$key', 'in', ['e1', 'e2'])
  .keyBy('$key');
```

`$key` targets the current object-map key and `$index` targets the current array index. `keyBy(path)` controls the stable match key reported in `result.matches`; `indexBy(path)` is a compile-time hint for equality/in selectors on hot entity tables and object maps.

Selectors can also make the mutation target deterministic with ordering, limits, and projections:

```js
const strongestEnemy = select('/entities/*')
  .where('type', '==', 'enemy')
  .orderBy('hp', 'desc')
  .first()
  .project('id', 'hp')
  .keyBy('id');
```

`limit(n)` caps matched rows after ordering, `first()` is `limit(1)`, and `project(...)` adds a compact field projection to `result.matches` for diagnostics and agent-readable explanations.

Reusable selectors can be named and stored in a registry:

```js
import { createSelectorRegistry } from '@shapeshift-labs/frontier-mutation';

const selectors = createSelectorRegistry()
  .define('activeEnemies', enemies.named('activeEnemies'));

const plan = createMutationPlan()
  .forEach(selectors.get('activeEnemies'))
  .increment('hp', -5);
```

Selectors can also be scoped with a callback so later operations return to the previous selector:

```js
const plan = createMutationPlan()
  .forEach(enemies, (rows) => {
    rows.increment('hp', -5)
      .append('tags', 'damaged');
  })
  .increment('/turn', 1);
```

`compilePatch()` runs a small planner before it emits the patch. In `auto` mode it chooses between direct patch emission, row-field assignment, dirty-row/dirty-path diffing, and materialize-and-diff fallback based on the mutation shape and selector selectivity.

```js
const result = plan.compilePatch(state, {
  planner: {
    strategy: 'auto',
    schema: {
      tables: [{
        path: '/entities',
        key: 'id',
        stableRowShape: true,
        numericFields: ['hp', 'stats.score'],
        textFields: ['name', 'zoneId'],
        listFields: ['tags'],
        selectorFields: ['id', 'type', 'hp', 'zoneId']
      }]
    },
    dirtyDiffMinSelectivity: 0.75
  }
});

result.decisions;
// [{ strategy: 'row-field' | 'dirty-diff' | 'direct' | ... }]
```

Strategies can be forced for diagnostics or benchmarking with `direct`, `row-field`, `dirty-diff`, or `materialize-diff`.

Schema hints are trusted table/entity contracts and use the same shape as the `@shapeshift-labs/frontier-query` primitive layer. The key field becomes the default selector `keyBy`/`indexBy`, stable row shape lets the planner reuse selector matches across adjacent mutations that do not touch declared selector fields, and known numeric/text/list fields are reported in planner decisions for debugging and downstream specialization.

If you already use `createDiffEngine()` with schema, profile, or adaptive settings, pass it as `planner.diffEngine`. The planner will use that engine when it chooses a dirty diff or materialize-and-diff path.

## Mutation Operations

Plan methods include:

- object/value: `set`, `unset`, `remove`, `ensure`, `upsert`, `assign`, `rename`, `copy`, `move`
- numbers: `increment`, `decrement`, `multiply`, `min`, `max`, `clamp`
- booleans: `toggle`
- arrays/lists: `append`, `prepend`, `splice`, `insert`, `removeAt`, `moveItem`, `addToSet`, `pull`, `removeWhere`
- text: `appendText`, `insertText`, `deleteText`, `replaceText`, `spliceText`, `formatText`
- guards: `test`, `compareAndSet`
- control: `forEach`, `where`, `clearSelector`, `transaction`, `repeat`, `explain`

The detailed cross-planner contract lives in [`docs/mutation-semantics.md`](../../docs/mutation-semantics.md).

### Semantics Matrix

| Family | Methods | Patch semantics | CRDT semantics | Stability |
| --- | --- | --- | --- | --- |
| Replace/merge | `set`, `assign`, `upsert` | Emits `OP_SET` or `OP_ASSIGN` when direct. `upsert` merges object targets and replaces non-objects. | Map-field native when conflict-preserving assignment is safe, otherwise materialized set. | Known |
| Delete | `unset`, `remove` | Object fields emit `OP_REMOVE`; array indexes emit `OP_ARRAY_SPLICE`. Root removal is rejected. | Native CRDT tombstone when possible, otherwise materialized delete. | Known |
| Ensure/guards | `ensure`, `test`, `compareAndSet` | `ensure` is no-op when present. `test` emits no patch. `compareAndSet` throws on mismatch before emitting. | Same compile-time guard behavior; matching writes materialize or lower normally. | Known |
| Numbers | `increment`, `decrement`, `multiply`, `min`, `max`, `clamp` | Arithmetic compacts to `OP_SET`; adjacent increments/decrements fold. | Increments/decrements can use native counters; other numeric transforms materialize. | Known |
| Lists | `append`, `prepend`, `splice`, `insert`, `removeAt`, `moveItem` | Uses `OP_APPEND`, `OP_ARRAY_SPLICE`, or `OP_ARRAY_MOVE` when direct. `moveItem` target is the post-removal index. | Native list insert/delete/move when the path has list backing; otherwise materialized set. | Known |
| Set-like lists | `addToSet`, `pull`, `removeWhere` | `addToSet` can append new values; `pull` and `removeWhere` materialize the filtered list. | Materialized unless expressible as native list edits later. `removeWhere` is compile-time only. | Known compile-time |
| Text | `appendText`, `insertText`, `deleteText`, `replaceText`, `spliceText` | Uses `OP_STRING_SPLICE` for string targets; non-strings become materialized strings. | Native text insert/splice when the path has text backing and code-unit safety holds. | Known |
| Rich text | `formatText` | Materializes a `{ text, spans }`-style value with appended span metadata. | Materialized today; richer CRDT-richtext lowering is a future boundary. | Known JSON shape |
| Path moves | `copy`, `move`, `rename` | Emits target `OP_SET` plus source remove, or `OP_ARRAY_MOVE` for same-array moves. Dirty diff tracks source and target paths. | Materialized through set/delete today. | Known |
| Selectors | `where`, `orderBy`, `limit`, `first`, `project`, `keyBy`, `indexBy` | Resolved at compile time; projected fields appear in `result.matches`. | Same compile-time row resolution before CRDT lowering. | Known |
| Diagnostics | `transaction`, `explain`, `access` | Transaction metadata is attached to operation metadata; whole-path `remove`/`unset` ops are deferred to the transaction boundary unless an overlapping op must observe them first. `explain()` returns operations, patch count, matches, decisions, and declared access tuples. | CRDT decision metadata includes operation and transaction summaries; deferred removes still lower to native tombstone deletes where eligible. | Known diagnostic |

Examples:

```js
const plan = createMutationPlan()
  .ensure('/session', { started: true })
  .upsert('/profile', { level: 3 })
  .compareAndSet('/version', 1, 2)
  .insert('/items', 0, { id: 'first' })
  .addToSet('/tags', ['new', 'seen'])
  .replaceText('/title', 0, 5, 'Draft')
  .transaction((tx) => {
    tx.rename('/profile/name', 'label');
    tx.remove('/profile/stale');
  }, { origin: 'agent-edit' });

const explanation = plan.explain(state);
```

`test(path, expected)` and `compareAndSet(path, expected, next)` are compile-time guards. If the current state does not match `expected`, compilation throws before a patch or CRDT update is emitted.

Compiled results include:

- `patch`: the Frontier patch to apply or send
- `matched`: weighted selector matches
- `lowered`: lowering notes for diagnostics
- `dirtyPaths` / `dirtyRows`: locality passed to diff planning
- `matches`: selector matches with resolved paths
- `decisions`: planner choices and reasons
- `access` on `plan.explain(...)`: declared reads, writes, and effects for conflict detection, optimistic safety, and future scheduling

Adjacent arithmetic and repeated calls are folded where Frontier can represent the result compactly:

```js
const plan = createMutationPlan()
  .increment('/count', 5)
  .repeat(10);

plan.compilePatch({ count: 0 }).patch;
// [[OP_SET, ['count'], 50]]
```

The compiler also folds adjacent compatible operations before lowering:

- arithmetic runs such as `+1, +2, -1` become one `+2`
- repeated list appends and text appends become one append operation
- statically empty repeats and even toggle repeats are removed
- selector operations can merge only when the mutation cannot affect selector membership

Selector row-field batching still checks the resolved row set at compile time. If a selector-targeted mutation changes which rows match the next operation, the compiler leaves a barrier and emits separate row-field frontiers.

State engines and CRDT documents can be committed directly:

```js
import { commitCrdtMutation, commitMutation } from '@shapeshift-labs/frontier-mutation';

commitMutation(stateEngine, plan);
plan.commit(stateEngine);

commitCrdtMutation(doc, plan, {
  planner: {
    crdt: 'auto',
    crdtAssignmentPolicy: 'preserve-conflicts',
    crdtMetadata: { source: 'combat-system' }
  }
});
plan.commitCrdt(doc);
```

Normalized query caches can use the optional bridge from `@shapeshift-labs/frontier-state-cache/mutation`:

```js
import { commitCacheQueryMutation } from '@shapeshift-labs/frontier-state-cache/mutation';

commitCacheQueryMutation(cache, ['todos', { status: 'open' }], plan);
```

CRDT commits lower intent to native operations when that is semantically safe:

- arithmetic becomes native counters
- list appends, inserts, removes, moves, and splices become native list operations
- text appends, inserts, deletes, replaces, and safe text splices become native text operations
- object field updates can become map field assignments instead of whole-object replacement
- deletes can become native CRDT tombstones

`crdtAssignmentPolicy` controls assignment lowering. `preserve-conflicts` keeps object updates at field granularity so concurrent same-field register conflicts remain inspectable and resolvable. `last-write-wins` and `materialize` keep the older whole-value materialization behavior for assignment-shaped operations.

`crdtMetadata` is passed through Frontier's durable CRDT update metadata. The returned `crdtDecisions` list also includes per-operation debug metadata with the chosen strategy, reason, path, repeat count, and operation size summary.

## Subpath Imports

This package currently exposes the root entry point only:

```ts
import { createMutationPlan, select } from '@shapeshift-labs/frontier-mutation';
```

## Package Scope

This package owns explicit mutation and selector intent:

- selector builders and selector registries,
- mutation plans and compile-time guards,
- planner decisions for direct, row-field, dirty-diff, and materialized strategies,
- structural state-engine and CRDT commit adapters.

It does not own app-state subscriptions, normalized query caches, CRDT document storage, sync providers, patch codecs, or core diff/apply primitives.

## TypeScript

The package ships ESM JavaScript plus `.d.ts` declarations for the root export. The package-local TypeScript source lives in `src/` and compiles directly to `dist/`.

## Validation

```sh
npm test
npm run fuzz
npm run bench
npm run pack:dry
```

## Benchmarks

Run the package-local benchmark:

```sh
npm run bench
```

Latest local package benchmark on Node v26.1.0, darwin arm64, 15 rounds:

| Fixture | Compile median | Apply median |
| --- | ---: | ---: |
| 1% sparse selector update | 2.57 ms | 3.85 us |
| Indexed id `in` selector update | 1.94 ms | 4.06 us |
| 10% dense selector update | 3.18 ms | 17.59 us |
| Repeated arithmetic fold, 1000x | 0.61 us | 0.05 us |
| Transaction defer deletes, 64 fields | 78.76 us | 8.76 us |
| Frame validate, 32 watched paths | 0.86 us | 0.00 us |
| Repeated text append fold, 1000x | 0.85 us | 0.09 us |

These are Frontier-only package measurements, not competitor comparisons.

## License

MIT. See [LICENSE](./LICENSE).
