import {
  OP_APPEND,
  OP_ARRAY_MOVE,
  OP_ARRAY_OBJECT_FIELD_ASSIGN,
  OP_ARRAY_SPLICE,
  OP_ASSIGN,
  OP_REMOVE,
  OP_SET,
  OP_STRING_SPLICE,
  applyPatch,
  cloneJson,
  diff,
  getPath,
  type DiffOptions,
  type JsonObject,
  type JsonPath,
  type JsonValue,
  type ObjectKey,
  type Patch,
  type PatchOperation,
  type PathSegment
} from '@shapeshift-labs/frontier';
import {
  cloneQueryCondition,
  collectQueryConditionFields,
  isSpecialQueryPath,
  matchesQueryConditions,
  normalizeQueryPath,
  normalizeQuerySchema,
  readQueryCondition,
  readQueryConditionEqualityHint,
  readQueryConditionValue,
  type NormalizedQuerySchema,
  type NormalizedQueryTableSchema,
  type QueryCondition,
  type QueryOperator,
  type QueryPath,
  type QuerySchemaInput,
  type QueryTableSchema
} from '@shapeshift-labs/frontier-query';

export type MutationPath = QueryPath;

export interface MutationStateEngine {
  get(): JsonValue;
  commitPatch(patch: Patch): unknown;
}

export type MutationCrdtCommit = unknown;

export interface MutationCrdtDocument {
  toJSON(): JsonValue;
  change(callback: (tx: MutationCrdtTransaction) => void, options?: { metadata?: JsonObject }): MutationCrdtCommit;
  changesSince(frontier: null | JsonValue): Array<{ type: string; path: JsonPath; keys?: string[] }>;
}

export interface MutationCrdtCounterHandle {
  increment(delta: number): void;
  decrement(delta: number): void;
}

export interface MutationCrdtTextHandle {
  insert(index: number, text: string): void;
  splice(index: number, deleteCount: number, text?: string): void;
}

export interface MutationCrdtListHandle {
  insert(index: number, values: JsonValue[]): void;
  delete(index: number, count?: number): void;
  move(fromIndex: number, toIndex: number, count?: number): void;
}

export interface MutationCrdtMapHandle {
  set(key: ObjectKey, value: JsonValue): void;
}

export interface MutationCrdtTransaction {
  set(path: JsonPath, value: JsonValue): void;
  delete(path: JsonPath): void;
  counter(path: JsonPath): MutationCrdtCounterHandle;
  text(path: JsonPath): MutationCrdtTextHandle;
  list(path: JsonPath): MutationCrdtListHandle;
  map(path: JsonPath): MutationCrdtMapHandle;
}

export type SelectorOperator = QueryOperator;

export type SelectorOrderDirection = 'asc' | 'desc';

export type SelectorCondition = QueryCondition;

export type MutationOperationKind =
  | 'set'
  | 'unset'
  | 'remove'
  | 'ensure'
  | 'upsert'
  | 'assign'
  | 'increment'
  | 'decrement'
  | 'multiply'
  | 'min'
  | 'max'
  | 'clamp'
  | 'toggle'
  | 'append'
  | 'prepend'
  | 'splice'
  | 'insert'
  | 'removeAt'
  | 'moveItem'
  | 'addToSet'
  | 'pull'
  | 'removeWhere'
  | 'appendText'
  | 'spliceText'
  | 'insertText'
  | 'deleteText'
  | 'replaceText'
  | 'formatText'
  | 'move'
  | 'copy'
  | 'rename'
  | 'test'
  | 'compareAndSet';

export type MutationValueFactory = (current: JsonValue | undefined, path: JsonPath) => JsonValue;
export type MutationArrayPredicate = (value: JsonValue, index: number, array: readonly JsonValue[]) => boolean;

export interface MutationTransactionOptions {
  origin?: string;
  metadata?: JsonObject;
  timestamp?: number;
}

export interface MutationTransactionInfo {
  origin?: string;
  metadata?: JsonObject;
  timestamp?: number;
}

export interface SelectorPlan {
  path: JsonPath;
  conditions: SelectorCondition[];
  keyBy?: JsonPath;
  indexBy?: JsonPath;
  orderBy?: { path: JsonPath; direction: SelectorOrderDirection };
  limit?: number;
  project?: JsonPath[];
  name?: string;
}

export interface MutationTableSchema extends QueryTableSchema {}

export interface MutationShapeSchema {
  tables?: MutationTableSchema[];
  /** Alias for table-like entity collections. */
  entities?: MutationTableSchema[];
}

export type MutationSchemaInput = QuerySchemaInput;

export interface MutationOperation {
  kind: MutationOperationKind;
  path: JsonPath;
  to?: JsonPath;
  key?: ObjectKey;
  value?: JsonValue;
  expected?: JsonValue;
  values?: JsonValue[];
  factory?: MutationValueFactory;
  predicate?: MutationArrayPredicate;
  start?: number;
  toIndex?: number;
  deleteCount?: number;
  length?: number;
  text?: string;
  attributes?: JsonObject;
  delta?: number;
  min?: number;
  max?: number;
  repeat: number;
  selector?: SelectorPlan;
  transaction?: MutationTransactionInfo;
}

export interface MutationCompileOptions {
  compact?: boolean;
  strategy?: MutationPatchStrategy;
  diff?: DiffOptions;
  planner?: MutationPlannerOptions;
}

export type MutationPatchStrategy =
  | 'auto'
  | 'direct'
  | 'row-field'
  | 'dirty-diff'
  | 'materialize-diff';

export type MutationPlannerDecisionStrategy =
  | 'direct'
  | 'row-field'
  | 'dirty-diff'
  | 'materialize-diff'
  | 'noop';

export type MutationCrdtStrategy = 'auto' | 'native' | 'materialize';

export type MutationCrdtDecisionStrategy =
  | 'native-counter'
  | 'native-text'
  | 'native-text-splice'
  | 'native-list'
  | 'native-map-field'
  | 'native-delete'
  | 'materialized-set'
  | 'noop';

export type MutationCrdtAssignmentPolicy =
  | 'preserve-conflicts'
  | 'last-write-wins'
  | 'materialize';

export interface MutationDiffEngine {
  diff(source: JsonValue, target: JsonValue, options?: DiffOptions): Patch;
}

export interface MutationPlannerOptions {
  strategy?: MutationPatchStrategy;
  crdt?: MutationCrdtStrategy;
  crdtAssignmentPolicy?: MutationCrdtAssignmentPolicy;
  crdtMetadata?: JsonObject;
  schema?: MutationSchemaInput;
  diff?: DiffOptions;
  diffEngine?: MutationDiffEngine;
  dirtyDiffMinSelectivity?: number;
}

export interface MutationDirtyRowsFrontier {
  path: JsonPath;
  rows: number[];
  fields?: JsonPath[];
}

export interface MutationPlannerDecision {
  strategy: MutationPlannerDecisionStrategy;
  reason: string;
  kind: MutationOperationKind;
  path: JsonPath;
  selectorPath?: JsonPath;
  matched?: number;
  collectionSize?: number;
  selectivity?: number | null;
  dirtyPaths?: JsonPath[];
  dirtyRows?: MutationDirtyRowsFrontier[];
  schema?: MutationPlannerSchemaDecision;
}

export interface MutationPlannerSchemaDecision {
  tablePath: JsonPath;
  key?: JsonPath;
  stableRowShape: boolean;
  fieldKind?: 'numeric' | 'text' | 'list';
  selectorCached?: boolean;
  selectorIndexed?: boolean;
}

export interface MutationCrdtPlannerDecision {
  strategy: MutationCrdtDecisionStrategy;
  reason: string;
  kind: MutationOperationKind;
  path: JsonPath;
  selectorPath?: JsonPath;
  native: boolean;
  assignmentPolicy?: MutationCrdtAssignmentPolicy;
  metadata?: JsonObject;
}

export interface MutationSelectorMatch {
  path: JsonPath;
  row: ObjectKey;
  projection?: JsonObject;
}

export interface MutationCompileResult {
  patch: Patch;
  matched: number;
  lowered: string[];
  dirtyPaths: JsonPath[];
  dirtyRows: Array<{ path: JsonPath; rows: number[]; fields: JsonPath[] }>;
  warnings: string[];
  matches: MutationSelectorMatch[];
  decisions: MutationPlannerDecision[];
}

export interface MutationPlanExplanation extends MutationCompileResult {
  operations: MutationOperation[];
  operationCount: number;
  patchOperationCount: number;
}

export interface MutationCrdtCommitResult extends MutationCompileResult {
  commit: MutationCrdtCommit;
  crdtDecisions: MutationCrdtPlannerDecision[];
}

export interface MutationPlanLike {
  readonly operations: readonly MutationOperation[];
  compilePatch(state: JsonValue | undefined, options?: MutationCompileOptions): MutationCompileResult;
}

export type MutationPlanScope = (plan: MutationPlan) => void;

type RowMatch = {
  key: ObjectKey;
  rowIndex?: number;
  mapKey?: string;
  value: JsonValue;
  path: JsonPath;
};

type SelectorContext = {
  selector: SelectorPlan;
  basePath: JsonPath;
  tailPath: JsonPath;
  collection: JsonValue;
  collectionSize: number;
  wildcardCount: number;
  matches: RowMatch[];
  schema?: NormalizedMutationTableSchema;
  usedCache?: boolean;
  usedIndex?: boolean;
};

type PendingRowMutation = {
  selector: SelectorPlan;
  basePath: JsonPath;
  tailPath: JsonPath;
  fields: JsonPath[];
  rowIndexes: number[];
  valuesByRow: Map<number, JsonValue[]>;
};

type NormalizedPlannerOptions = {
  strategy: MutationPatchStrategy;
  crdt: MutationCrdtStrategy;
  crdtAssignmentPolicy: MutationCrdtAssignmentPolicy;
  crdtMetadata?: JsonObject;
  schema: NormalizedMutationSchema;
  diff: DiffOptions;
  diffEngine?: MutationDiffEngine;
  dirtyDiffMinSelectivity: number;
};

type StrategyChoice = {
  strategy: MutationPlannerDecisionStrategy;
  reason: string;
  dirtyRows?: MutationDirtyRowsFrontier[];
  dirtyPaths?: JsonPath[];
};

type OptimizedMutationOperation = MutationOperation & {
  matchWeight: number;
};

type NativeCrdtSequenceBackings = {
  list: JsonPath[];
  text: JsonPath[];
};

type NormalizedMutationTableSchema = NormalizedQueryTableSchema;
type NormalizedMutationSchema = NormalizedQuerySchema;

type MutationRuntimeContext = {
  schema: NormalizedMutationSchema;
  tables: Map<string, MutationRuntimeTableState>;
  selectorCache: SelectorCacheEntry[];
};

type MutationRuntimeTableState = {
  schema: NormalizedMutationTableSchema;
  version: number;
  keyIndexVersion: number;
  keyIndex?: Map<ObjectKey, number[]>;
};

type SelectorCacheEntry = {
  selector: SelectorPlan;
  tablePathKey: string;
  version: number;
  context: SelectorContext;
};

type SelectorRegistryInit =
  | Record<string, SelectorBuilder | SelectorPlan>
  | Iterable<readonly [string, SelectorBuilder | SelectorPlan]>;

type SelectorWalkMeta = {
  key: ObjectKey;
  rowIndex?: number;
  mapKey?: string;
};

type SelectorCandidate = {
  key: ObjectKey;
  rowIndex?: number;
  mapKey?: string;
  value: JsonValue;
};

const DEFAULT_DIRTY_DIFF_MIN_SELECTIVITY = 0.75;

export class SelectorBuilder {
  private readonly plan: SelectorPlan;

  constructor(path: MutationPath) {
    this.plan = {
      path: normalizePath(path, 'selector path'),
      conditions: []
    };
  }

  where(fieldOrCondition: MutationPath | SelectorCondition, op?: SelectorOperator, value?: JsonValue | JsonValue[]): this {
    this.plan.conditions.push(readCondition(fieldOrCondition, op, value));
    return this;
  }

  and(fieldOrCondition: MutationPath | SelectorCondition, op?: SelectorOperator, value?: JsonValue | JsonValue[]): this {
    return this.where(fieldOrCondition, op, value);
  }

  or(...conditions: SelectorCondition[]): this {
    if (conditions.length === 0) throw new TypeError('or() requires at least one condition');
    this.plan.conditions.push({ or: conditions });
    return this;
  }

  not(condition: SelectorCondition): this {
    this.plan.conditions.push({ not: condition });
    return this;
  }

  keyBy(key: MutationPath): this {
    this.plan.keyBy = normalizePath(key, 'selector keyBy path');
    return this;
  }

  indexBy(key?: MutationPath): this {
    this.plan.indexBy = normalizePath(key === undefined ? this.plan.keyBy || '$key' : key, 'selector indexBy path');
    return this;
  }

  orderBy(path: MutationPath, direction: SelectorOrderDirection = 'asc'): this {
    if (direction !== 'asc' && direction !== 'desc') throw new TypeError('selector orderBy direction must be asc or desc');
    this.plan.orderBy = { path: normalizePath(path, 'selector orderBy path'), direction };
    return this;
  }

  limit(count: number): this {
    this.plan.limit = normalizeIndex(count, 'selector limit');
    return this;
  }

  first(): this {
    return this.limit(1);
  }

  project(...fields: MutationPath[]): this {
    if (fields.length === 0) throw new TypeError('selector project requires at least one field');
    this.plan.project = fields.map((field) => normalizePath(field, 'selector project path'));
    return this;
  }

  named(name: string): this {
    this.plan.name = normalizeSelectorName(name);
    return this;
  }

  toPlan(): SelectorPlan {
    return cloneSelectorPlan(this.plan);
  }
}

export class SelectorRegistry {
  private readonly selectors = new Map<string, SelectorPlan>();

  constructor(initial?: SelectorRegistryInit) {
    if (initial === undefined) return;
    if (Symbol.iterator in Object(initial)) {
      for (const [name, selector] of initial as Iterable<readonly [string, SelectorBuilder | SelectorPlan]>) {
        this.define(name, selector);
      }
    } else {
      for (const name of Object.keys(initial as Record<string, SelectorBuilder | SelectorPlan>)) {
        this.define(name, (initial as Record<string, SelectorBuilder | SelectorPlan>)[name]);
      }
    }
  }

  define(name: string, selector: SelectorBuilder | SelectorPlan): this {
    const normalizedName = normalizeSelectorName(name);
    const plan = selector instanceof SelectorBuilder ? selector.toPlan() : cloneSelectorPlan(selector);
    plan.name = normalizedName;
    this.selectors.set(normalizedName, plan);
    return this;
  }

  get(name: string): SelectorPlan {
    const normalizedName = normalizeSelectorName(name);
    const selector = this.selectors.get(normalizedName);
    if (selector === undefined) throw new TypeError('unknown selector: ' + normalizedName);
    return cloneSelectorPlan(selector);
  }

  has(name: string): boolean {
    return this.selectors.has(normalizeSelectorName(name));
  }

  entries(): Array<[string, SelectorPlan]> {
    return Array.from(this.selectors, ([name, selector]) => [name, cloneSelectorPlan(selector)]);
  }
}

export class MutationPlan implements MutationPlanLike {
  private readonly ops: MutationOperation[] = [];
  private currentSelector: SelectorPlan | undefined;
  private readonly transactionStack: MutationTransactionInfo[] = [];

  get operations(): readonly MutationOperation[] {
    return this.ops;
  }

  forEach(selector: SelectorBuilder | SelectorPlan, scope?: MutationPlanScope): this {
    const previousSelector = this.currentSelector;
    this.currentSelector = selector instanceof SelectorBuilder ? selector.toPlan() : cloneSelectorPlan(selector);
    if (scope !== undefined) {
      try {
        scope(this);
      } finally {
        this.currentSelector = previousSelector;
      }
    }
    return this;
  }

  where(path: MutationPath, condition?: SelectorCondition): this {
    const selector = new SelectorBuilder(path);
    if (condition !== undefined) selector.where(condition);
    return this.forEach(selector);
  }

  clearSelector(): this {
    this.currentSelector = undefined;
    return this;
  }

  set(path: MutationPath, value: JsonValue): this {
    return this.push({ kind: 'set', path: normalizePath(path, 'set path'), value, repeat: 1 });
  }

  unset(path: MutationPath): this {
    return this.push({ kind: 'unset', path: normalizePath(path, 'unset path'), repeat: 1 });
  }

  remove(path: MutationPath): this {
    return this.push({ kind: 'remove', path: normalizePath(path, 'remove path'), repeat: 1 });
  }

  ensure(path: MutationPath, defaultValue: JsonValue | MutationValueFactory): this {
    return this.push(makeValueOperation('ensure', normalizePath(path, 'ensure path'), defaultValue));
  }

  upsert(path: MutationPath, value: JsonValue | MutationValueFactory): this {
    return this.push(makeValueOperation('upsert', normalizePath(path, 'upsert path'), value));
  }

  assign(path: MutationPath, value: JsonObject): this {
    return this.push({ kind: 'assign', path: normalizePath(path, 'assign path'), value, repeat: 1 });
  }

  increment(path: MutationPath, delta = 1): this {
    return this.push({ kind: 'increment', path: normalizePath(path, 'increment path'), delta: normalizeInteger(delta, 'increment delta'), repeat: 1 });
  }

  decrement(path: MutationPath, delta = 1): this {
    return this.push({ kind: 'decrement', path: normalizePath(path, 'decrement path'), delta: normalizeInteger(delta, 'decrement delta'), repeat: 1 });
  }

  multiply(path: MutationPath, factor: number): this {
    return this.push({ kind: 'multiply', path: normalizePath(path, 'multiply path'), delta: normalizeFiniteNumber(factor, 'multiply factor'), repeat: 1 });
  }

  min(path: MutationPath, value: number): this {
    return this.push({ kind: 'min', path: normalizePath(path, 'min path'), delta: normalizeFiniteNumber(value, 'min value'), repeat: 1 });
  }

  max(path: MutationPath, value: number): this {
    return this.push({ kind: 'max', path: normalizePath(path, 'max path'), delta: normalizeFiniteNumber(value, 'max value'), repeat: 1 });
  }

  clamp(path: MutationPath, min: number, max: number): this {
    const normalizedMin = normalizeFiniteNumber(min, 'clamp min');
    const normalizedMax = normalizeFiniteNumber(max, 'clamp max');
    if (normalizedMin > normalizedMax) throw new RangeError('clamp min must be less than or equal to clamp max');
    return this.push({ kind: 'clamp', path: normalizePath(path, 'clamp path'), min: normalizedMin, max: normalizedMax, repeat: 1 });
  }

  toggle(path: MutationPath): this {
    return this.push({ kind: 'toggle', path: normalizePath(path, 'toggle path'), repeat: 1 });
  }

  append(path: MutationPath, values: JsonValue | JsonValue[]): this {
    const normalizedValues = Array.isArray(values) ? values : [values];
    return this.push({ kind: 'append', path: normalizePath(path, 'append path'), values: normalizedValues, repeat: 1 });
  }

  prepend(path: MutationPath, values: JsonValue | JsonValue[]): this {
    const normalizedValues = Array.isArray(values) ? values : [values];
    return this.push({ kind: 'prepend', path: normalizePath(path, 'prepend path'), values: normalizedValues, repeat: 1 });
  }

  splice(path: MutationPath, start: number, deleteCount: number, values: JsonValue[] = []): this {
    return this.push({
      kind: 'splice',
      path: normalizePath(path, 'splice path'),
      start: normalizeIndex(start, 'splice start'),
      deleteCount: normalizeIndex(deleteCount, 'splice deleteCount'),
      values,
      repeat: 1
    });
  }

  insert(path: MutationPath, index: number, values: JsonValue | JsonValue[]): this {
    const normalizedValues = Array.isArray(values) ? values : [values];
    return this.push({
      kind: 'insert',
      path: normalizePath(path, 'insert path'),
      start: normalizeIndex(index, 'insert index'),
      values: normalizedValues,
      repeat: 1
    });
  }

  removeAt(path: MutationPath, index: number, count = 1): this {
    return this.push({
      kind: 'removeAt',
      path: normalizePath(path, 'removeAt path'),
      start: normalizeIndex(index, 'removeAt index'),
      deleteCount: normalizeIndex(count, 'removeAt count'),
      repeat: 1
    });
  }

  moveItem(path: MutationPath, fromIndex: number, toIndex: number, count = 1): this {
    return this.push({
      kind: 'moveItem',
      path: normalizePath(path, 'moveItem path'),
      start: normalizeIndex(fromIndex, 'moveItem fromIndex'),
      toIndex: normalizeIndex(toIndex, 'moveItem toIndex'),
      deleteCount: normalizeIndex(count, 'moveItem count'),
      repeat: 1
    });
  }

  addToSet(path: MutationPath, values: JsonValue | JsonValue[]): this {
    const normalizedValues = Array.isArray(values) ? values : [values];
    return this.push({ kind: 'addToSet', path: normalizePath(path, 'addToSet path'), values: normalizedValues, repeat: 1 });
  }

  pull(path: MutationPath, values: JsonValue | JsonValue[]): this {
    const normalizedValues = Array.isArray(values) ? values : [values];
    return this.push({ kind: 'pull', path: normalizePath(path, 'pull path'), values: normalizedValues, repeat: 1 });
  }

  removeWhere(path: MutationPath, predicate: MutationArrayPredicate): this {
    if (typeof predicate !== 'function') throw new TypeError('removeWhere predicate must be a function');
    return this.push({ kind: 'removeWhere', path: normalizePath(path, 'removeWhere path'), predicate, repeat: 1 });
  }

  appendText(path: MutationPath, text: string): this {
    if (typeof text !== 'string') throw new TypeError('appendText text must be a string');
    return this.push({ kind: 'appendText', path: normalizePath(path, 'appendText path'), text, repeat: 1 });
  }

  spliceText(path: MutationPath, start: number, deleteCount: number, text = ''): this {
    if (typeof text !== 'string') throw new TypeError('spliceText text must be a string');
    return this.push({
      kind: 'spliceText',
      path: normalizePath(path, 'spliceText path'),
      start: normalizeIndex(start, 'spliceText start'),
      deleteCount: normalizeIndex(deleteCount, 'spliceText deleteCount'),
      text,
      repeat: 1
    });
  }

  insertText(path: MutationPath, index: number, text: string): this {
    if (typeof text !== 'string') throw new TypeError('insertText text must be a string');
    return this.push({
      kind: 'insertText',
      path: normalizePath(path, 'insertText path'),
      start: normalizeIndex(index, 'insertText index'),
      text,
      repeat: 1
    });
  }

  deleteText(path: MutationPath, index: number, count: number): this {
    return this.push({
      kind: 'deleteText',
      path: normalizePath(path, 'deleteText path'),
      start: normalizeIndex(index, 'deleteText index'),
      deleteCount: normalizeIndex(count, 'deleteText count'),
      text: '',
      repeat: 1
    });
  }

  replaceText(path: MutationPath, index: number, count: number, text: string): this {
    if (typeof text !== 'string') throw new TypeError('replaceText text must be a string');
    return this.push({
      kind: 'replaceText',
      path: normalizePath(path, 'replaceText path'),
      start: normalizeIndex(index, 'replaceText index'),
      deleteCount: normalizeIndex(count, 'replaceText count'),
      text,
      repeat: 1
    });
  }

  formatText(path: MutationPath, index: number, length: number, attributes: JsonObject): this {
    if (!isObjectRecord(attributes)) throw new TypeError('formatText attributes must be a JSON object');
    return this.push({
      kind: 'formatText',
      path: normalizePath(path, 'formatText path'),
      start: normalizeIndex(index, 'formatText index'),
      length: normalizeIndex(length, 'formatText length'),
      attributes: cloneJson(attributes) as JsonObject,
      repeat: 1
    });
  }

  move(from: MutationPath, to: MutationPath): this {
    return this.push({ kind: 'move', path: normalizePath(from, 'move from path'), to: normalizePath(to, 'move to path'), repeat: 1 });
  }

  copy(from: MutationPath, to: MutationPath): this {
    return this.push({ kind: 'copy', path: normalizePath(from, 'copy from path'), to: normalizePath(to, 'copy to path'), repeat: 1 });
  }

  rename(path: MutationPath, newKey: ObjectKey): this {
    if (typeof newKey !== 'string' && typeof newKey !== 'number') throw new TypeError('rename key must be a string or number');
    return this.push({ kind: 'rename', path: normalizePath(path, 'rename path'), key: newKey, repeat: 1 });
  }

  test(path: MutationPath, expected: JsonValue): this {
    return this.push({ kind: 'test', path: normalizePath(path, 'test path'), expected, repeat: 1 });
  }

  compareAndSet(path: MutationPath, expected: JsonValue, next: JsonValue | MutationValueFactory): this {
    const op = makeValueOperation('compareAndSet', normalizePath(path, 'compareAndSet path'), next);
    op.expected = expected;
    return this.push(op);
  }

  transaction(scope: MutationPlanScope, options: MutationTransactionOptions = {}): this {
    const info = normalizeTransactionInfo(options);
    this.transactionStack.push(info);
    try {
      scope(this);
    } finally {
      this.transactionStack.pop();
    }
    return this;
  }

  repeat(count: number): this {
    const repeat = normalizeIndex(count, 'repeat count');
    if (this.ops.length === 0) throw new TypeError('repeat() requires a previous mutation operation');
    this.ops[this.ops.length - 1] = { ...this.ops[this.ops.length - 1], repeat };
    return this;
  }

  compilePatch(state: JsonValue | undefined, options: MutationCompileOptions = {}): MutationCompileResult {
    return compileMutationPlan(this, state, options);
  }

  commit(state: MutationStateEngine, options?: MutationCompileOptions): MutationCompileResult {
    return commitMutation(state, this, options);
  }

  commitCrdt(doc: MutationCrdtDocument, options?: MutationCompileOptions): MutationCrdtCommitResult {
    return commitCrdtMutation(doc, this, options);
  }

  explain(state: JsonValue | undefined, options: MutationCompileOptions = {}): MutationPlanExplanation {
    const result = compileMutationPlan(this, state, options);
    return {
      ...result,
      operations: this.ops.map(cloneMutationOperation),
      operationCount: this.ops.length,
      patchOperationCount: result.patch.length
    };
  }

  private push(op: MutationOperation): this {
    const transaction = this.transactionStack.length === 0
      ? undefined
      : cloneTransactionInfo(this.transactionStack[this.transactionStack.length - 1]);
    const next = transaction === undefined ? op : { ...op, transaction };
    this.ops.push(this.currentSelector === undefined ? next : { ...next, selector: cloneSelectorPlan(this.currentSelector) });
    return this;
  }
}

export function select(path: MutationPath): SelectorBuilder {
  return new SelectorBuilder(path);
}

export function createMutationPlan(): MutationPlan {
  return new MutationPlan();
}

export function createSelectorRegistry(initial?: SelectorRegistryInit): SelectorRegistry {
  return new SelectorRegistry(initial);
}

export function compileMutationPlan(
  plan: MutationPlanLike,
  state: JsonValue | undefined,
  options: MutationCompileOptions = {}
): MutationCompileResult {
  const source = state === undefined ? null : state;
  const planner = normalizePlannerOptions(options);
  const operations = optimizeMutationOperations(plan.operations);
  const runtime = createMutationRuntime(planner.schema);
  if (planner.strategy === 'materialize-diff') {
    return compileMaterializedDiffMutationPlan(operations, source, options, planner, runtime);
  }

  let working = cloneJson(source);
  const patch: Patch = [];
  const lowered: string[] = [];
  const dirtyPaths: JsonPath[] = [];
  const dirtyRows: Array<{ path: JsonPath; rows: number[]; fields: JsonPath[] }> = [];
  const warnings: string[] = [];
  const matchesOut: MutationSelectorMatch[] = [];
  const decisions: MutationPlannerDecision[] = [];
  const pendingRows: PendingRowMutation[] = [];
  let matched = 0;

  for (const op of operations) {
    if (op.repeat === 0 || isNoopRepeat(op)) {
      lowered.push(op.kind + '-repeat-noop');
      decisions.push(makePlannerDecision(op, { strategy: 'noop', reason: 'repeat-noop' }));
      continue;
    }

    if (op.selector !== undefined) {
      const context = resolveSelector(working, op.selector, runtime);
      matched += context.matches.length * op.matchWeight;
      for (const match of context.matches) matchesOut.push(makeSelectorMatchOut(match, context.selector));
      if (context.matches.length === 0) {
        lowered.push(op.kind + '-selector-empty');
        decisions.push(makePlannerDecision(op, { strategy: 'noop', reason: 'selector-empty' }, context));
        continue;
      }

      const choice = chooseSelectorStrategy(planner, op, context);
      decisions.push(makePlannerDecision(op, choice, context));
      if (choice.strategy === 'row-field') {
        if (hasIncompatiblePendingRows(pendingRows, context, context.tailPath.concat(op.path))) flushPendingRows(pendingRows, patch, dirtyRows);
        working = queueRowFieldMutation(pendingRows, context, op, working);
        noteSelectorMutation(runtime, context, op);
        lowered.push(op.kind + '-selector-row-field');
      } else if (choice.strategy === 'dirty-diff') {
        flushPendingRows(pendingRows, patch, dirtyRows);
        working = emitDirtySelectorDiffMutation(working, context, op, choice, patch, lowered, dirtyPaths, dirtyRows, planner);
        noteSelectorMutation(runtime, context, op);
      } else {
        flushPendingRows(pendingRows, patch, dirtyRows);
        for (const match of context.matches) {
          const absolutePath = match.path.concat(op.path);
          const patchStart = patch.length;
          const changedPaths = emitAbsoluteMutation(working, match.path, absolutePath, op, patch, lowered, warnings);
          working = applyPatchOperationsToWorking(working, patch, patchStart);
          for (const dirtyPath of changedPaths) {
            dirtyPaths.push(dirtyPath);
            noteAbsoluteMutation(runtime, dirtyPath);
          }
        }
      }
      continue;
    }

    flushPendingRows(pendingRows, patch, dirtyRows);
    const choice = chooseAbsoluteStrategy(planner, op);
    decisions.push(makePlannerDecision(op, choice));
    let changedPaths: JsonPath[];
    if (choice.strategy === 'dirty-diff') {
      working = emitDirtyPathDiffMutation(working, op.path, op, choice, patch, lowered, dirtyPaths, planner);
      changedPaths = mutationDirtyPaths([], op.path, op);
    } else {
      const patchStart = patch.length;
      changedPaths = emitAbsoluteMutation(working, [], op.path, op, patch, lowered, warnings);
      working = applyPatchOperationsToWorking(working, patch, patchStart);
      for (const dirtyPath of changedPaths) dirtyPaths.push(dirtyPath);
    }
    for (const dirtyPath of changedPaths) noteAbsoluteMutation(runtime, dirtyPath);
  }

  flushPendingRows(pendingRows, patch, dirtyRows);
  const outputPatch = options.compact === false ? patch : compactMutationPatch(patch);
  return { patch: outputPatch, matched, lowered, dirtyPaths, dirtyRows, warnings, matches: matchesOut, decisions };
}

function compileMaterializedDiffMutationPlan(
  operations: readonly OptimizedMutationOperation[],
  source: JsonValue,
  options: MutationCompileOptions,
  planner: NormalizedPlannerOptions,
  runtime: MutationRuntimeContext
): MutationCompileResult {
  let working = cloneJson(source);
  const lowered: string[] = [];
  const dirtyPaths: JsonPath[] = [];
  const dirtyRows: Array<{ path: JsonPath; rows: number[]; fields: JsonPath[] }> = [];
  const warnings: string[] = [];
  const matchesOut: MutationSelectorMatch[] = [];
  const decisions: MutationPlannerDecision[] = [];
  let matched = 0;

  for (const op of operations) {
    if (op.repeat === 0 || isNoopRepeat(op)) {
      lowered.push(op.kind + '-repeat-noop');
      decisions.push(makePlannerDecision(op, { strategy: 'noop', reason: 'repeat-noop' }));
      continue;
    }

    if (op.selector !== undefined) {
      const context = resolveSelector(working, op.selector, runtime);
      matched += context.matches.length * op.matchWeight;
      for (const match of context.matches) matchesOut.push(makeSelectorMatchOut(match, context.selector));
      if (context.matches.length === 0) {
        lowered.push(op.kind + '-selector-empty');
        decisions.push(makePlannerDecision(op, { strategy: 'noop', reason: 'selector-empty' }, context));
        continue;
      }

      const choice: StrategyChoice = {
        strategy: 'materialize-diff',
        reason: 'forced-materialize-diff'
      };
      decisions.push(makePlannerDecision(op, choice, context));
      for (const match of context.matches) {
        const absolutePath = match.path.concat(op.path);
        working = applyMaterializedOperationToWorking(working, match.path, absolutePath, op);
        for (const dirtyPath of mutationDirtyPaths(match.path, absolutePath, op)) {
          dirtyPaths.push(dirtyPath);
          noteAbsoluteMutation(runtime, dirtyPath);
        }
      }
      lowered.push(op.kind + '-selector-materialized');
      continue;
    }

    decisions.push(makePlannerDecision(op, {
      strategy: 'materialize-diff',
      reason: 'forced-materialize-diff'
    }));
    working = applyMaterializedOperationToWorking(working, [], op.path, op);
    for (const dirtyPath of mutationDirtyPaths([], op.path, op)) {
      dirtyPaths.push(dirtyPath);
      noteAbsoluteMutation(runtime, dirtyPath);
    }
    lowered.push(op.kind + '-materialized');
  }

  const patch = diffWithPlanner(planner, source, working, planner.diff);
  const outputPatch = options.compact === false ? patch : compactMutationPatch(patch);
  return { patch: outputPatch, matched, lowered, dirtyPaths, dirtyRows, warnings, matches: matchesOut, decisions };
}

export function commitMutation(
  state: MutationStateEngine,
  plan: MutationPlanLike,
  options?: MutationCompileOptions
): MutationCompileResult {
  const result = compileMutationPlan(plan, state.get(), options);
  state.commitPatch(result.patch);
  return result;
}

export function commitCrdtMutation(
  doc: MutationCrdtDocument,
  plan: MutationPlanLike,
  options?: MutationCompileOptions
): MutationCrdtCommitResult {
  const state = doc.toJSON();
  const planner = normalizePlannerOptions(options);
  const compiled = compileMutationPlan(plan, state, options);
  const operations = optimizeMutationOperations(plan.operations);
  const crdtDecisions: MutationCrdtPlannerDecision[] = [];
  const changeOptions = planner.crdtMetadata === undefined
    ? undefined
    : { metadata: cloneJson(planner.crdtMetadata) as JsonObject };
  const runtime = createMutationRuntime(planner.schema);
  const nativeSequenceBackings = collectNativeCrdtSequenceBackings(doc);
  let commit: MutationCrdtCommit;

  if (operations.length === 0) {
    commit = doc.change(() => {}, changeOptions);
  } else {
    let working = cloneJson(state);
    const materializedWrites: JsonPath[] = [];
    const nativeSequenceWrites: JsonPath[] = [];
    commit = doc.change((tx) => {
      for (const op of operations) {
        if (op.repeat === 0 || isNoopRepeat(op)) {
          crdtDecisions.push(makeCrdtPlannerDecision(op, op.path, {
            strategy: 'noop',
            reason: 'repeat-noop'
          }));
          continue;
        }
        if (op.selector === undefined) {
          const decision = chooseCrdtStrategy(
            planner,
            working,
            op,
            op.path,
            undefined,
            operations.length,
            materializedWrites,
            nativeSequenceWrites,
            nativeSequenceBackings
          );
          crdtDecisions.push(decision);
          applyCrdtOperation(tx, working, [], op.path, op, decision);
          trackCrdtWrite(materializedWrites, nativeSequenceWrites, op.path, op, decision);
          working = applyMaterializedOperationToWorking(working, [], op.path, op);
          noteAbsoluteMutation(runtime, op.path);
          continue;
        }
        const context = resolveSelector(working, op.selector, runtime);
        if (context.matches.length === 0) {
          crdtDecisions.push(makeCrdtPlannerDecision(op, op.path, {
            strategy: 'noop',
            reason: 'selector-empty'
          }, op.selector.path));
          continue;
        }
        for (const match of context.matches) {
          const absolutePath = match.path.concat(op.path);
          const decision = chooseCrdtStrategy(
            planner,
            working,
            op,
            absolutePath,
            op.selector.path,
            operations.length,
            materializedWrites,
            nativeSequenceWrites,
            nativeSequenceBackings
          );
          crdtDecisions.push(decision);
          applyCrdtOperation(tx, working, match.path, absolutePath, op, decision);
          trackCrdtWrite(materializedWrites, nativeSequenceWrites, absolutePath, op, decision);
          working = applyMaterializedOperationToWorking(working, match.path, absolutePath, op);
          noteAbsoluteMutation(runtime, absolutePath);
        }
      }
    }, changeOptions);
  }

  return { ...compiled, commit, crdtDecisions };
}

function normalizePlannerOptions(options: MutationCompileOptions = {}): NormalizedPlannerOptions {
  return {
    strategy: normalizePatchStrategy(options.strategy ?? options.planner?.strategy ?? 'auto'),
    crdt: normalizeCrdtStrategy(options.planner?.crdt ?? 'auto'),
    crdtAssignmentPolicy: normalizeCrdtAssignmentPolicy(options.planner?.crdtAssignmentPolicy ?? 'preserve-conflicts'),
    crdtMetadata: normalizeCrdtMetadata(options.planner?.crdtMetadata),
    schema: normalizeMutationSchema(options.planner?.schema),
    diff: {
      ...(options.diff || {}),
      ...(options.planner?.diff || {})
    },
    diffEngine: options.planner?.diffEngine,
    dirtyDiffMinSelectivity: normalizeSelectivityThreshold(options.planner?.dirtyDiffMinSelectivity)
  };
}

function normalizePatchStrategy(strategy: MutationPatchStrategy): MutationPatchStrategy {
  if (
    strategy === 'auto' ||
    strategy === 'direct' ||
    strategy === 'row-field' ||
    strategy === 'dirty-diff' ||
    strategy === 'materialize-diff'
  ) {
    return strategy;
  }
  throw new TypeError('unsupported mutation patch strategy: ' + strategy);
}

function normalizeCrdtStrategy(strategy: MutationCrdtStrategy): MutationCrdtStrategy {
  if (strategy === 'auto' || strategy === 'native' || strategy === 'materialize') return strategy;
  throw new TypeError('unsupported mutation CRDT strategy: ' + strategy);
}

function normalizeCrdtAssignmentPolicy(policy: MutationCrdtAssignmentPolicy): MutationCrdtAssignmentPolicy {
  if (policy === 'preserve-conflicts' || policy === 'last-write-wins' || policy === 'materialize') return policy;
  throw new TypeError('unsupported mutation CRDT assignment policy: ' + policy);
}

function normalizeCrdtMetadata(metadata: JsonObject | undefined): JsonObject | undefined {
  if (metadata === undefined) return undefined;
  if (!isObjectRecord(metadata)) throw new TypeError('mutation CRDT metadata must be a JSON object');
  return cloneJson(metadata) as JsonObject;
}

function normalizeMutationSchema(schema: MutationSchemaInput | undefined): NormalizedMutationSchema {
  return normalizeQuerySchema(schema, 'mutation schema');
}

function normalizeSelectivityThreshold(value: number | undefined): number {
  if (value === undefined) return DEFAULT_DIRTY_DIFF_MIN_SELECTIVITY;
  if (!Number.isFinite(value)) throw new TypeError('dirtyDiffMinSelectivity must be a finite number');
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function diffWithPlanner(
  planner: NormalizedPlannerOptions,
  source: JsonValue,
  target: JsonValue,
  options: DiffOptions
): Patch {
  return planner.diffEngine === undefined
    ? diff(source, target, options)
    : planner.diffEngine.diff(source, target, options);
}

function chooseSelectorStrategy(
  planner: NormalizedPlannerOptions,
  op: MutationOperation,
  context: SelectorContext
): StrategyChoice {
  const rowFieldEligible = canUseRowFieldMutation(context, op);
  const dirtyRows = rowFieldEligible ? [makeDirtyRowsFrontier(context, op)] : undefined;
  const dirtyPaths = rowFieldEligible ? undefined : makeSelectorDirtyPaths(context, op);

  if (planner.strategy === 'direct') {
    return { strategy: 'direct', reason: 'forced-direct' };
  }
  if (planner.strategy === 'row-field') {
    return rowFieldEligible
      ? { strategy: 'row-field', reason: 'forced-row-field' }
      : { strategy: 'direct', reason: 'row-field-ineligible-direct' };
  }
  if (planner.strategy === 'dirty-diff') {
    return rowFieldEligible
      ? { strategy: 'dirty-diff', reason: 'forced-dirty-row-diff', dirtyRows }
      : { strategy: 'dirty-diff', reason: 'forced-dirty-path-diff', dirtyPaths };
  }
  if (planner.strategy === 'materialize-diff') {
    return { strategy: 'materialize-diff', reason: 'forced-materialize-diff' };
  }

  const selectivity = selectorSelectivity(context);
  if (selectivity !== null && selectivity >= planner.dirtyDiffMinSelectivity) {
    return rowFieldEligible
      ? { strategy: 'dirty-diff', reason: 'auto-dirty-row-diff-dense-selector', dirtyRows }
      : { strategy: 'dirty-diff', reason: 'auto-dirty-path-diff-dense-selector', dirtyPaths };
  }
  if (rowFieldEligible) return { strategy: 'row-field', reason: 'auto-row-field-sparse-selector' };
  return { strategy: 'direct', reason: 'auto-direct-selector' };
}

function chooseAbsoluteStrategy(planner: NormalizedPlannerOptions, op: MutationOperation): StrategyChoice {
  if (planner.strategy === 'dirty-diff') {
    return { strategy: 'dirty-diff', reason: 'forced-dirty-path-diff', dirtyPaths: mutationDirtyPaths([], op.path, op) };
  }
  if (planner.strategy === 'materialize-diff') {
    return { strategy: 'materialize-diff', reason: 'forced-materialize-diff' };
  }
  return { strategy: 'direct', reason: planner.strategy === 'direct' ? 'forced-direct' : 'auto-direct-absolute' };
}

function makePlannerDecision(
  op: MutationOperation,
  choice: StrategyChoice,
  context?: SelectorContext
): MutationPlannerDecision {
  const decision: MutationPlannerDecision = {
    strategy: choice.strategy,
    reason: choice.reason,
    kind: op.kind,
    path: op.path.slice()
  };

  if (op.selector !== undefined) decision.selectorPath = op.selector.path.slice();
  if (context !== undefined) {
    decision.matched = context.matches.length;
    decision.collectionSize = context.collectionSize;
    decision.selectivity = selectorSelectivity(context);
    if (context.schema !== undefined) decision.schema = makePlannerSchemaDecision(context, op);
  }
  if (choice.dirtyPaths !== undefined) decision.dirtyPaths = clonePathList(choice.dirtyPaths);
  if (choice.dirtyRows !== undefined) decision.dirtyRows = cloneDirtyRowsFrontiers(choice.dirtyRows);
  return decision;
}

function makePlannerSchemaDecision(context: SelectorContext, op: MutationOperation): MutationPlannerSchemaDecision {
  const field = context.tailPath.concat(op.path);
  const schema = context.schema as NormalizedMutationTableSchema;
  const decision: MutationPlannerSchemaDecision = {
    tablePath: schema.path.slice(),
    key: schema.key === undefined ? undefined : schema.key.slice(),
    stableRowShape: schema.stableRowShape
  };
  const kind = schemaFieldKind(schema, field);
  if (kind !== undefined) decision.fieldKind = kind;
  if (context.usedCache === true) decision.selectorCached = true;
  if (context.usedIndex === true) decision.selectorIndexed = true;
  return decision;
}

function canUseRowFieldMutation(context: SelectorContext, op: MutationOperation): boolean {
  return context.wildcardCount === 1 &&
    Array.isArray(context.collection) &&
    canUseRowFieldAssign(op) &&
    context.matches.every((match) => match.rowIndex !== undefined);
}

function makeDirtyRowsFrontier(context: SelectorContext, op: MutationOperation): MutationDirtyRowsFrontier {
  const rows: number[] = [];
  for (const match of context.matches) {
    if (match.rowIndex !== undefined) rows.push(match.rowIndex);
  }
  return {
    path: context.basePath.slice(),
    rows,
    fields: [context.tailPath.concat(op.path)]
  };
}

function makeSelectorDirtyPaths(context: SelectorContext, op: MutationOperation): JsonPath[] {
  const paths: JsonPath[] = [];
  for (const match of context.matches) {
    const absolutePath = match.path.concat(op.path);
    for (const dirtyPath of mutationDirtyPaths(match.path, absolutePath, op)) paths.push(dirtyPath);
  }
  return paths;
}

function collectionSizeOf(collection: JsonValue): number {
  if (Array.isArray(collection)) return collection.length;
  if (isObjectRecord(collection)) return Object.keys(collection).length;
  return 0;
}

function selectorSelectivity(context: SelectorContext): number | null {
  const size = context.collectionSize;
  return size === 0 ? null : context.matches.length / size;
}

function clonePathList(paths: JsonPath[]): JsonPath[] {
  return paths.map((path) => path.slice());
}

function cloneDirtyRowsFrontiers(frontiers: MutationDirtyRowsFrontier[]): MutationDirtyRowsFrontier[] {
  return frontiers.map((frontier) => ({
    path: frontier.path.slice(),
    rows: frontier.rows.slice(),
    fields: frontier.fields === undefined ? undefined : frontier.fields.map((field) => field.slice())
  }));
}

function toDirtyRowsResult(frontier: MutationDirtyRowsFrontier): { path: JsonPath; rows: number[]; fields: JsonPath[] } {
  return {
    path: frontier.path.slice(),
    rows: frontier.rows.slice(),
    fields: frontier.fields === undefined ? [] : frontier.fields.map((field) => field.slice())
  };
}

function emitDirtySelectorDiffMutation(
  source: JsonValue,
  context: SelectorContext,
  op: MutationOperation,
  choice: StrategyChoice,
  patch: Patch,
  lowered: string[],
  dirtyPaths: JsonPath[],
  dirtyRows: Array<{ path: JsonPath; rows: number[]; fields: JsonPath[] }>,
  planner: NormalizedPlannerOptions
): JsonValue {
  let target = cloneJson(source);
  const operationDirtyPaths: JsonPath[] = [];
  for (const match of context.matches) {
    const absolutePath = match.path.concat(op.path);
    target = applyMaterializedOperationToWorking(target, match.path, absolutePath, op);
    for (const dirtyPath of mutationDirtyPaths(match.path, absolutePath, op)) {
      operationDirtyPaths.push(dirtyPath);
      dirtyPaths.push(dirtyPath);
    }
  }

  if (choice.dirtyRows !== undefined) {
    patch.push(...diffWithPlanner(planner, source, target, {
      ...planner.diff,
      dirtyPaths: undefined,
      dirtyRows: choice.dirtyRows
    }));
    for (const frontier of choice.dirtyRows) dirtyRows.push(toDirtyRowsResult(frontier));
    lowered.push(op.kind + '-selector-dirty-row-diff');
  } else {
    patch.push(...diffWithPlanner(planner, source, target, {
      ...planner.diff,
      dirtyRows: undefined,
      dirtyPaths: choice.dirtyPaths || operationDirtyPaths
    }));
    lowered.push(op.kind + '-selector-dirty-path-diff');
  }
  return target;
}

function emitDirtyPathDiffMutation(
  source: JsonValue,
  path: JsonPath,
  op: MutationOperation,
  choice: StrategyChoice,
  patch: Patch,
  lowered: string[],
  dirtyPaths: JsonPath[],
  planner: NormalizedPlannerOptions
): JsonValue {
  const target = applyMaterializedOperationToWorking(cloneJson(source), [], path, op);
  const operationDirtyPaths = choice.dirtyPaths || mutationDirtyPaths([], path, op);
  patch.push(...diffWithPlanner(planner, source, target, {
    ...planner.diff,
    dirtyRows: undefined,
    dirtyPaths: operationDirtyPaths
  }));
  for (const dirtyPath of operationDirtyPaths) dirtyPaths.push(dirtyPath.slice());
  lowered.push(op.kind + '-dirty-path-diff');
  return target;
}

function chooseCrdtStrategy(
  planner: NormalizedPlannerOptions,
  state: JsonValue,
  op: MutationOperation,
  path: JsonPath,
  selectorPath: JsonPath | undefined,
  operationCount: number,
  materializedWrites: JsonPath[],
  nativeSequenceWrites: JsonPath[],
  nativeSequenceBackings: NativeCrdtSequenceBackings
): MutationCrdtPlannerDecision {
  if (op.kind === 'test') {
    assertMutationExpected(readPath(state, path), op.expected as JsonValue, path);
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'noop',
      reason: 'precondition-only'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (op.kind === 'ensure' && readPath(state, path) !== undefined) {
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'noop',
      reason: 'ensure-present'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (op.kind === 'compareAndSet') {
    assertMutationExpected(readPath(state, path), op.expected as JsonValue, path);
  }

  if (planner.crdt === 'materialize') {
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'materialized-set',
      reason: 'forced-materialize'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (isRemoveOperation(op) && path.length > 0 && !hasOverlappingPath(materializedWrites, path)) {
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'native-delete',
      reason: planner.crdt === 'native' ? 'forced-native-delete' : 'auto-native-delete'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (isArithmeticOperation(op)) {
    if (canUseNativeCrdtCounter(path, operationCount, materializedWrites)) {
      return makeCrdtPlannerDecision(op, path, {
        strategy: 'native-counter',
        reason: planner.crdt === 'native' ? 'forced-native-counter' : 'auto-native-counter'
      }, selectorPath, planner.crdtAssignmentPolicy);
    }
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'materialized-set',
      reason: 'native-counter-ineligible-materialized'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (isTextAppendOperation(op) || isTextSpliceOperation(op)) {
    if (canUseNativeCrdtText(state, path, op, materializedWrites, nativeSequenceWrites, nativeSequenceBackings)) {
      return makeCrdtPlannerDecision(op, path, {
        strategy: isTextSpliceOperation(op) ? 'native-text-splice' : 'native-text',
        reason: planner.crdt === 'native'
          ? (isTextSpliceOperation(op) ? 'forced-native-text-splice' : 'forced-native-text')
          : (isTextSpliceOperation(op) ? 'auto-native-text-splice' : 'auto-native-text')
      }, selectorPath, planner.crdtAssignmentPolicy);
    }
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'materialized-set',
      reason: 'native-text-ineligible-materialized'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (isNativeListCandidateOperation(op)) {
    if (canUseNativeCrdtList(state, path, materializedWrites, nativeSequenceWrites, nativeSequenceBackings)) {
      return makeCrdtPlannerDecision(op, path, {
        strategy: 'native-list',
        reason: planner.crdt === 'native' ? 'forced-native-list' : 'auto-native-list'
      }, selectorPath, planner.crdtAssignmentPolicy);
    }
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'materialized-set',
      reason: 'native-list-ineligible-materialized'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (isMapFieldMutationOperation(op) && planner.crdtAssignmentPolicy !== 'preserve-conflicts') {
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'materialized-set',
      reason: 'crdt-assignment-policy-materialized'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  if (canUseNativeCrdtMapField(state, path, op, planner.crdtAssignmentPolicy, materializedWrites, nativeSequenceWrites)) {
    return makeCrdtPlannerDecision(op, path, {
      strategy: 'native-map-field',
      reason: planner.crdt === 'native' ? 'forced-native-map-field' : 'auto-native-map-field'
    }, selectorPath, planner.crdtAssignmentPolicy);
  }

  return makeCrdtPlannerDecision(op, path, {
    strategy: 'materialized-set',
    reason: planner.crdt === 'native' ? 'native-unsupported-materialized' : 'auto-materialized'
  }, selectorPath, planner.crdtAssignmentPolicy);
}

function makeCrdtPlannerDecision(
  op: MutationOperation,
  path: JsonPath,
  choice: { strategy: MutationCrdtDecisionStrategy; reason: string },
  selectorPath?: JsonPath,
  assignmentPolicy?: MutationCrdtAssignmentPolicy
): MutationCrdtPlannerDecision {
  const native = isNativeCrdtDecisionStrategy(choice.strategy);
  const decision: MutationCrdtPlannerDecision = {
    strategy: choice.strategy,
    reason: choice.reason,
    kind: op.kind,
    path: path.slice(),
    native
  };
  if (selectorPath !== undefined) decision.selectorPath = selectorPath.slice();
  if (assignmentPolicy !== undefined && isAssignmentLikeOperation(op)) decision.assignmentPolicy = assignmentPolicy;
  decision.metadata = makeCrdtDecisionMetadata(decision, op);
  return decision;
}

function isNativeCrdtDecisionStrategy(strategy: MutationCrdtDecisionStrategy): boolean {
  return strategy === 'native-counter' ||
    strategy === 'native-text' ||
    strategy === 'native-text-splice' ||
    strategy === 'native-list' ||
    strategy === 'native-map-field' ||
    strategy === 'native-delete';
}

function makeCrdtDecisionMetadata(decision: MutationCrdtPlannerDecision, op: MutationOperation): JsonObject {
  const metadata: JsonObject = {
    strategy: decision.strategy,
    reason: decision.reason,
    kind: decision.kind,
    path: decision.path.slice(),
    native: decision.native,
    repeat: op.repeat
  };
  if (decision.selectorPath !== undefined) metadata.selectorPath = decision.selectorPath.slice();
  if (decision.assignmentPolicy !== undefined) metadata.assignmentPolicy = decision.assignmentPolicy;
  if (isArithmeticOperation(op)) metadata.delta = signedArithmeticDelta(op);
  if (op.kind === 'multiply') metadata.factor = op.delta;
  if (op.kind === 'min' || op.kind === 'max') metadata.value = op.delta;
  if (op.kind === 'clamp') {
    metadata.min = op.min as number;
    metadata.max = op.max as number;
  }
  if (isListInsertOperation(op) || op.kind === 'append' || op.kind === 'addToSet') metadata.valueCount = (op.values || []).length * op.repeat;
  if (isListSpliceOperation(op)) {
    metadata.start = op.start || 0;
    metadata.deleteCount = op.deleteCount || 0;
    metadata.valueCount = (op.values || []).length * op.repeat;
  }
  if (op.kind === 'moveItem') {
    metadata.fromIndex = op.start || 0;
    metadata.toIndex = op.toIndex || 0;
    metadata.count = op.deleteCount || 1;
  }
  if (isTextAppendOperation(op)) metadata.textLength = Array.from((op.text || '').repeat(op.repeat)).length;
  if (isTextSpliceOperation(op)) {
    metadata.start = op.start || 0;
    metadata.deleteCount = op.deleteCount || 0;
    metadata.textLength = Array.from(op.text || '').length * op.repeat;
  }
  if (op.kind === 'formatText') {
    metadata.start = op.start || 0;
    metadata.length = op.length || 0;
    metadata.attributes = cloneJson(op.attributes || {}) as JsonObject;
  }
  if (op.kind === 'assign' && isObjectRecord(op.value)) metadata.fields = Object.keys(op.value);
  if (op.transaction !== undefined) metadata.transaction = cloneTransactionInfo(op.transaction) as JsonObject;
  return metadata;
}

function applyPatchOperationsToWorking(working: JsonValue, patch: Patch, start: number): JsonValue {
  if (patch.length === start) return working;
  return applyPatch(working, patch.slice(start), { cloneValues: true });
}

function applyMaterializedOperationToWorking(working: JsonValue, basePath: JsonPath, path: JsonPath, op: MutationOperation): JsonValue {
  if (op.kind === 'test') {
    assertMutationExpected(readPath(working, path), op.expected as JsonValue, path);
    return working;
  }
  if (op.kind === 'copy') {
    return setPathInWorking(working, resolveOperationToPath(basePath, op), cloneJson(readRequiredPath(working, path)));
  }
  if (op.kind === 'move') {
    return movePathInWorking(working, path, resolveOperationToPath(basePath, op));
  }
  if (op.kind === 'rename') {
    return movePathInWorking(working, path, renameTargetPath(path, op));
  }
  if (isRemoveOperation(op)) {
    return removePathFromWorking(working, path);
  }
  const current = readPath(working, path);
  const nextValue = applyFieldMutation(current, op, path);
  if (op.kind === 'ensure' && current !== undefined) return working;
  return setPathInWorking(working, path, nextValue);
}

function compactMutationPatch(patch: Patch): Patch {
  const compacted: Patch = [];
  for (const operation of patch) {
    const previous = compacted[compacted.length - 1];
    if (previous !== undefined && mergePatchOperation(previous, operation)) continue;
    compacted.push(operation);
  }
  return compacted;
}

function mergePatchOperation(previous: PatchOperation, next: PatchOperation): boolean {
  if (previous[0] === OP_SET && next[0] === OP_SET && samePath(previous[1], next[1])) {
    previous[2] = next[2];
    return true;
  }
  if (previous[0] === OP_APPEND && next[0] === OP_APPEND && samePath(previous[1], next[1])) {
    previous[2].push(...next[2]);
    return true;
  }
  if (
    previous[0] === OP_STRING_SPLICE &&
    next[0] === OP_STRING_SPLICE &&
    samePath(previous[1], next[1]) &&
    previous[3] === 0 &&
    next[3] === 0 &&
    next[2] === previous[2] + previous[4].length
  ) {
    previous[4] += next[4];
    return true;
  }
  return false;
}

function optimizeMutationOperations(operations: readonly MutationOperation[]): OptimizedMutationOperation[] {
  const optimized: OptimizedMutationOperation[] = [];
  for (const rawOp of operations) {
    const op = normalizeOperation(rawOp);
    if (op.repeat === 0 || isNoopRepeat(op)) continue;
    const optimizedOp = withMatchWeight(op, 1);
    const previous = optimized[optimized.length - 1];
    if (previous !== undefined) {
      const merged = mergeOptimizedOperations(previous, optimizedOp);
      if (merged !== null) {
        optimized.pop();
        if (merged !== undefined) optimized.push(merged);
        continue;
      }
    }
    optimized.push(optimizedOp);
  }
  return optimized;
}

function withMatchWeight(op: MutationOperation, matchWeight: number): OptimizedMutationOperation {
  return { ...op, matchWeight };
}

function mergeOptimizedOperations(
  left: OptimizedMutationOperation,
  right: OptimizedMutationOperation
): OptimizedMutationOperation | undefined | null {
  if (!canMergeOptimizedOperations(left, right)) return null;
  if (isArithmeticOperation(left) && isArithmeticOperation(right)) return mergeArithmeticOperations(left, right);
  if (left.kind === 'append' && right.kind === 'append') return mergeAppendOperations(left, right);
  if (isTextAppendOperation(left) && isTextAppendOperation(right)) return mergeAppendTextOperations(left, right);
  if (left.kind === 'toggle' && right.kind === 'toggle') return mergeToggleOperations(left, right);
  return null;
}

function canMergeOptimizedOperations(left: MutationOperation, right: MutationOperation): boolean {
  if (!samePath(left.path, right.path) ||
    !sameOptionalPath(left.to, right.to) ||
    left.key !== right.key ||
    !sameSelectorPlan(left.selector, right.selector) ||
    !sameTransactionInfo(left.transaction, right.transaction)) return false;
  if (left.selector === undefined) return true;
  return selectorMutationPreservesMembership(left.selector, left.path) &&
    selectorMutationPreservesMembership(left.selector, right.path);
}

function mergeArithmeticOperations(
  left: OptimizedMutationOperation,
  right: OptimizedMutationOperation
): OptimizedMutationOperation | undefined {
  const total = signedArithmeticDelta(left) + signedArithmeticDelta(right);
  normalizeInteger(total, 'merged arithmetic delta');
  if (total === 0) return undefined;
  return {
    kind: total < 0 ? 'decrement' : 'increment',
    delta: Math.abs(total),
    repeat: 1,
    path: left.path.slice(),
    selector: left.selector === undefined ? undefined : cloneSelectorPlan(left.selector),
    transaction: left.transaction === undefined ? undefined : cloneTransactionInfo(left.transaction),
    matchWeight: left.matchWeight + right.matchWeight
  };
}

function mergeAppendOperations(left: OptimizedMutationOperation, right: OptimizedMutationOperation): OptimizedMutationOperation {
  return {
    kind: 'append',
    values: repeatValues(left.values || [], left.repeat).concat(repeatValues(right.values || [], right.repeat)),
    repeat: 1,
    path: left.path.slice(),
    selector: left.selector === undefined ? undefined : cloneSelectorPlan(left.selector),
    transaction: left.transaction === undefined ? undefined : cloneTransactionInfo(left.transaction),
    matchWeight: left.matchWeight + right.matchWeight
  };
}

function mergeAppendTextOperations(left: OptimizedMutationOperation, right: OptimizedMutationOperation): OptimizedMutationOperation {
  return {
    kind: 'appendText',
    text: (left.text || '').repeat(left.repeat) + (right.text || '').repeat(right.repeat),
    repeat: 1,
    path: left.path.slice(),
    selector: left.selector === undefined ? undefined : cloneSelectorPlan(left.selector),
    transaction: left.transaction === undefined ? undefined : cloneTransactionInfo(left.transaction),
    matchWeight: left.matchWeight + right.matchWeight
  };
}

function mergeToggleOperations(left: OptimizedMutationOperation, right: OptimizedMutationOperation): OptimizedMutationOperation | undefined {
  const repeat = (left.repeat + right.repeat) % 2;
  if (repeat === 0) return undefined;
  return {
    kind: 'toggle',
    repeat,
    path: left.path.slice(),
    selector: left.selector === undefined ? undefined : cloneSelectorPlan(left.selector),
    transaction: left.transaction === undefined ? undefined : cloneTransactionInfo(left.transaction),
    matchWeight: left.matchWeight + right.matchWeight
  };
}

function selectorMutationPreservesMembership(selector: SelectorPlan, path: JsonPath): boolean {
  const fields: JsonPath[] = [];
  collectSelectorConditionFields(selector.conditions, fields);
  for (const field of fields) {
    if (overlappingMutationPaths(path, field)) return false;
  }
  return true;
}

function collectSelectorConditionFields(conditions: readonly SelectorCondition[], out: JsonPath[]): void {
  collectQueryConditionFields(conditions, out);
}

function overlappingMutationPaths(left: JsonPath, right: JsonPath): boolean {
  return samePath(left, right) || isPathPrefix(left, right) || isPathPrefix(right, left);
}

function signedArithmeticDelta(op: MutationOperation): number {
  const sign = op.kind === 'decrement' ? -1 : 1;
  return sign * (op.delta || 0) * op.repeat;
}

function isArithmeticOperation(op: MutationOperation): boolean {
  return op.kind === 'increment' || op.kind === 'decrement';
}

function isAssignmentLikeOperation(op: MutationOperation): boolean {
  return op.kind === 'set' ||
    op.kind === 'ensure' ||
    op.kind === 'upsert' ||
    op.kind === 'assign' ||
    op.kind === 'toggle' ||
    op.kind === 'compareAndSet';
}

function isMapFieldMutationOperation(op: MutationOperation): boolean {
  return isAssignmentLikeOperation(op);
}

function emitAbsoluteMutation(
  source: JsonValue,
  basePath: JsonPath,
  path: JsonPath,
  op: MutationOperation,
  patch: Patch,
  lowered: string[],
  warnings: string[]
): JsonPath[] {
  const current = readPath(source, path);
  if (op.kind === 'test') {
    assertMutationExpected(current, op.expected as JsonValue, path);
    lowered.push('test');
    return [];
  }
  if (op.kind === 'copy') {
    const to = resolveOperationToPath(basePath, op);
    patch.push([OP_SET, to.slice(), cloneJson(readRequiredPath(source, path))]);
    lowered.push('copy-to-set');
    return [to];
  }
  if (op.kind === 'move') {
    const to = resolveOperationToPath(basePath, op);
    emitMovePatch(source, path, to, patch);
    lowered.push('move');
    return pathsEqualOrPair(path, to);
  }
  if (op.kind === 'rename') {
    const to = renameTargetPath(path, op);
    emitMovePatch(source, path, to, patch);
    lowered.push('rename-to-move');
    return pathsEqualOrPair(path, to);
  }
  if (isRemoveOperation(op)) {
    emitRemovePatch(source, path, patch);
    lowered.push(op.kind);
    return [path.slice()];
  }
  if (op.kind === 'set') {
    patch.push([OP_SET, path.slice(), cloneJson(op.value as JsonValue)]);
    lowered.push('set');
    return [path.slice()];
  }
  if (op.kind === 'ensure') {
    if (current !== undefined) {
      lowered.push('ensure-noop');
      return [];
    }
    patch.push([OP_SET, path.slice(), readOperationValue(op, current, path)]);
    lowered.push('ensure-to-set');
    return [path.slice()];
  }
  if (op.kind === 'upsert') {
    const value = readOperationValue(op, current, path);
    if (isObjectRecord(current) && isObjectRecord(value)) {
      patch.push([OP_ASSIGN, path.slice(), cloneJson(value) as JsonObject]);
      lowered.push('upsert-to-assign');
    } else {
      patch.push([OP_SET, path.slice(), cloneJson(value)]);
      lowered.push('upsert-to-set');
    }
    return [path.slice()];
  }
  if (op.kind === 'assign') {
    const value = cloneJson(op.value as JsonObject) as JsonObject;
    if (isObjectRecord(current)) {
      patch.push([OP_ASSIGN, path.slice(), value]);
    } else {
      patch.push([OP_SET, path.slice(), { ...value }]);
    }
    lowered.push('assign');
    return [path.slice()];
  }
  if (op.kind === 'compareAndSet') {
    assertMutationExpected(current, op.expected as JsonValue, path);
    patch.push([OP_SET, path.slice(), readOperationValue(op, current, path)]);
    lowered.push('compareAndSet-to-set');
    return [path.slice()];
  }
  if (op.kind === 'increment' || op.kind === 'decrement') {
    patch.push([OP_SET, path.slice(), applyNumericMutation(current, op)]);
    lowered.push(op.kind + '-to-set');
    return [path.slice()];
  }
  if (op.kind === 'multiply' || op.kind === 'min' || op.kind === 'max' || op.kind === 'clamp') {
    patch.push([OP_SET, path.slice(), applyAdvancedNumericMutation(current, op)]);
    lowered.push(op.kind + '-to-set');
    return [path.slice()];
  }
  if (op.kind === 'toggle') {
    if (op.repeat % 2 === 1) {
      patch.push([OP_SET, path.slice(), !Boolean(current)]);
      lowered.push('toggle-to-set');
      return [path.slice()];
    } else {
      lowered.push('toggle-repeat-noop');
      return [];
    }
  }
  if (op.kind === 'append') {
    const values = repeatValues(op.values || [], op.repeat);
    if (Array.isArray(current)) {
      patch.push([OP_APPEND, path.slice(), values]);
      lowered.push('append');
    } else {
      patch.push([OP_SET, path.slice(), values]);
      lowered.push('append-to-set');
    }
    return [path.slice()];
  }
  if (op.kind === 'prepend' || op.kind === 'insert' || op.kind === 'removeAt' || op.kind === 'splice') {
    if (op.kind === 'splice' && op.repeat !== 1) {
      patch.push([OP_SET, path.slice(), applyListMutationToValue(current, op)]);
      lowered.push('splice-to-set');
      return [path.slice()];
    }
    const splice = listSpliceArgs(current, op);
    if (Array.isArray(current)) {
      patch.push([OP_ARRAY_SPLICE, path.slice(), splice.start, splice.deleteCount, splice.values]);
      lowered.push(op.kind + '-to-array-splice');
    } else {
      patch.push([OP_SET, path.slice(), applyListMutationToValue(current, op)]);
      lowered.push(op.kind + '-to-set');
    }
    return [path.slice()];
  }
  if (op.kind === 'moveItem') {
    if (Array.isArray(current) && (op.deleteCount || 1) === 1) {
      patch.push([OP_ARRAY_MOVE, path.slice(), boundedIndex(op.start || 0, current.length), boundedIndex(op.toIndex || 0, current.length)]);
      lowered.push('moveItem-to-array-move');
    } else {
      patch.push([OP_SET, path.slice(), applyListMutationToValue(current, op)]);
      lowered.push('moveItem-to-set');
    }
    return [path.slice()];
  }
  if (op.kind === 'addToSet') {
    const values = addToSetValues(current, op);
    if (Array.isArray(current) && values.length !== 0) {
      patch.push([OP_APPEND, path.slice(), values]);
      lowered.push('addToSet-to-append');
      return [path.slice()];
    }
    if (Array.isArray(current)) {
      lowered.push('addToSet-noop');
      return [];
    }
    patch.push([OP_SET, path.slice(), values]);
    lowered.push('addToSet-to-set');
    return [path.slice()];
  }
  if (op.kind === 'pull' || op.kind === 'removeWhere') {
    patch.push([OP_SET, path.slice(), applyListMutationToValue(current, op)]);
    lowered.push(op.kind + '-to-set');
    return [path.slice()];
  }
  if (isTextAppendOperation(op) || isTextSpliceOperation(op)) {
    if (isTextSpliceOperation(op) && op.repeat !== 1) {
      patch.push([OP_SET, path.slice(), applyTextMutationToValue(current, op)]);
      lowered.push(op.kind + '-to-set');
      return [path.slice()];
    }
    const text = textInsertForOperation(op);
    const start = textStartForOperation(current, op);
    const deleteCount = textDeleteCountForOperation(current, op, start);
    if (typeof current === 'string') {
      patch.push([OP_STRING_SPLICE, path.slice(), start, deleteCount, text]);
      lowered.push(op.kind);
    } else {
      patch.push([OP_SET, path.slice(), applyTextMutationToValue(current, op)]);
      lowered.push(op.kind + '-to-set');
    }
    return [path.slice()];
  }
  if (op.kind === 'formatText') {
    patch.push([OP_SET, path.slice(), applyRichTextFormatMutation(current, op)]);
    lowered.push('formatText-to-set');
    return [path.slice()];
  }
  warnings.push('unsupported mutation kind: ' + op.kind);
  return [];
}

function queueRowFieldMutation(
  pending: PendingRowMutation[],
  context: SelectorContext,
  op: MutationOperation,
  working: JsonValue
): JsonValue {
  let entry = pending.find((item) => samePath(item.basePath, context.basePath) && samePath(item.tailPath, context.tailPath));
  if (entry === undefined) {
    entry = {
      selector: context.selector,
      basePath: context.basePath.slice(),
      tailPath: context.tailPath.slice(),
      fields: [],
      rowIndexes: [],
      valuesByRow: new Map()
    };
    pending.push(entry);
  }

  const field = context.tailPath.concat(op.path);
  const fieldIndex = internField(entry.fields, field);
  let nextWorking = working;
  for (const match of context.matches) {
    if (match.rowIndex === undefined) continue;
    if (!entry.rowIndexes.includes(match.rowIndex)) entry.rowIndexes.push(match.rowIndex);
    let values = entry.valuesByRow.get(match.rowIndex);
    if (values === undefined) {
      values = new Array(entry.fields.length);
      entry.valuesByRow.set(match.rowIndex, values);
    }
    if (values.length < entry.fields.length) values.length = entry.fields.length;
    const absolutePath = match.path.concat(op.path);
    const current = readPath(nextWorking, absolutePath);
    const nextValue = applyFieldMutation(current, op, absolutePath);
    values[fieldIndex] = nextValue;
    nextWorking = applyPatch(nextWorking, [[OP_SET, absolutePath, cloneJson(nextValue)]]);
  }
  return nextWorking;
}

function hasIncompatiblePendingRows(pending: PendingRowMutation[], context: SelectorContext, field: JsonPath): boolean {
  const rowIndexes = context.matches
    .map((match) => match.rowIndex)
    .filter((rowIndex): rowIndex is number => rowIndex !== undefined);
  for (const entry of pending) {
    if (!sameSelectorPlan(entry.selector, context.selector)) return true;
    if (!samePath(entry.basePath, context.basePath) || !samePath(entry.tailPath, context.tailPath)) return true;
    if (!sameNumberArray(entry.rowIndexes, rowIndexes)) return true;
    for (const existingField of entry.fields) {
      if (overlappingFieldPaths(existingField, field)) return true;
    }
  }
  return false;
}

function flushPendingRows(
  pending: PendingRowMutation[],
  patch: Patch,
  dirtyRows: Array<{ path: JsonPath; rows: number[]; fields: JsonPath[] }>
): void {
  for (const entry of pending) {
    entry.rowIndexes.sort(compareNumbers);
    const values: JsonValue[] = [];
    for (const row of entry.rowIndexes) {
      const rowValues = entry.valuesByRow.get(row) || [];
      for (let i = 0; i < entry.fields.length; i++) values.push(cloneJson(rowValues[i] as JsonValue));
    }
    patch.push([OP_ARRAY_OBJECT_FIELD_ASSIGN, entry.basePath.slice(), entry.rowIndexes.slice(), entry.fields.map((field) => field.slice()), values]);
    dirtyRows.push({ path: entry.basePath.slice(), rows: entry.rowIndexes.slice(), fields: entry.fields.map((field) => field.slice()) });
  }
  pending.length = 0;
}

function applyFieldMutation(current: JsonValue | undefined, op: MutationOperation, path: JsonPath = []): JsonValue {
  if (op.kind === 'set') return cloneJson(op.value as JsonValue);
  if (op.kind === 'ensure') return current === undefined ? readOperationValue(op, current, path) : current as JsonValue;
  if (op.kind === 'upsert') return applyUpsertMutation(current, op, path);
  if (op.kind === 'compareAndSet') {
    assertMutationExpected(current, op.expected as JsonValue, path);
    return readOperationValue(op, current, path);
  }
  if (op.kind === 'assign') {
    const value = cloneJson(op.value as JsonObject) as JsonObject;
    return isObjectRecord(current) ? { ...current, ...value } : value;
  }
  if (op.kind === 'increment' || op.kind === 'decrement') return applyNumericMutation(current, op);
  if (op.kind === 'multiply' || op.kind === 'min' || op.kind === 'max' || op.kind === 'clamp') return applyAdvancedNumericMutation(current, op);
  if (op.kind === 'toggle') return op.repeat % 2 === 1 ? !Boolean(current) : current as JsonValue;
  if (op.kind === 'append') return Array.isArray(current) ? current.concat(repeatValues(op.values || [], op.repeat)) : repeatValues(op.values || [], op.repeat);
  if (op.kind === 'prepend') return repeatValues(op.values || [], op.repeat).concat(Array.isArray(current) ? current : []);
  if (op.kind === 'insert' || op.kind === 'removeAt' || op.kind === 'moveItem' || op.kind === 'addToSet' || op.kind === 'pull' || op.kind === 'removeWhere') {
    return applyListMutationToValue(current, op);
  }
  if (op.kind === 'appendText') return typeof current === 'string' ? current + (op.text || '').repeat(op.repeat) : (op.text || '').repeat(op.repeat);
  if (op.kind === 'insertText' || op.kind === 'deleteText' || op.kind === 'replaceText') return applyTextMutationToValue(current, op);
  if (op.kind === 'formatText') return applyRichTextFormatMutation(current, op);
  return applyMutationToValue(current, op, []);
}

function applyCrdtOperation(
  tx: MutationCrdtTransaction,
  state: JsonValue,
  basePath: JsonPath,
  path: JsonPath,
  op: MutationOperation,
  decision: MutationCrdtPlannerDecision
): void {
  if (decision.strategy === 'noop') return;
  if (decision.strategy === 'native-counter') {
    if (op.kind === 'increment') tx.counter(path).increment((op.delta || 0) * op.repeat);
    else if (op.kind === 'decrement') tx.counter(path).decrement((op.delta || 0) * op.repeat);
    else applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }
  if (decision.strategy === 'native-text' || decision.strategy === 'native-text-splice') {
    applyNativeTextCrdtOperation(tx, state, path, op);
    return;
  }
  if (decision.strategy === 'native-list') {
    applyNativeListCrdtOperation(tx, state, path, op);
    return;
  }
  if (decision.strategy === 'native-map-field') {
    applyNativeMapFieldCrdtOperation(tx, state, path, op);
    return;
  }
  if (decision.strategy === 'native-delete') {
    tx.delete(path);
    return;
  }
  applyMaterializedCrdtOperation(tx, state, basePath, path, op);
}

function applyMaterializedCrdtOperation(
  tx: MutationCrdtTransaction,
  state: JsonValue,
  basePath: JsonPath,
  path: JsonPath,
  op: MutationOperation
): void {
  if (op.kind === 'toggle' && op.repeat % 2 === 0) return;
  if (op.kind === 'test') {
    assertMutationExpected(readPath(state, path), op.expected as JsonValue, path);
    return;
  }
  if (op.kind === 'copy') {
    tx.set(resolveOperationToPath(basePath, op), cloneJson(readRequiredPath(state, path)));
    return;
  }
  if (op.kind === 'move') {
    const to = resolveOperationToPath(basePath, op);
    tx.set(to, cloneJson(readRequiredPath(state, path)));
    tx.delete(path);
    return;
  }
  if (op.kind === 'rename') {
    const to = renameTargetPath(path, op);
    tx.set(to, cloneJson(readRequiredPath(state, path)));
    tx.delete(path);
    return;
  }
  if (isRemoveOperation(op)) {
    tx.delete(path);
    return;
  }
  const current = readPath(state, path);
  if (op.kind === 'ensure' && current !== undefined) return;
  tx.set(path, cloneJson(applyFieldMutation(current, op, path)));
}

function applyNativeTextCrdtOperation(
  tx: MutationCrdtTransaction,
  state: JsonValue,
  path: JsonPath,
  op: MutationOperation
): void {
  const current = readPath(state, path);
  if (typeof current !== 'string') {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }

  const handle = tx.text(path);
  if (isTextAppendOperation(op)) {
    const text = (op.text || '').repeat(op.repeat);
    if (text.length !== 0) handle.insert(Array.from(current).length, text);
    return;
  }

  if (!isTextSpliceOperation(op)) {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }

  let text = current;
  for (let i = 0; i < op.repeat; i++) {
    const start = boundedIndex(op.start || 0, text.length);
    const deleteCount = Math.min(op.deleteCount || 0, text.length - start);
    const insert = textInsertForOperation(op);
    if (deleteCount !== 0 || insert.length !== 0) handle.splice(start, deleteCount, insert);
    text = text.slice(0, start) + insert + text.slice(start + deleteCount);
  }
}

function applyNativeListCrdtOperation(
  tx: MutationCrdtTransaction,
  state: JsonValue,
  path: JsonPath,
  op: MutationOperation
): void {
  const current = readPath(state, path);
  if (!Array.isArray(current)) {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }

  const handle = tx.list(path);
  if (op.kind === 'append') {
    const values = repeatValues(op.values || [], op.repeat);
    if (values.length !== 0) handle.insert(current.length, values);
    return;
  }
  if (op.kind === 'prepend') {
    const values = repeatValues(op.values || [], op.repeat);
    if (values.length !== 0) handle.insert(0, values);
    return;
  }
  if (op.kind === 'insert') {
    const values = repeatValues(op.values || [], op.repeat);
    if (values.length !== 0) handle.insert(boundedIndex(op.start || 0, current.length), values);
    return;
  }
  if (op.kind === 'removeAt') {
    const start = boundedIndex(op.start || 0, current.length);
    const deleteCount = Math.min((op.deleteCount || 0) * op.repeat, current.length - start);
    if (deleteCount !== 0) handle.delete(start, deleteCount);
    return;
  }
  if (op.kind === 'moveItem') {
    const count = op.deleteCount || 1;
    if (count !== 0) handle.move(boundedIndex(op.start || 0, current.length), boundedIndex(op.toIndex || 0, current.length), count);
    return;
  }

  if (op.kind !== 'splice') {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }

  const array = cloneJson(current) as JsonValue[];
  for (let i = 0; i < op.repeat; i++) {
    const start = boundedIndex(op.start || 0, array.length);
    const deleteCount = Math.min(op.deleteCount || 0, array.length - start);
    const values = cloneJson(op.values || []) as JsonValue[];
    if (deleteCount !== 0) handle.delete(start, deleteCount);
    if (values.length !== 0) handle.insert(start, values);
    array.splice(start, deleteCount, ...values);
  }
}

function applyNativeMapFieldCrdtOperation(
  tx: MutationCrdtTransaction,
  state: JsonValue,
  path: JsonPath,
  op: MutationOperation
): void {
  if (op.kind === 'assign') {
    const current = readPath(state, path);
    if (!isObjectRecord(current) || !isObjectRecord(op.value)) {
      applyMaterializedCrdtOperation(tx, state, [], path, op);
      return;
    }
    const map = tx.map(path);
    const value = cloneJson(op.value) as JsonObject;
    for (const key of Object.keys(value)) map.set(key, value[key] as JsonValue);
    return;
  }

  if (path.length === 0 || !isMapFieldMutationOperation(op)) {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }

  const key = path[path.length - 1];
  if (typeof key !== 'string' && typeof key !== 'number') {
    applyMaterializedCrdtOperation(tx, state, [], path, op);
    return;
  }
  tx.map(path.slice(0, -1)).set(key, cloneJson(applyFieldMutation(readPath(state, path), op, path)));
}

function canUseNativeCrdtCounter(path: JsonPath, operationCount: number, materializedWrites: JsonPath[]): boolean {
  return (path.length !== 1 || operationCount === 1) && !hasOverlappingPath(materializedWrites, path);
}

function canUseNativeCrdtText(
  state: JsonValue,
  path: JsonPath,
  op: MutationOperation,
  materializedWrites: JsonPath[],
  nativeSequenceWrites: JsonPath[],
  nativeSequenceBackings: NativeCrdtSequenceBackings
): boolean {
  const current = readPath(state, path);
  if (typeof current !== 'string' || hasOverlappingPath(materializedWrites, path)) return false;
  if (hasNonExactOverlappingPath(nativeSequenceWrites, path)) return false;
  if (!hasUsableNativeCrdtSequenceBacking(nativeSequenceBackings.text, path, current.length)) return false;
  return !isTextSpliceOperation(op) || (isCodeUnitStableText(current) && isCodeUnitStableText(op.text || ''));
}

function canUseNativeCrdtList(
  state: JsonValue,
  path: JsonPath,
  materializedWrites: JsonPath[],
  nativeSequenceWrites: JsonPath[],
  nativeSequenceBackings: NativeCrdtSequenceBackings
): boolean {
  const current = readPath(state, path);
  return Array.isArray(current) &&
    !hasOverlappingPath(materializedWrites, path) &&
    !hasNonExactOverlappingPath(nativeSequenceWrites, path) &&
    hasUsableNativeCrdtSequenceBacking(nativeSequenceBackings.list, path, current.length);
}

function canUseNativeCrdtMapField(
  state: JsonValue,
  path: JsonPath,
  op: MutationOperation,
  assignmentPolicy: MutationCrdtAssignmentPolicy,
  materializedWrites: JsonPath[],
  nativeSequenceWrites: JsonPath[]
): boolean {
  if (assignmentPolicy !== 'preserve-conflicts') return false;
  if (!isMapFieldMutationOperation(op)) return false;
  if (hasOverlappingPath(materializedWrites, path) || hasOverlappingPath(nativeSequenceWrites, path)) return false;
  if (op.kind === 'assign') return isObjectRecord(readPath(state, path)) && isObjectRecord(op.value);
  if (path.length === 0) return false;
  return isObjectRecord(readPath(state, path.slice(0, -1)));
}

function trackCrdtWrite(
  materializedWrites: JsonPath[],
  nativeSequenceWrites: JsonPath[],
  path: JsonPath,
  op: MutationOperation,
  decision: MutationCrdtPlannerDecision
): void {
  if (decision.strategy === 'noop') return;
  if (isNativeSequenceCrdtDecisionStrategy(decision.strategy)) nativeSequenceWrites.push(path.slice());
  else if (decision.strategy === 'native-delete') materializedWrites.push(path.slice());
  else if (decision.strategy === 'native-map-field' && op.kind === 'assign' && isObjectRecord(op.value)) {
    for (const key of Object.keys(op.value)) materializedWrites.push(path.concat(key));
  } else {
    materializedWrites.push(path.slice());
  }
}

function isNativeSequenceCrdtDecisionStrategy(strategy: MutationCrdtDecisionStrategy): boolean {
  return strategy === 'native-counter' ||
    strategy === 'native-text' ||
    strategy === 'native-text-splice' ||
    strategy === 'native-list';
}

function collectNativeCrdtSequenceBackings(doc: MutationCrdtDocument): NativeCrdtSequenceBackings {
  const backings: NativeCrdtSequenceBackings = { list: [], text: [] };
  const operations = doc.changesSince(null) as Array<{ type: string; path: JsonPath; keys?: string[] }>;
  for (const op of operations) {
    if (isListCrdtOperation(op)) {
      addExactPath(backings.list, op.path);
    } else if (isTextCrdtOperation(op)) {
      addExactPath(backings.text, op.path);
    } else if (op.type === 'set' || op.type === 'del') {
      removeOverlappingPaths(backings.list, op.path);
      removeOverlappingPaths(backings.text, op.path);
    } else if (op.type === 'mapSetRun' && op.keys !== undefined) {
      for (const key of op.keys) {
        const fieldPath = op.path.concat(key);
        removeOverlappingPaths(backings.list, fieldPath);
        removeOverlappingPaths(backings.text, fieldPath);
      }
    }
  }
  return backings;
}

function isListCrdtOperation(op: { type: string }): boolean {
  return op.type === 'listInsert' || op.type === 'listRun' || op.type === 'listDel';
}

function isTextCrdtOperation(op: { type: string }): boolean {
  return op.type === 'textInsert' || op.type === 'textRun' || op.type === 'textDel' || op.type === 'textDelRange';
}

function hasUsableNativeCrdtSequenceBacking(
  backedPaths: JsonPath[],
  path: JsonPath,
  currentLength: number
): boolean {
  return currentLength === 0 || hasExactPath(backedPaths, path);
}

function addExactPath(paths: JsonPath[], path: JsonPath): void {
  if (!hasExactPath(paths, path)) paths.push(path.slice());
}

function hasExactPath(paths: JsonPath[], path: JsonPath): boolean {
  for (const existing of paths) {
    if (samePath(existing, path)) return true;
  }
  return false;
}

function removeOverlappingPaths(paths: JsonPath[], path: JsonPath): void {
  for (let i = paths.length - 1; i >= 0; i--) {
    const existing = paths[i];
    if (samePath(existing, path) || isPathPrefix(existing, path) || isPathPrefix(path, existing)) paths.splice(i, 1);
  }
}

function hasOverlappingPath(paths: JsonPath[], path: JsonPath): boolean {
  for (const existing of paths) {
    if (samePath(existing, path) || isPathPrefix(existing, path) || isPathPrefix(path, existing)) return true;
  }
  return false;
}

function hasNonExactOverlappingPath(paths: JsonPath[], path: JsonPath): boolean {
  for (const existing of paths) {
    if (!samePath(existing, path) && (isPathPrefix(existing, path) || isPathPrefix(path, existing))) return true;
  }
  return false;
}

function applyNumericMutation(current: JsonValue | undefined, op: MutationOperation): number {
  const base = typeof current === 'number' && Number.isFinite(current) ? current : 0;
  const sign = op.kind === 'decrement' ? -1 : 1;
  return base + sign * (op.delta || 0) * op.repeat;
}

function applyMutationToValue(current: JsonValue | undefined, op: MutationOperation, warnings: string[]): JsonValue {
  if (op.kind === 'splice') {
    const array = Array.isArray(current) ? (cloneJson(current) as JsonValue[]) : [];
    for (let i = 0; i < op.repeat; i++) array.splice(op.start || 0, op.deleteCount || 0, ...cloneJson(op.values || []) as JsonValue[]);
    return array;
  }
  if (op.kind === 'spliceText') {
    let text = typeof current === 'string' ? current : '';
    for (let i = 0; i < op.repeat; i++) {
      const start = Math.min(op.start || 0, text.length);
      text = text.slice(0, start) + (op.text || '') + text.slice(start + (op.deleteCount || 0));
    }
    return text;
  }
  warnings.push('unsupported materialized mutation kind: ' + op.kind);
  return current === undefined ? null : cloneJson(current);
}

function makeValueOperation(kind: MutationOperationKind, path: JsonPath, value: JsonValue | MutationValueFactory): MutationOperation {
  if (typeof value === 'function') return { kind, path, factory: value, repeat: 1 };
  return { kind, path, value, repeat: 1 };
}

function readOperationValue(op: MutationOperation, current: JsonValue | undefined, path: JsonPath): JsonValue {
  return op.factory === undefined
    ? cloneJson(op.value as JsonValue)
    : cloneJson(op.factory(current, path.slice()));
}

function applyUpsertMutation(current: JsonValue | undefined, op: MutationOperation, path: JsonPath): JsonValue {
  const value = readOperationValue(op, current, path);
  return isObjectRecord(current) && isObjectRecord(value)
    ? { ...current, ...value }
    : value;
}

function applyAdvancedNumericMutation(current: JsonValue | undefined, op: MutationOperation): number {
  let value = typeof current === 'number' && Number.isFinite(current) ? current : 0;
  for (let i = 0; i < op.repeat; i++) {
    if (op.kind === 'multiply') value *= op.delta as number;
    else if (op.kind === 'min') value = Math.min(value, op.delta as number);
    else if (op.kind === 'max') value = Math.max(value, op.delta as number);
    else if (op.kind === 'clamp') value = Math.min(Math.max(value, op.min as number), op.max as number);
  }
  return value;
}

function applyListMutationToValue(current: JsonValue | undefined, op: MutationOperation): JsonValue[] {
  const array = Array.isArray(current) ? cloneJson(current) as JsonValue[] : [];
  if (op.kind === 'addToSet') return array.concat(addToSetValues(array, op));
  if (op.kind === 'pull') return array.filter((value) => !(op.values || []).some((candidate) => jsonEqual(value, candidate)));
  if (op.kind === 'removeWhere') return array.filter((value, index) => !(op.predicate as MutationArrayPredicate)(value, index, array));
  for (let i = 0; i < op.repeat; i++) {
    if (op.kind === 'prepend') {
      array.splice(0, 0, ...cloneJson(op.values || []) as JsonValue[]);
    } else if (op.kind === 'insert') {
      array.splice(boundedIndex(op.start || 0, array.length), 0, ...cloneJson(op.values || []) as JsonValue[]);
    } else if (op.kind === 'removeAt') {
      const start = boundedIndex(op.start || 0, array.length);
      array.splice(start, Math.min(op.deleteCount || 0, array.length - start));
    } else if (op.kind === 'moveItem') {
      moveArrayItems(array, boundedIndex(op.start || 0, array.length), boundedIndex(op.toIndex || 0, array.length), op.deleteCount || 1);
    } else if (op.kind === 'splice') {
      array.splice(boundedIndex(op.start || 0, array.length), op.deleteCount || 0, ...cloneJson(op.values || []) as JsonValue[]);
    }
  }
  return array;
}

function applyTextMutationToValue(current: JsonValue | undefined, op: MutationOperation): string {
  let text = typeof current === 'string' ? current : '';
  if (isTextAppendOperation(op)) return text + (op.text || '').repeat(op.repeat);
  for (let i = 0; i < op.repeat; i++) {
    const start = boundedIndex(op.start || 0, text.length);
    const deleteCount = Math.min(op.deleteCount || 0, text.length - start);
    text = text.slice(0, start) + textInsertForOperation(op) + text.slice(start + deleteCount);
  }
  return text;
}

function applyRichTextFormatMutation(current: JsonValue | undefined, op: MutationOperation): JsonValue {
  const attributes = cloneJson(op.attributes || {}) as JsonObject;
  const value = isObjectRecord(current) && typeof current.text === 'string'
    ? cloneJson(current) as JsonObject
    : { text: typeof current === 'string' ? current : '' };
  const length = op.length || 0;
  if (length === 0 || Object.keys(attributes).length === 0) return value;
  const spans = Array.isArray(value.spans) ? cloneJson(value.spans) as JsonValue[] : [];
  spans.push({
    start: op.start || 0,
    end: (op.start || 0) + length,
    attributes
  } as JsonObject);
  value.spans = spans;
  return value;
}

function listSpliceArgs(current: JsonValue | undefined, op: MutationOperation): { start: number; deleteCount: number; values: JsonValue[] } {
  const length = Array.isArray(current) ? current.length : 0;
  if (op.kind === 'prepend') return { start: 0, deleteCount: 0, values: repeatValues(op.values || [], op.repeat) };
  if (op.kind === 'insert') return { start: boundedIndex(op.start || 0, length), deleteCount: 0, values: repeatValues(op.values || [], op.repeat) };
  if (op.kind === 'removeAt') {
    const start = boundedIndex(op.start || 0, length);
    return { start, deleteCount: Math.min((op.deleteCount || 0) * op.repeat, length - start), values: [] };
  }
  const start = boundedIndex(op.start || 0, length);
  return { start, deleteCount: Math.min(op.deleteCount || 0, length - start), values: repeatValues(op.values || [], op.repeat) };
}

function addToSetValues(current: JsonValue | undefined, op: MutationOperation): JsonValue[] {
  const existing = Array.isArray(current) ? current : [];
  const out: JsonValue[] = [];
  for (let i = 0; i < op.repeat; i++) {
    for (const value of op.values || []) {
      if (existing.some((item) => jsonEqual(item, value)) || out.some((item) => jsonEqual(item, value))) continue;
      out.push(cloneJson(value));
    }
  }
  return out;
}

function moveArrayItems(array: JsonValue[], from: number, to: number, count: number): void {
  if (count === 0 || from === to || from >= array.length) return;
  const deleteCount = Math.min(count, array.length - from);
  const values = array.splice(from, deleteCount);
  array.splice(boundedIndex(to, array.length), 0, ...values);
}

function textStartForOperation(current: JsonValue | undefined, op: MutationOperation): number {
  const length = typeof current === 'string' ? current.length : 0;
  if (isTextAppendOperation(op)) return length;
  return boundedIndex(op.start || 0, length);
}

function textDeleteCountForOperation(current: JsonValue | undefined, op: MutationOperation, start: number): number {
  const length = typeof current === 'string' ? current.length : 0;
  return Math.min(op.deleteCount || 0, Math.max(0, length - start));
}

function textInsertForOperation(op: MutationOperation): string {
  if (op.kind === 'appendText') return (op.text || '').repeat(op.repeat);
  return op.kind === 'deleteText' ? '' : op.text || '';
}

function isTextAppendOperation(op: MutationOperation): boolean {
  return op.kind === 'appendText';
}

function isTextSpliceOperation(op: MutationOperation): boolean {
  return op.kind === 'spliceText' || op.kind === 'insertText' || op.kind === 'deleteText' || op.kind === 'replaceText';
}

function isListInsertOperation(op: MutationOperation): boolean {
  return op.kind === 'prepend' || op.kind === 'insert';
}

function isListSpliceOperation(op: MutationOperation): boolean {
  return op.kind === 'splice' || op.kind === 'removeAt';
}

function isNativeListCandidateOperation(op: MutationOperation): boolean {
  return op.kind === 'append' ||
    op.kind === 'prepend' ||
    op.kind === 'splice' ||
    op.kind === 'insert' ||
    op.kind === 'removeAt' ||
    op.kind === 'moveItem';
}

function isRemoveOperation(op: MutationOperation): boolean {
  return op.kind === 'remove' || op.kind === 'unset';
}

function resolveOperationToPath(basePath: JsonPath, op: MutationOperation): JsonPath {
  if (op.to === undefined) throw new TypeError(op.kind + ' requires a target path');
  return basePath.concat(op.to);
}

function renameTargetPath(path: JsonPath, op: MutationOperation): JsonPath {
  if (path.length === 0) throw new TypeError('cannot rename the root value');
  return path.slice(0, -1).concat(op.key as ObjectKey);
}

function mutationDirtyPaths(basePath: JsonPath, path: JsonPath, op: MutationOperation): JsonPath[] {
  if (op.kind === 'test') return [];
  if (op.kind === 'copy') return [resolveOperationToPath(basePath, op)];
  if (op.kind === 'move') return pathsEqualOrPair(path, resolveOperationToPath(basePath, op));
  if (op.kind === 'rename') return pathsEqualOrPair(path, renameTargetPath(path, op));
  if (op.kind === 'ensure') return [path.slice()];
  return [path.slice()];
}

function pathsEqualOrPair(left: JsonPath, right: JsonPath): JsonPath[] {
  return samePath(left, right) ? [left.slice()] : [left.slice(), right.slice()];
}

function emitRemovePatch(source: JsonValue, path: JsonPath, patch: Patch): void {
  if (path.length === 0) throw new TypeError('cannot remove the root value');
  const parentPath = path.slice(0, -1);
  const key = path[path.length - 1];
  const parent = readPath(source, parentPath);
  if (Array.isArray(parent) && typeof key === 'number') {
    patch.push([OP_ARRAY_SPLICE, parentPath, boundedIndex(key, parent.length), key < parent.length ? 1 : 0, []]);
  } else {
    patch.push([OP_REMOVE, path.slice()]);
  }
}

function emitMovePatch(source: JsonValue, from: JsonPath, to: JsonPath, patch: Patch): void {
  if (samePath(from, to)) return;
  if (from.length === 0) throw new TypeError('cannot move the root value');
  if (isPathPrefix(from, to)) throw new TypeError('cannot move a value into its own descendant');
  const fromParent = from.slice(0, -1);
  const toParent = to.slice(0, -1);
  const fromKey = from[from.length - 1];
  const toKey = to[to.length - 1];
  const sourceParent = readPath(source, fromParent);
  if (Array.isArray(sourceParent) && samePath(fromParent, toParent) && typeof fromKey === 'number' && typeof toKey === 'number') {
    patch.push([OP_ARRAY_MOVE, fromParent, boundedIndex(fromKey, sourceParent.length), boundedIndex(toKey, sourceParent.length)]);
    return;
  }
  patch.push([OP_SET, to.slice(), cloneJson(readRequiredPath(source, from))]);
  emitRemovePatch(source, from, patch);
}

function setPathInWorking(working: JsonValue, path: JsonPath, value: JsonValue): JsonValue {
  return applyPatch(working, [[OP_SET, path.slice(), cloneJson(value)]]);
}

function removePathFromWorking(working: JsonValue, path: JsonPath): JsonValue {
  const patch: Patch = [];
  emitRemovePatch(working, path, patch);
  return patch.length === 0 ? working : applyPatch(working, patch);
}

function movePathInWorking(working: JsonValue, from: JsonPath, to: JsonPath): JsonValue {
  const patch: Patch = [];
  emitMovePatch(working, from, to, patch);
  return patch.length === 0 ? working : applyPatch(working, patch, { cloneValues: true });
}

function assertMutationExpected(actual: JsonValue | undefined, expected: JsonValue, path: JsonPath): void {
  if (!jsonEqual(actual, expected)) {
    throw new TypeError('mutation precondition failed at ' + JSON.stringify(path));
  }
}

function jsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) {
      if (!jsonEqual(left[i], right[i])) return false;
    }
    return true;
  }
  if (isObjectRecord(left) || isObjectRecord(right)) {
    if (!isObjectRecord(left) || !isObjectRecord(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key) || !jsonEqual(left[key], right[key])) return false;
    }
    return true;
  }
  return false;
}

function createMutationRuntime(schema: NormalizedMutationSchema): MutationRuntimeContext {
  const tables = new Map<string, MutationRuntimeTableState>();
  for (const table of schema.tables) {
    tables.set(pathCacheKey(table.path), {
      schema: table,
      version: 0,
      keyIndexVersion: -1
    });
  }
  return { schema, tables, selectorCache: [] };
}

function resolveSelector(source: JsonValue, selector: SelectorPlan, runtime?: MutationRuntimeContext): SelectorContext {
  const wildcardIndexes = readSelectorWildcardIndexes(selector.path);
  const firstWildcard = wildcardIndexes[0];
  const basePath = selector.path.slice(0, firstWildcard);
  const tailPath = wildcardIndexes.length === 1 ? selector.path.slice(firstWildcard + 1) : [];
  const collection = readPath(source, basePath);
  const tableState = runtime === undefined ? undefined : findSelectorTableState(runtime, selector, wildcardIndexes);
  const cached = runtime === undefined || tableState === undefined
    ? undefined
    : readCachedSelectorContext(runtime, tableState, selector);
  if (cached !== undefined) return cached;

  const matches: RowMatch[] = [];
  const state = { collectionSize: 0, usedIndex: false };

  walkSelectorPath(source, selector, source, [], 0, undefined, matches, state, tableState);
  applySelectorOrderingAndLimit(matches, selector);

  const context: SelectorContext = {
    selector,
    basePath,
    tailPath,
    collection: collection as JsonValue,
    collectionSize: state.collectionSize,
    wildcardCount: wildcardIndexes.length,
    matches,
    schema: tableState?.schema,
    usedIndex: state.usedIndex
  };
  if (runtime !== undefined && tableState !== undefined && canCacheSelectorContext(tableState.schema, selector)) {
    runtime.selectorCache.push({
      selector: cloneSelectorPlan(selector),
      tablePathKey: pathCacheKey(tableState.schema.path),
      version: tableState.version,
      context
    });
  }
  return context;
}

function findSelectorTableState(
  runtime: MutationRuntimeContext,
  selector: SelectorPlan,
  wildcardIndexes: number[]
): MutationRuntimeTableState | undefined {
  if (wildcardIndexes.length !== 1) return undefined;
  const tablePath = selector.path.slice(0, wildcardIndexes[0]);
  return runtime.tables.get(pathCacheKey(tablePath));
}

function readCachedSelectorContext(
  runtime: MutationRuntimeContext,
  tableState: MutationRuntimeTableState,
  selector: SelectorPlan
): SelectorContext | undefined {
  if (!canCacheSelectorContext(tableState.schema, selector)) return undefined;
  const tablePathKey = pathCacheKey(tableState.schema.path);
  for (const entry of runtime.selectorCache) {
    if (
      entry.version === tableState.version &&
      entry.tablePathKey === tablePathKey &&
      sameSelectorPlan(entry.selector, selector)
    ) {
      return { ...entry.context, usedCache: true, usedIndex: entry.context.usedIndex };
    }
  }
  return undefined;
}

function canCacheSelectorContext(schema: NormalizedMutationTableSchema, selector: SelectorPlan): boolean {
  if (!schema.stableRowShape || schema.selectorFields.length === 0) return false;
  const fields: JsonPath[] = [];
  collectSelectorConditionFields(selector.conditions, fields);
  for (const field of fields) {
    if (!schema.selectorFields.some((schemaField) => samePath(schemaField, field))) return false;
  }
  return true;
}

function noteSelectorMutation(runtime: MutationRuntimeContext, context: SelectorContext, op: MutationOperation): void {
  for (const match of context.matches) noteAbsoluteMutation(runtime, match.path.concat(op.path));
}

function noteAbsoluteMutation(runtime: MutationRuntimeContext, path: JsonPath): void {
  for (const tableState of runtime.tables.values()) {
    const rowField = readTableRowFieldPath(tableState.schema.path, path);
    if (rowField === undefined || tableMutationPreservesIndexesAndSelectors(tableState.schema, rowField)) continue;
    tableState.version++;
    tableState.keyIndex = undefined;
    tableState.keyIndexVersion = -1;
  }
}

function readTableRowFieldPath(tablePath: JsonPath, path: JsonPath): JsonPath | undefined {
  if (samePath(path, tablePath) || isPathPrefix(path, tablePath)) return [];
  if (!isPathPrefix(tablePath, path)) return undefined;
  const rest = path.slice(tablePath.length);
  if (rest.length < 2) return [];
  return rest.slice(1);
}

function tableMutationPreservesIndexesAndSelectors(schema: NormalizedMutationTableSchema, rowField: JsonPath): boolean {
  if (rowField.length === 0) return false;
  if (schema.key !== undefined && overlappingMutationPaths(rowField, schema.key)) return false;
  for (const field of schema.selectorFields) {
    if (overlappingMutationPaths(rowField, field)) return false;
  }
  return true;
}

function schemaFieldKind(schema: NormalizedMutationTableSchema, field: JsonPath): 'numeric' | 'text' | 'list' | undefined {
  if (schema.numericFields.some((candidate) => samePath(candidate, field))) return 'numeric';
  if (schema.textFields.some((candidate) => samePath(candidate, field))) return 'text';
  if (schema.listFields.some((candidate) => samePath(candidate, field))) return 'list';
  return undefined;
}

function readSelectorWildcardIndexes(path: JsonPath): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '*') indexes.push(i);
  }
  if (indexes.length === 0) throw new TypeError('selector path must contain at least one * segment');
  return indexes;
}

function walkSelectorPath(
  source: JsonValue | undefined,
  selector: SelectorPlan,
  value: JsonValue | undefined,
  absolutePath: JsonPath,
  pathIndex: number,
  meta: SelectorWalkMeta | undefined,
  matches: RowMatch[],
  state: { collectionSize: number; usedIndex: boolean },
  tableState?: MutationRuntimeTableState
): void {
  if (pathIndex >= selector.path.length) {
    if (matchesSelector(value, selector.conditions, meta)) {
      const fallback = meta === undefined ? readFallbackSelectorKey(absolutePath) : meta.key;
      matches.push({
        key: readSelectorMatchKey(value, selector, fallback, meta, tableState?.schema),
        rowIndex: meta?.rowIndex,
        mapKey: meta?.mapKey,
        value: value as JsonValue,
        path: absolutePath.slice()
      });
    }
    return;
  }

  const segment = selector.path[pathIndex];
  if (segment !== '*') {
    walkSelectorPath(source, selector, readPath(value, [segment]), absolutePath.concat(segment), pathIndex + 1, meta, matches, state, tableState);
    return;
  }

  const isFinalWildcard = selector.path.indexOf('*' as unknown as PathSegment, pathIndex + 1) === -1;
  state.collectionSize += isFinalWildcard ? collectionSizeOf(value as JsonValue) : 0;
  const candidateTableState = isFinalWildcard && tableState !== undefined && samePath(tableState.schema.path, absolutePath)
    ? tableState
    : undefined;
  const candidates = enumerateSelectorCandidates(value, selector, isFinalWildcard, candidateTableState, state);
  for (const candidate of candidates) {
    const nextMeta = isFinalWildcard
      ? { key: candidate.key, rowIndex: candidate.rowIndex, mapKey: candidate.mapKey }
      : meta;
    walkSelectorPath(source, selector, candidate.value, absolutePath.concat(candidate.key), pathIndex + 1, nextMeta, matches, state, tableState);
  }
}

function enumerateSelectorCandidates(
  collection: JsonValue | undefined,
  selector: SelectorPlan,
  useHints: boolean,
  tableState: MutationRuntimeTableState | undefined,
  state: { usedIndex: boolean }
): SelectorCandidate[] {
  if (Array.isArray(collection)) {
    const indexHint = useHints ? readArrayIndexHint(selector.conditions) : undefined;
    const indexedCandidates = indexHint === undefined && useHints
      ? enumerateArrayIndexedCandidates(collection, selector, tableState, state)
      : undefined;
    if (indexedCandidates !== undefined) return indexedCandidates;
    const indexes = indexHint === undefined ? makeArrayIndexes(collection.length) : indexHint;
    const out: SelectorCandidate[] = [];
    for (const index of indexes) {
      if (Number.isSafeInteger(index) && index >= 0 && index < collection.length) {
        out.push({ key: index, rowIndex: index, value: collection[index] });
      }
    }
    return out;
  }

  if (isObjectRecord(collection)) {
    const keyHint = useHints ? readObjectKeyHint(selector, collection, tableState?.schema) : undefined;
    if (keyHint !== undefined) state.usedIndex = true;
    const keys = keyHint === undefined ? Object.keys(collection) : keyHint;
    const out: SelectorCandidate[] = [];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(collection, key)) {
        out.push({ key, mapKey: key, value: collection[key] as JsonValue });
      }
    }
    return out;
  }

  return [];
}

function makeArrayIndexes(length: number): number[] {
  const indexes = new Array(length);
  for (let i = 0; i < length; i++) indexes[i] = i;
  return indexes;
}

function readSelectorIndexPath(selector: SelectorPlan, schema?: NormalizedMutationTableSchema): JsonPath | undefined {
  return selector.indexBy || selector.keyBy || schema?.key;
}

function readTableKeyIndex(tableState: MutationRuntimeTableState, collection: JsonValue[]): Map<ObjectKey, number[]> {
  if (tableState.keyIndex !== undefined && tableState.keyIndexVersion === tableState.version) return tableState.keyIndex;
  const index = new Map<ObjectKey, number[]>();
  const keyPath = tableState.schema.key;
  if (keyPath !== undefined) {
    for (let rowIndex = 0; rowIndex < collection.length; rowIndex++) {
      const key = readPath(collection[rowIndex], keyPath);
      if (typeof key !== 'string' && typeof key !== 'number') continue;
      const rows = index.get(key);
      if (rows === undefined) index.set(key, [rowIndex]);
      else rows.push(rowIndex);
    }
  }
  tableState.keyIndex = index;
  tableState.keyIndexVersion = tableState.version;
  return index;
}

function enumerateArrayIndexedCandidates(
  collection: JsonValue[],
  selector: SelectorPlan,
  tableState: MutationRuntimeTableState | undefined,
  state: { usedIndex: boolean }
): SelectorCandidate[] | undefined {
  const indexPath = readSelectorIndexPath(selector, tableState?.schema);
  if (indexPath === undefined || isSpecialSelectorPath(indexPath)) return undefined;
  const values = readSelectorEqualityHint(selector.conditions, indexPath);
  if (values === undefined) return undefined;

  if (tableState !== undefined && tableState.schema.key !== undefined && samePath(indexPath, tableState.schema.key)) {
    const index = readTableKeyIndex(tableState, collection);
    const out: SelectorCandidate[] = [];
    for (const value of values) {
      const rows = index.get(value);
      if (rows === undefined) continue;
      for (const rowIndex of rows) {
        if (rowIndex >= 0 && rowIndex < collection.length) {
          out.push({ key: rowIndex, rowIndex, value: collection[rowIndex] });
        }
      }
    }
    state.usedIndex = true;
    return out;
  }

  const out: SelectorCandidate[] = [];
  const valueSet = new Set<ObjectKey>(values);
  for (let index = 0; index < collection.length; index++) {
    const row = collection[index];
    const key = readPath(row, indexPath);
    if ((typeof key === 'string' || typeof key === 'number') && valueSet.has(key)) {
      out.push({ key: index, rowIndex: index, value: row });
    }
  }
  state.usedIndex = true;
  return out;
}

function readArrayIndexHint(conditions: readonly SelectorCondition[]): number[] | undefined {
  const values = readSelectorEqualityHint(conditions, ['$index']);
  if (values === undefined) return undefined;
  const indexes: number[] = [];
  for (const value of values) {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) indexes.push(value);
  }
  return indexes.length === 0 ? undefined : uniqueNumbers(indexes);
}

function readObjectKeyHint(
  selector: SelectorPlan,
  collection: JsonObject,
  schema?: NormalizedMutationTableSchema
): string[] | undefined {
  const keyValues = readSelectorEqualityHint(selector.conditions, ['$key']);
  if (keyValues !== undefined) return uniqueStrings(keyValues.map(String));

  const indexPath = readSelectorIndexPath(selector, schema);
  if (indexPath === undefined || isSpecialSelectorPath(indexPath)) return undefined;
  const indexValues = readSelectorEqualityHint(selector.conditions, indexPath);
  if (indexValues === undefined) return undefined;
  const keys = uniqueStrings(indexValues.map(String));
  return keys.some((key) => Object.prototype.hasOwnProperty.call(collection, key)) ? keys : undefined;
}

function readSelectorEqualityHint(conditions: readonly SelectorCondition[], field: JsonPath): ObjectKey[] | undefined {
  return readQueryConditionEqualityHint(conditions, field);
}

function readSelectorMatchKey(
  row: JsonValue | undefined,
  selector: SelectorPlan,
  fallback: ObjectKey,
  meta?: SelectorWalkMeta,
  schema?: NormalizedMutationTableSchema
): ObjectKey {
  const keyPath = selector.keyBy || schema?.key;
  if (keyPath === undefined) return fallback;
  const key = readSelectorConditionValue(row, keyPath, meta);
  return typeof key === 'string' || typeof key === 'number' ? key : fallback;
}

function readFallbackSelectorKey(path: JsonPath): ObjectKey {
  const key = path[path.length - 1];
  return typeof key === 'string' || typeof key === 'number' ? key : 0;
}

function matchesSelector(value: JsonValue | undefined, conditions: SelectorCondition[], meta?: SelectorWalkMeta): boolean {
  return matchesQueryConditions(value, conditions, meta);
}

function applySelectorOrderingAndLimit(matches: RowMatch[], selector: SelectorPlan): void {
  if (selector.orderBy !== undefined) {
    const { path, direction } = selector.orderBy;
    matches.sort((left, right) => compareJsonValues(
      readSelectorConditionValue(left.value, path, { key: left.key, rowIndex: left.rowIndex, mapKey: left.mapKey }),
      readSelectorConditionValue(right.value, path, { key: right.key, rowIndex: right.rowIndex, mapKey: right.mapKey }),
      direction
    ));
  }
  if (selector.limit !== undefined && matches.length > selector.limit) matches.length = selector.limit;
}

function compareJsonValues(left: JsonValue | undefined, right: JsonValue | undefined, direction: SelectorOrderDirection): number {
  const sign = direction === 'desc' ? -1 : 1;
  if (left === right) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  if (typeof left === 'number' && typeof right === 'number') return (left - right) * sign;
  return String(left).localeCompare(String(right)) * sign;
}

function makeSelectorMatchOut(match: RowMatch, selector: SelectorPlan): MutationSelectorMatch {
  const out: MutationSelectorMatch = { path: match.path.slice(), row: match.key };
  if (selector.project !== undefined) {
    const projection: JsonObject = {};
    for (const field of selector.project) {
      const value = readPath(match.value, field);
      if (value !== undefined) projection[field.join('.')] = cloneJson(value);
    }
    out.projection = projection;
  }
  return out;
}

function readSelectorConditionValue(value: JsonValue | undefined, field: JsonPath, meta?: SelectorWalkMeta): JsonValue | undefined {
  return readQueryConditionValue(value, field, meta);
}

function isSpecialSelectorPath(path: JsonPath): boolean {
  return isSpecialQueryPath(path);
}

function uniqueNumbers(values: number[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function readCondition(fieldOrCondition: MutationPath | SelectorCondition, op?: SelectorOperator, value?: JsonValue | JsonValue[]): SelectorCondition {
  return readQueryCondition(fieldOrCondition, op, value);
}

function normalizeOperation(op: MutationOperation): MutationOperation {
  return {
    ...op,
    path: op.path.slice(),
    to: op.to === undefined ? undefined : op.to.slice(),
    value: op.value === undefined ? undefined : cloneJson(op.value),
    expected: op.expected === undefined ? undefined : cloneJson(op.expected),
    values: op.values === undefined ? undefined : op.values.map((value) => cloneJson(value)),
    attributes: op.attributes === undefined ? undefined : cloneJson(op.attributes) as JsonObject,
    repeat: normalizeIndex(op.repeat, 'mutation repeat'),
    selector: op.selector === undefined ? undefined : cloneSelectorPlan(op.selector),
    transaction: op.transaction === undefined ? undefined : cloneTransactionInfo(op.transaction)
  };
}

function isNoopRepeat(op: MutationOperation): boolean {
  return op.kind === 'toggle' && op.repeat % 2 === 0;
}

function canUseRowFieldAssign(op: MutationOperation): boolean {
  return op.path.length > 0 && (
    op.kind === 'set' ||
    op.kind === 'upsert' ||
    op.kind === 'compareAndSet' ||
    op.kind === 'assign' ||
    op.kind === 'increment' ||
    op.kind === 'decrement' ||
    op.kind === 'multiply' ||
    op.kind === 'min' ||
    op.kind === 'max' ||
    op.kind === 'clamp' ||
    op.kind === 'toggle' ||
    op.kind === 'append' ||
    op.kind === 'prepend' ||
    op.kind === 'insert' ||
    op.kind === 'removeAt' ||
    op.kind === 'moveItem' ||
    op.kind === 'addToSet' ||
    op.kind === 'pull' ||
    op.kind === 'removeWhere' ||
    op.kind === 'appendText' ||
    op.kind === 'insertText' ||
    op.kind === 'deleteText' ||
    op.kind === 'replaceText' ||
    op.kind === 'formatText' ||
    op.kind === 'splice' ||
    op.kind === 'spliceText'
  );
}

function normalizePath(path: MutationPath | undefined, label: string): JsonPath {
  return normalizeQueryPath(path, label);
}

function normalizeSelectorName(name: string): string {
  if (typeof name !== 'string' || name.length === 0) throw new TypeError('selector name must be a non-empty string');
  return name;
}

function readPath(source: JsonValue | undefined, path: JsonPath): JsonValue | undefined {
  if (source === undefined) return undefined;
  try {
    return getPath(source, path);
  } catch {
    return undefined;
  }
}

function readRequiredPath(source: JsonValue | undefined, path: JsonPath): JsonValue {
  const value = readPath(source, path);
  if (value === undefined) throw new TypeError('missing value at ' + JSON.stringify(path));
  return value;
}

function cloneSelectorPlan(plan: SelectorPlan): SelectorPlan {
  return {
    path: plan.path.slice(),
    conditions: plan.conditions.map(cloneCondition),
    keyBy: plan.keyBy === undefined ? undefined : plan.keyBy.slice(),
    indexBy: plan.indexBy === undefined ? undefined : plan.indexBy.slice(),
    orderBy: plan.orderBy === undefined ? undefined : { path: plan.orderBy.path.slice(), direction: plan.orderBy.direction },
    limit: plan.limit,
    project: plan.project === undefined ? undefined : plan.project.map((path) => path.slice()),
    name: plan.name
  };
}

function cloneCondition(condition: SelectorCondition): SelectorCondition {
  return cloneQueryCondition(condition);
}

function normalizeTransactionInfo(options: MutationTransactionOptions): MutationTransactionInfo {
  const info: MutationTransactionInfo = {};
  if (options.origin !== undefined) {
    if (typeof options.origin !== 'string') throw new TypeError('transaction origin must be a string');
    info.origin = options.origin;
  }
  if (options.metadata !== undefined) {
    if (!isObjectRecord(options.metadata)) throw new TypeError('transaction metadata must be a JSON object');
    info.metadata = cloneJson(options.metadata) as JsonObject;
  }
  if (options.timestamp !== undefined) info.timestamp = normalizeFiniteNumber(options.timestamp, 'transaction timestamp');
  return info;
}

function cloneTransactionInfo(info: MutationTransactionInfo): MutationTransactionInfo {
  return {
    origin: info.origin,
    metadata: info.metadata === undefined ? undefined : cloneJson(info.metadata) as JsonObject,
    timestamp: info.timestamp
  };
}

function cloneMutationOperation(op: MutationOperation): MutationOperation {
  return {
    ...op,
    path: op.path.slice(),
    to: op.to === undefined ? undefined : op.to.slice(),
    value: op.value === undefined ? undefined : cloneJson(op.value),
    expected: op.expected === undefined ? undefined : cloneJson(op.expected),
    values: op.values === undefined ? undefined : op.values.map((value) => cloneJson(value)),
    attributes: op.attributes === undefined ? undefined : cloneJson(op.attributes) as JsonObject,
    selector: op.selector === undefined ? undefined : cloneSelectorPlan(op.selector),
    transaction: op.transaction === undefined ? undefined : cloneTransactionInfo(op.transaction)
  };
}

function internField(fields: JsonPath[], field: JsonPath): number {
  for (let i = 0; i < fields.length; i++) {
    if (samePath(fields[i], field)) return i;
  }
  fields.push(field.slice());
  return fields.length - 1;
}

function repeatValues(values: JsonValue[], repeat: number): JsonValue[] {
  const out: JsonValue[] = [];
  for (let i = 0; i < repeat; i++) {
    for (const value of values) out.push(cloneJson(value));
  }
  return out;
}

function isObjectRecord(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) throw new RangeError(label + ' must be a safe integer');
  return value;
}

function normalizeFiniteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(label + ' must be a finite number');
  return value;
}

function normalizeIndex(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(label + ' must be a non-negative safe integer');
  return value;
}

function boundedIndex(value: number, length: number): number {
  return value > length ? length : value;
}

function isCodeUnitStableText(text: string): boolean {
  return text.length === Array.from(text).length;
}

function pathCacheKey(path: JsonPath): string {
  return JSON.stringify(path);
}

function compareNumbers(left: number, right: number): number {
  return left - right;
}

function samePath(left: JsonPath, right: JsonPath): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function overlappingFieldPaths(left: JsonPath, right: JsonPath): boolean {
  return !samePath(left, right) && (isPathPrefix(left, right) || isPathPrefix(right, left));
}

function isPathPrefix(prefix: JsonPath, path: JsonPath): boolean {
  if (prefix.length >= path.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== path[i]) return false;
  }
  return true;
}

function sameNumberArray(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function sameSelectorPlan(left: SelectorPlan | undefined, right: SelectorPlan | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  return samePath(left.path, right.path) &&
    sameOptionalPath(left.keyBy, right.keyBy) &&
    sameOptionalPath(left.indexBy, right.indexBy) &&
    sameSelectorOrder(left.orderBy, right.orderBy) &&
    left.limit === right.limit &&
    sameOptionalPathList(left.project, right.project) &&
    JSON.stringify(left.conditions) === JSON.stringify(right.conditions);
}

function sameOptionalPath(left: JsonPath | undefined, right: JsonPath | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  return samePath(left, right);
}

function sameOptionalPathList(left: JsonPath[] | undefined, right: JsonPath[] | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (!samePath(left[i], right[i])) return false;
  }
  return true;
}

function sameSelectorOrder(
  left: SelectorPlan['orderBy'] | undefined,
  right: SelectorPlan['orderBy'] | undefined
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return left.direction === right.direction && samePath(left.path, right.path);
}

function sameTransactionInfo(left: MutationTransactionInfo | undefined, right: MutationTransactionInfo | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  return left.origin === right.origin &&
    left.timestamp === right.timestamp &&
    jsonEqual(left.metadata, right.metadata);
}
