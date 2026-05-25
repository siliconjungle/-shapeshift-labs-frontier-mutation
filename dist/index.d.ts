import { type DiffOptions, type JsonObject, type JsonPath, type JsonValue, type ObjectKey, type Patch } from '@shapeshift-labs/frontier';
export type MutationPath = string | JsonPath;
export interface MutationStateEngine {
    get(): JsonValue;
    commitPatch(patch: Patch): unknown;
}
export type MutationCrdtCommit = unknown;
export interface MutationCrdtDocument {
    toJSON(): JsonValue;
    change(callback: (tx: MutationCrdtTransaction) => void, options?: {
        metadata?: JsonObject;
    }): MutationCrdtCommit;
    changesSince(frontier: null | JsonValue): Array<{
        type: string;
        path: JsonPath;
        keys?: string[];
    }>;
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
export type SelectorOperator = '==' | 'eq' | '!=' | 'neq' | '>' | 'gt' | '>=' | 'gte' | '<' | 'lt' | '<=' | 'lte' | 'in' | 'exists';
export type SelectorOrderDirection = 'asc' | 'desc';
export type SelectorCondition = {
    field: MutationPath;
    op?: SelectorOperator;
    value?: JsonValue | JsonValue[];
    eq?: JsonValue;
    neq?: JsonValue;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    in?: JsonValue[];
    exists?: boolean;
} | {
    and: SelectorCondition[];
} | {
    or: SelectorCondition[];
} | {
    not: SelectorCondition;
};
export type MutationOperationKind = 'set' | 'unset' | 'remove' | 'ensure' | 'upsert' | 'assign' | 'increment' | 'decrement' | 'multiply' | 'min' | 'max' | 'clamp' | 'toggle' | 'append' | 'prepend' | 'splice' | 'insert' | 'removeAt' | 'moveItem' | 'addToSet' | 'pull' | 'removeWhere' | 'appendText' | 'spliceText' | 'insertText' | 'deleteText' | 'replaceText' | 'formatText' | 'move' | 'copy' | 'rename' | 'test' | 'compareAndSet';
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
    orderBy?: {
        path: JsonPath;
        direction: SelectorOrderDirection;
    };
    limit?: number;
    project?: JsonPath[];
    name?: string;
}
export interface MutationTableSchema {
    /** Path to an array table or object-map table, without the wildcard segment. */
    path: MutationPath;
    /** Stable row identity field. Used as default keyBy/indexBy for selectors over this table. */
    key?: MutationPath;
    /** Trusted claim that row objects have a stable field layout. */
    stableRowShape?: boolean;
    /** Fields known to contain numbers. */
    numericFields?: MutationPath[];
    /** Fields known to contain strings. */
    textFields?: MutationPath[];
    /** Fields known to contain arrays/lists. */
    listFields?: MutationPath[];
    /** Fields expected to participate in selector predicates for this table. */
    selectorFields?: MutationPath[];
}
export interface MutationShapeSchema {
    tables?: MutationTableSchema[];
    /** Alias for table-like entity collections. */
    entities?: MutationTableSchema[];
}
export type MutationSchemaInput = MutationShapeSchema | MutationTableSchema[];
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
export type MutationPatchStrategy = 'auto' | 'direct' | 'row-field' | 'dirty-diff' | 'materialize-diff';
export type MutationPlannerDecisionStrategy = 'direct' | 'row-field' | 'dirty-diff' | 'materialize-diff' | 'noop';
export type MutationCrdtStrategy = 'auto' | 'native' | 'materialize';
export type MutationCrdtDecisionStrategy = 'native-counter' | 'native-text' | 'native-text-splice' | 'native-list' | 'native-map-field' | 'native-delete' | 'materialized-set' | 'noop';
export type MutationCrdtAssignmentPolicy = 'preserve-conflicts' | 'last-write-wins' | 'materialize';
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
    dirtyRows: Array<{
        path: JsonPath;
        rows: number[];
        fields: JsonPath[];
    }>;
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
type SelectorRegistryInit = Record<string, SelectorBuilder | SelectorPlan> | Iterable<readonly [string, SelectorBuilder | SelectorPlan]>;
export declare class SelectorBuilder {
    private readonly plan;
    constructor(path: MutationPath);
    where(fieldOrCondition: MutationPath | SelectorCondition, op?: SelectorOperator, value?: JsonValue | JsonValue[]): this;
    and(fieldOrCondition: MutationPath | SelectorCondition, op?: SelectorOperator, value?: JsonValue | JsonValue[]): this;
    or(...conditions: SelectorCondition[]): this;
    not(condition: SelectorCondition): this;
    keyBy(key: MutationPath): this;
    indexBy(key?: MutationPath): this;
    orderBy(path: MutationPath, direction?: SelectorOrderDirection): this;
    limit(count: number): this;
    first(): this;
    project(...fields: MutationPath[]): this;
    named(name: string): this;
    toPlan(): SelectorPlan;
}
export declare class SelectorRegistry {
    private readonly selectors;
    constructor(initial?: SelectorRegistryInit);
    define(name: string, selector: SelectorBuilder | SelectorPlan): this;
    get(name: string): SelectorPlan;
    has(name: string): boolean;
    entries(): Array<[string, SelectorPlan]>;
}
export declare class MutationPlan implements MutationPlanLike {
    private readonly ops;
    private currentSelector;
    private readonly transactionStack;
    get operations(): readonly MutationOperation[];
    forEach(selector: SelectorBuilder | SelectorPlan, scope?: MutationPlanScope): this;
    where(path: MutationPath, condition?: SelectorCondition): this;
    clearSelector(): this;
    set(path: MutationPath, value: JsonValue): this;
    unset(path: MutationPath): this;
    remove(path: MutationPath): this;
    ensure(path: MutationPath, defaultValue: JsonValue | MutationValueFactory): this;
    upsert(path: MutationPath, value: JsonValue | MutationValueFactory): this;
    assign(path: MutationPath, value: JsonObject): this;
    increment(path: MutationPath, delta?: number): this;
    decrement(path: MutationPath, delta?: number): this;
    multiply(path: MutationPath, factor: number): this;
    min(path: MutationPath, value: number): this;
    max(path: MutationPath, value: number): this;
    clamp(path: MutationPath, min: number, max: number): this;
    toggle(path: MutationPath): this;
    append(path: MutationPath, values: JsonValue | JsonValue[]): this;
    prepend(path: MutationPath, values: JsonValue | JsonValue[]): this;
    splice(path: MutationPath, start: number, deleteCount: number, values?: JsonValue[]): this;
    insert(path: MutationPath, index: number, values: JsonValue | JsonValue[]): this;
    removeAt(path: MutationPath, index: number, count?: number): this;
    moveItem(path: MutationPath, fromIndex: number, toIndex: number, count?: number): this;
    addToSet(path: MutationPath, values: JsonValue | JsonValue[]): this;
    pull(path: MutationPath, values: JsonValue | JsonValue[]): this;
    removeWhere(path: MutationPath, predicate: MutationArrayPredicate): this;
    appendText(path: MutationPath, text: string): this;
    spliceText(path: MutationPath, start: number, deleteCount: number, text?: string): this;
    insertText(path: MutationPath, index: number, text: string): this;
    deleteText(path: MutationPath, index: number, count: number): this;
    replaceText(path: MutationPath, index: number, count: number, text: string): this;
    formatText(path: MutationPath, index: number, length: number, attributes: JsonObject): this;
    move(from: MutationPath, to: MutationPath): this;
    copy(from: MutationPath, to: MutationPath): this;
    rename(path: MutationPath, newKey: ObjectKey): this;
    test(path: MutationPath, expected: JsonValue): this;
    compareAndSet(path: MutationPath, expected: JsonValue, next: JsonValue | MutationValueFactory): this;
    transaction(scope: MutationPlanScope, options?: MutationTransactionOptions): this;
    repeat(count: number): this;
    compilePatch(state: JsonValue | undefined, options?: MutationCompileOptions): MutationCompileResult;
    commit(state: MutationStateEngine, options?: MutationCompileOptions): MutationCompileResult;
    commitCrdt(doc: MutationCrdtDocument, options?: MutationCompileOptions): MutationCrdtCommitResult;
    explain(state: JsonValue | undefined, options?: MutationCompileOptions): MutationPlanExplanation;
    private push;
}
export declare function select(path: MutationPath): SelectorBuilder;
export declare function createMutationPlan(): MutationPlan;
export declare function createSelectorRegistry(initial?: SelectorRegistryInit): SelectorRegistry;
export declare function compileMutationPlan(plan: MutationPlanLike, state: JsonValue | undefined, options?: MutationCompileOptions): MutationCompileResult;
export declare function commitMutation(state: MutationStateEngine, plan: MutationPlanLike, options?: MutationCompileOptions): MutationCompileResult;
export declare function commitCrdtMutation(doc: MutationCrdtDocument, plan: MutationPlanLike, options?: MutationCompileOptions): MutationCrdtCommitResult;
export {};
//# sourceMappingURL=index.d.ts.map