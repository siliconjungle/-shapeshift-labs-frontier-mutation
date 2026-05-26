# Frontier Mutation

Explicit mutation and selector plans for Frontier.

This package keeps write intent above Frontier's concrete patch layer. A mutation plan can express operations such as increments, toggles, text/list appends, and selector-targeted row updates, then compile them into ordinary Frontier patches or safe CRDT operations.

- npm: [`@shapeshift-labs/frontier-mutation`](https://www.npmjs.com/package/@shapeshift-labs/frontier-mutation)
- source: [`siliconjungle/-shapeshift-labs-frontier-mutation`](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)
- license: MIT

## Related Packages

- [`@shapeshift-labs/frontier-state-cache-idb`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-idb): IndexedDB persistence adapter for Frontier state-cache snapshots.
- [`@shapeshift-labs/frontier-state-cache-file`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-file): Structured file persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier-state-cache-sql`](https://www.npmjs.com/package/@shapeshift-labs/frontier-state-cache-sql): SQL persistence adapter for Frontier state-cache snapshots and change logs.
- [`@shapeshift-labs/frontier`](https://www.npmjs.com/package/@shapeshift-labs/frontier): core JSON diff/apply primitives used by compiled mutation patches.
- [`@shapeshift-labs/frontier-query`](https://www.npmjs.com/package/@shapeshift-labs/frontier-query): shared query-key, selector path, condition, identity, and table-schema primitives used by mutation selectors.
- [`@shapeshift-labs/frontier-engine`](https://www.npmjs.com/package/@shapeshift-labs/frontier-engine): planned diff engine for profiled dirty-diff and materialize-diff strategies.
- [`@shapeshift-labs/frontier-codec`](https://www.npmjs.com/package/@shapeshift-labs/frontier-codec): optional patch serialization and transport layer for compiled patches.

Package source repositories:

- [`siliconjungle/-shapeshift-labs-frontier-state-cache-idb`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-idb)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-file`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-file)
- [`siliconjungle/-shapeshift-labs-frontier-state-cache-sql`](https://github.com/siliconjungle/-shapeshift-labs-frontier-state-cache-sql)
- [`siliconjungle/-shapeshift-labs-frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier)
- [`siliconjungle/-shapeshift-labs-frontier-query`](https://github.com/siliconjungle/-shapeshift-labs-frontier-query)
- [`siliconjungle/-shapeshift-labs-frontier-engine`](https://github.com/siliconjungle/-shapeshift-labs-frontier-engine)
- [`siliconjungle/-shapeshift-labs-frontier-codec`](https://github.com/siliconjungle/-shapeshift-labs-frontier-codec)

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
- `getMutationPlanAccess(plan)` exposes declared read/write/effect tuples without compiling against state.
- `mutationAccessesConflict(left, right)` and `canBatchMutationPlans(plans)` check whether declared access sets can safely batch.
- `captureMutationFrame(state, options?)` and `evaluateMutationFrame(state, frame, options?)` validate optimistic work against the authored state/version before compiling.

The public surface is intentionally small: build selectors, build a mutation plan, then compile or commit it. Planner choices, compiler passes, and CRDT lowering stay behind options and result metadata.

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
| 1% sparse selector update | 2.89 ms | 4.03 us |
| Indexed id `in` selector update | 1.85 ms | 4.24 us |
| 10% dense selector update | 3.51 ms | 21.26 us |
| Repeated arithmetic fold, 1000x | 0.48 us | 0.05 us |
| Transaction defer deletes, 64 fields | 80.54 us | 8.77 us |
| Frame validate, 32 watched paths | 0.93 us | 0.00 us |
| Repeated text append fold, 1000x | 1.00 us | 0.11 us |

These are Frontier-only package measurements, not competitor comparisons.

## License

MIT. See [LICENSE](./LICENSE).
