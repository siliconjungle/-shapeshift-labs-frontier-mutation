# Frontier Mutation

Explicit mutation and selector plans for Frontier.

Repository: [siliconjungle/-shapeshift-labs-frontier-mutation](https://github.com/siliconjungle/-shapeshift-labs-frontier-mutation)

Built on the core JSON diff/apply package: [`@shapeshift-labs/frontier`](https://github.com/siliconjungle/-shapeshift-labs-frontier).

```sh
npm install @shapeshift-labs/frontier @shapeshift-labs/frontier-mutation
```

`@shapeshift-labs/frontier-mutation` keeps intent above Frontier's concrete patch layer. A mutation plan can express operations such as increments, toggles, text/list appends, and selector-targeted row updates, then compile them into ordinary Frontier patches.

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

The public surface is intentionally small: build selectors, build a mutation plan, then compile or commit it. Planner choices, compiler passes, and CRDT lowering stay behind options and result metadata.

## Performance

Frontier Mutation was measured from this package on Node v26.1.0, darwin arm64. Timings are median microseconds per operation across warmed samples; p95 is shown to make noise visible. Patch bytes are `JSON.stringify(patch)` bytes because this package emits Frontier patches and does not own binary transport encoding.

| Fixture | Matches | Strategy | Patch | Bytes | Compile median | Compile p95 | Apply median |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Selector increment, 1% sparse 10k-row table | 100 | row-field | 1 op | 1.0 KiB | 3.55 ms | 4.04 ms | 10.35 us |
| Selector increment, indexed id IN | 100 | row-field | 1 op | 1.0 KiB | 2.84 ms | 3.12 ms | 8.77 us |
| Selector increment, 10% 10k-row table | 1,000 | row-field | 1 op | 8.5 KiB | 4.10 ms | 4.90 ms | 20.33 us |
| Repeated arithmetic fold, 1000x | 0 | direct | 1 op | 20 B | 0.45 us | 0.78 us | 0.05 us |
| Repeated text append fold, 1000x | 0 | direct | 1 op | 1.0 KiB | 0.55 us | 0.72 us | 0.10 us |

These are Frontier-only package measurements, not a competitor comparison. Hardware, Node version, selector shape, and table size will affect absolute timings.

## API Overview

```ts
import {
  compileMutationPlan,
  commitCrdtMutation,
  commitMutation,
  createMutationPlan,
  createSelectorRegistry,
  select,
  type MutationCompileResult,
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

The package has a peer dependency on the core package only. State and CRDT integration use small structural interfaces, so the mutation package does not force the full state or CRDT packages into the core import path.

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

Schema hints are trusted table/entity contracts. The key field becomes the default selector `keyBy`/`indexBy`, stable row shape lets the planner reuse selector matches across adjacent mutations that do not touch declared selector fields, and known numeric/text/list fields are reported in planner decisions for debugging and downstream specialization.

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
