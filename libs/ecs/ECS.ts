// 重构原则：如无必要，勿增实体。
export module ECS {
    export interface IComponent {
        canRecycle: boolean;
        ent: Entity;

        init(): void;
    }

    export interface ComponentCtor<T> {
        new(): T;
        tid: number;
        componentName: string;
    }

    /**
     * 组件里面只放数据可能在实际写代码的时候比较麻烦。如果是单纯对组件内的数据操作可以在组件里面写方法。
     */
    export abstract class Component implements IComponent {
        /**
         * 组件的类型id，-1表示未给该组件分配id
         */
        static tid: number = -1;
        static componentName: string;
        /**
         * 拥有该组件的实体
         */
        ent!: Entity;

        /**
         * 是否可回收组件对象，默认情况下都是可回收的。
         * 如果该组件对象是由ecs系统外部创建的，则不可回收，需要用户自己手动进行回收。
         */
        canRecycle: boolean = true;

        /**
         * 组件被回收时会调用这个接口。可以在这里重置数据，或者解除引用。
         * 
         * **不要偷懒，除非你能确定并保证组件在复用时，里面的数据是先赋值然后再使用。**
         */
        abstract init(): void;
    }

    //#region 类型声明

    type ComponentAddOrRemove = (entity: Entity) => void;

    export type ComponentType<T> = ComponentCtor<T> | number;
    //#endregion

    //#region 注册组件

    /**
     * 组件缓存池
     */
    let componentPools: Map<number, IComponent[]> = new Map();

    /**
     * 组件类型id
     */
    let componentTid = 0;

    /**
     * 组件构造函数
     */
    let componentCtors: (ComponentCtor<any> | number)[] = [];

    /**
     * 每个组件的添加和删除的动作都要派送到“关心”它们的group上。goup对当前拥有或者之前（删除前）拥有该组件的实体进行组件规则判断。判断该实体是否满足group
     * 所期望的组件组合。
     */
    let componentAddOrRemove: Map<number, ComponentAddOrRemove[]> = new Map();

    let tags: Map<number, string> = new Map();

    /**
     * 注册组件到ecs系统中
     * @param compName 由于js打包会改变类名，所以这里必须手动传入组件的名称。
     * @param canNew 标识是否可以new对象。想继承自Cocos Creator的组件就不能去new，需要写成@ecs.register('name', false)
     */
    export function register<T>(compName: string, canNew: boolean = true) {
        return function (ctor: ComponentCtor<T>) {
            if (ctor.tid === -1) {
                ctor.tid = componentTid++;
                ctor.componentName = compName;
                if (canNew) {
                    componentCtors.push(ctor);
                    componentPools.set(ctor.tid, []);
                }
                else {
                    componentCtors.push(null);
                }
                componentAddOrRemove.set(ctor.tid, []);
            }
            else {
                throw new Error(`重复注册组件： ${compName}.`);
            }
        }
    }

    /**
     * 添加tag
     * 
     * eg.
     *      @registerTag()
     *      class Tag {
     *          static A: number;
     *          static B: number
     *      }
     * @returns 
     */
    export function registerTag() {
        return function (_class: any) {
            let tid = componentTid;
            for (let k in _class) {
                tid = componentTid++;
                _class[k] = tid;
                componentCtors.push(tid);
                componentPools.set(tid, []);
                componentAddOrRemove.set(tid, []);
                tags.set(tid, k);
            }
        }
    }
    //#endregion

    //#region context

    /**
     * 实体对象缓存池
     */
    let entityPool: Entity[] = [];

    /**
     * 通过实体id查找实体对象
     */
    let eid2Entity: Map<number, Entity> = new Map();

    /**
     * 缓存的group
     * 
     * key是组件的筛选规则，一个筛选规则对应一个group
     */
    let groups: Map<number, Group> = new Map();

    /**
     * 实体自增id
     */
    let eid = 1;

    /**
     * 创建实体
     */
    export function createEntity<E extends Entity = Entity>(): E {
        let entity = entityPool.pop();
        if (!entity) {
            entity = new Entity();
            // @ts-ignore
            entity.eid = eid++; // 实体id也是有限的资源
        }
        eid2Entity.set(entity.eid, entity);
        return entity as E;
    }

    /**
     * 创建组件对象
     * @param ctor
     */
    function createComp<T extends IComponent>(ctor: ComponentCtor<T>): T {
        if (!componentCtors[ctor.tid]) {
            throw Error(`没有找到该组件的构造函数，检查${ctor.componentName}是否为不可构造的组件`);
        }
        let component = componentPools.get(ctor.tid)!.pop() || new (componentCtors[ctor.tid] as ComponentCtor<T>);
        return component as T;
    }

    /**
     * 指定一个组件创建实体，返回组件对象。
     * @param ctor 
     */
    export function createEntityWithComp<T extends IComponent>(obj: T): Entity;
    export function createEntityWithComp(ctor: number): Entity;
    export function createEntityWithComp<T extends IComponent>(ctor: ComponentType<T>): T;
    // export function createEntityWithComp<T extends IComp>(ctor: CompCtor<T>): T;
    // export function createEntityWithComp<T extends IComp>(ctor: CompType<T> | T): T | Entity;
    export function createEntityWithComp<T extends IComponent>(ctor: ComponentType<T>): T | Entity {
        let entity = createEntity();
        return entity.add(ctor);
    }

    /**
     * 指定多个组件创建实体，返回实体对象。
     * @param ctors 
     */
    export function createEntityWithComps<E extends Entity = Entity>(...ctors: ComponentType<IComponent>[]): E {
        let entity = createEntity();
        entity.addComponents(...ctors);
        return entity as E;
    }

    /**
     * 销毁实体。
     * 
     * 缓存销毁的实体，下次新建实体时会优先从缓存中拿。
     * @param entity 
     */
    function destroyEntity(entity: Entity) {
        if (eid2Entity.has(entity.eid)) {
            entityPool.push(entity);
            eid2Entity.delete(entity.eid);
        }
        else {
            console.warn('试图销毁不存在的实体！');
        }
    }

    /**
     * 创建group，每个group只关心对应组件的添加和删除
     * @param matcher 实体筛选器
     */
    export function createGroup<E extends Entity = Entity>(matcher: IMatcher): Group<E> {
        let group = groups.get(matcher.mid);
        if (!group) {
            group = new Group(matcher);
            groups.set(matcher.mid, group);
            let careComponentTypeIds = matcher.indices;
            for (let i = 0; i < careComponentTypeIds.length; i++) {
                componentAddOrRemove.get(careComponentTypeIds[i])!.push(group.onComponentAddOrRemove.bind(group));
            }
        }
        return group as unknown as Group<E>;
    }

    /**
     * 动态查询实体
     * @param matcher 
     * @returns 
     */
    export function query<E extends Entity = Entity>(matcher: IMatcher): E[] {
        let group = groups.get(matcher.mid);
        if (!group) {
            group = createGroup(matcher);
            eid2Entity.forEach(group.onComponentAddOrRemove, group);
        }
        return group.matchEntities as E[];
    }

    /**
     * 清理所有的实体
     */
    export function clear() {
        eid2Entity.forEach((entity) => {
            entity.destroy();
        });
        groups.forEach((group) => {
            group.clear();
        });
        componentAddOrRemove.forEach(callbackLst => {
            callbackLst.length = 0;
        });
        eid2Entity.clear();
        groups.clear();
    }

    /**
     * 实体身上组件有增删操作，广播通知对应的观察者。
     * @param entity 实体对象
     * @param componentTypeId 组件类型id
     */
    function broadcastComponentAddOrRemove(entity: Entity, componentTypeId: number) {
        let events = componentAddOrRemove.get(componentTypeId);
        for (let i = events!.length - 1; i >= 0; i--) {
            events![i](entity);
        }
        // 判断是不是删了单例组件
        if (tid2comp.has(componentTypeId)) {
            tid2comp.delete(componentTypeId);
        }
    }

    /**
     * 根据实体id获得实体对象
     * @param eid 
     */
    export function getEntityByEid<E extends Entity = Entity>(eid: number): E {
        return eid2Entity.get(eid) as E;
    }

    /**
     * 当前活动中的实体数量
     */
    export function activeEntityCount() {
        return eid2Entity.size;
    }
    //#endregion


    /**
     * 表示只关心这些组件的添加和删除动作。虽然实体可能有这些组件之外的组件，但是它们的添加和删除没有被关注，所以不会存在对关注之外的组件
     * 进行添加操作引发Group重复添加实体。
     * @param args 
     */
    export function allOf(...args: ComponentType<IComponent>[]) {
        return new Matcher().allOf(...args);
    }

    /**
     * 组件间是或的关系，表示关注拥有任意一个这些组件的实体。
     * @param args 组件索引
     */
    export function anyOf(...args: ComponentType<IComponent>[]) {
        return new Matcher().anyOf(...args);
    }

    /**
     * 表示关注只拥有这些组件的实体
     * 
     * 注意：
     *  不是特殊情况不建议使用onlyOf。因为onlyOf会监听所有组件的添加和删除事件。
     * @param args 组件索引
     */
    export function onlyOf(...args: ComponentType<IComponent>[]) {
        return new Matcher().onlyOf(...args);
    }

    /**
     * 不包含指定的任意一个组件
     * 
     * eg.
     *  ecs.excludeOf(A, B);表示不包含组件A或者组件B
     * @param args 
     */
    export function excludeOf(...args: ComponentType<IComponent>[]) {
        return new Matcher().excludeOf(...args);
    }

    //#region 单例组件
    let tid2comp: Map<number, IComponent> = new Map();
    /**
     * 获取单例组件
     * @param ctor 组件类
     */
    export function getSingleton<T extends IComponent>(ctor: ComponentCtor<T>) {
        if (!tid2comp.has(ctor.tid)) {
            let component = createEntityWithComp(ctor) as T;
            tid2comp.set(ctor.tid, component);
        }
        return tid2comp.get(ctor.tid) as T;
    }

    /**
     * 注册单例。主要用于那些不能手动创建对象的组件
     * @param obj 
     */
    export function addSingleton(obj: IComponent) {
        let tid = (obj.constructor as ComponentCtor<IComponent>).tid;
        if (!tid2comp.has(tid)) {
            tid2comp.set(tid, obj);
        }
    }
    //#endregion

    class Mask {
        private mask: Uint32Array;
        private size: number = 0;

        constructor() {
            let length = Math.ceil(componentTid / 31);
            this.mask = new Uint32Array(length);
            this.size = length;
        }

        set(num: number) {
            // https://stackoverflow.com/questions/34896909/is-it-correct-to-set-bit-31-in-javascript
            // this.mask[((num / 32) >>> 0)] |= ((1 << (num % 32)) >>> 0);
            this.mask[((num / 31) >>> 0)] |= (1 << (num % 31));
        }

        delete(num: number) {
            this.mask[((num / 31) >>> 0)] &= ~(1 << (num % 31));
        }

        has(num: number) {
            return !!(this.mask[((num / 31) >>> 0)] & (1 << (num % 31)));
        }

        or(other: Mask) {
            for (let i = 0; i < this.size; i++) {
                // &操作符最大也只能对2^30进行操作，如果对2^31&2^31会得到负数。当然可以(2^31&2^31) >>> 0，这样多了一步右移操作。
                if (this.mask[i] & other.mask[i]) {
                    return true;
                }
            }
            return false;
        }

        and(other: Mask) {
            for (let i = 0; i < this.size; i++) {
                if ((this.mask[i] & other.mask[i]) != this.mask[i]) {
                    return false;
                }
            }
            return true;
        }

        clear() {
            for (let i = 0; i < this.size; i++) {
                this.mask[i] = 0;
            }
        }
    }
    export class Entity {
        /**
         * 实体唯一标识，不要手动修改。
         */
        public eid: number = -1;

        private mask = new Mask();

        /**
         * 当前实体身上附加的组件构造函数
         */
        private componentTid2Ctor: Map<number, ComponentType<IComponent>> = new Map();

        private componentTid2Obj: Map<number, IComponent> = new Map();

        constructor() { }

        /**
         * 根据组件id动态创建组件，并通知关心的系统。
         * 
         * 如果实体存在了这个组件，那么会先删除之前的组件然后添加新的。
         * 
         * 注意：不要直接new Component，new来的Component不会从Component的缓存池拿缓存的数据。
         * @param componentTypeId 组件id
         * @param isReAdd true-表示用户指定这个实体可能已经存在了该组件，那么再次add组件的时候会先移除该组件然后再添加一遍。false-表示不重复添加组件。
         */
        add<T extends IComponent>(obj: T): Entity;
        add(ctor: number, isReAdd?: boolean): Entity;
        // add<T extends IComp>(ctor: CompCtor<T>, isReAdd?: boolean): T;
        add<T extends IComponent>(ctor: ComponentType<T>, isReAdd?: boolean): T;
        add<T extends IComponent>(ctor: ComponentType<T> | T, isReAdd: boolean = false): T | Entity {
            // console.log('typeof: ', typeof ctor);
            if (typeof ctor === 'function') {
                let componentTid = ctor.tid;
                if (ctor.tid === -1) {
                    throw Error('组件未注册！');
                }
                if (this.componentTid2Ctor.has(componentTid)) {// 判断是否有该组件，如果有则先移除
                    if (isReAdd) {
                        this.remove(ctor);
                    }
                    else {
                        console.log(`已经存在组件：${ctor.componentName}`);
                        // @ts-ignore
                        return this[ctor.componentName] as T;
                    }
                }
                this.mask.set(componentTid);

                let component: T;
                if (this.componentTid2Obj.has(componentTid)) {
                    component = this.componentTid2Obj.get(componentTid) as T;
                    this.componentTid2Obj.delete(componentTid);
                }
                else {
                    // 创建组件对象
                    component = createComp(ctor) as T;
                }
                // 将组件对象直接附加到实体对象身上，方便直接获取。
                // @ts-ignore
                this[ctor.componentName] = component;
                this.componentTid2Ctor.set(componentTid, ctor);
                component.ent = this;
                // 广播实体添加组件的消息
                broadcastComponentAddOrRemove(this, componentTid);

                return component;
            }
            else if (typeof ctor === 'number') {
                if (tags.has(ctor)) {
                    this.mask.set(ctor);
                    this.componentTid2Ctor.set(ctor, ctor);
                    let tagName = tags.get(ctor)!;
                    // @ts-ignore
                    this[tagName] = ctor;
                    broadcastComponentAddOrRemove(this, ctor);
                }
                else {
                    throw Error('不存在的tag！');
                }
                return this;
            }
            else {
                let tmpCtor = (ctor.constructor as ComponentCtor<T>);
                let componentTid = tmpCtor.tid;
                // console.assert(compTid !== -1 || !compTid, '组件未注册！');
                // console.assert(this.compTid2Ctor.has(compTid), '已存在该组件！');
                if (componentTid === -1 || componentTid == null) {
                    throw Error('组件未注册！');
                }
                if (this.componentTid2Ctor.has(componentTid)) {
                    throw Error('已经存在该组件！');
                }

                this.mask.set(componentTid);
                this[tmpCtor.componentName] = ctor;
                this.componentTid2Ctor.set(componentTid, tmpCtor);
                ctor.ent = this;
                ctor.canRecycle = false;
                broadcastComponentAddOrRemove(this, componentTid);
                return this;
            }
        }

        addComponents<T extends IComponent>(...ctors: ComponentType<T>[]) {
            for (let ctor of ctors) {
                this.add(ctor);
            }
            return this;
        }

        get(ctor: number): number;
        get<T extends IComponent>(ctor: ComponentCtor<T>): T;
        get<T extends IComponent>(ctor: ComponentCtor<T> | number): T {
            let compName: string;
            if (typeof (ctor) === 'number') {
                compName = tags.get(ctor)!;
            }
            else {
                compName = ctor.componentName;
            }
            // @ts-ignore
            return this[compName];
        }

        has(ctor: ComponentType<IComponent>): boolean {
            if (typeof ctor == "number") {
                return this.mask.has(ctor);
            }
            else {
                return this.componentTid2Ctor.has(ctor.tid);
            }
        }

        /**
         * 
         * @param ctor 组件构造函数或者组件Tag
         * @param isRecycle 是否回收该组件对象。对于有些组件上有大量数据，当要描述移除组件但是不想清除组件上的数据是可以
         * 设置该参数为false，这样该组件对象会缓存在实体身上，下次重新添加组件时会将该组件对象添加回来，不会重新从组件缓存
         * 池中拿一个组件来用。
         */
        remove(ctor: ComponentType<IComponent>, isRecycle: boolean = true) {
            let componentTypeId = -1;
            let compName = '';
            let hasComp = false;
            if (typeof ctor === "number") {
                componentTypeId = ctor;
                if (this.mask.has(ctor)) {
                    hasComp = true;
                    compName = tags.get(ctor)!;
                }
            }
            else {
                componentTypeId = ctor.tid;
                compName = ctor.componentName;
                if (this.mask.has(componentTypeId)) {
                    hasComp = true;
                    let comp = this[ctor.componentName] as IComponent;
                    comp.ent = null;
                    if (isRecycle) {
                        comp.init();
                        if (comp.canRecycle) {
                            componentPools.get(componentTypeId).push(comp);
                        }
                    }
                    else {
                        this.componentTid2Obj.set(componentTypeId, comp);
                    }
                }
            }

            if (hasComp) {
                this[compName] = null;
                this.mask.delete(componentTypeId);
                this.componentTid2Ctor.delete(componentTypeId);
                broadcastComponentAddOrRemove(this, componentTypeId);
            }
        }

        private _remove(comp: ComponentType<IComponent>) {
            this.remove(comp, false);
        }

        /**
         * 销毁实体，实体会被回收到实体缓存池中。
         */
        destroy() {
            this.componentTid2Ctor.forEach(this._remove, this);
            destroyEntity(this);
            this.componentTid2Obj.clear();
        }
    }

    export class Group<E extends Entity = Entity> {
        /**
         * 实体筛选规则
         */
        private matcher: IMatcher;

        private _matchEntities: Map<number, E> = new Map();

        private _entitiesCache: E[] | null = null;

        /**
         * 符合规则的实体
         */
        public get matchEntities() {
            if (this._entitiesCache === null) {
                this._entitiesCache = Array.from(this._matchEntities.values());
            }
            return this._entitiesCache;
        }

        /**
         * 当前group中实体的数量。
         * 
         * 不要手动修改这个属性值。
         */
        public count = 0; // 其实可以通过this._matchEntities.size获得实体数量，但是需要封装get方法。为了减少一次方法的调用所以才直接创建一个count属性

        /**
         * 获取matchEntities中第一个实体
         */
        get entity(): E {
            return this.matchEntities[0];
        }

        private _enteredEntities: Map<number, E> | null = null;
        private _removedEntities: Map<number, E> | null = null;

        constructor(matcher: IMatcher) {
            this.matcher = matcher;
        }

        public onComponentAddOrRemove(entity: E) {
            if (this.matcher.isMatch(entity)) { // Group只关心指定组件在实体身上的添加和删除动作。
                this._matchEntities.set(entity.eid, entity);
                this._entitiesCache = null;
                this.count++;

                if (this._enteredEntities) {
                    this._enteredEntities.set(entity.eid, entity);
                    this._removedEntities!.delete(entity.eid);
                }
            }
            else if (this._matchEntities.has(entity.eid)) { // 如果Group中有这个实体，但是这个实体已经不满足匹配规则，则从Group中移除该实体
                this._matchEntities.delete(entity.eid);
                this._entitiesCache = null;
                this.count--;

                if (this._enteredEntities) {
                    this._enteredEntities.delete(entity.eid);
                    this._removedEntities!.set(entity.eid, entity);
                }
            }
        }

        public watchEntityEnterAndRemove(enteredEntities: Map<number, E>, removedEntities: Map<number, E>) {
            this._enteredEntities = enteredEntities;
            this._removedEntities = removedEntities;
        }

        clear() {
            this._matchEntities.clear();
            this._entitiesCache = null;
            this.count = 0;
            this._enteredEntities?.clear();
            this._removedEntities?.clear();
        }
    }

    abstract class BaseOf {
        protected mask = new Mask();
        public indices: number[] = [];
        constructor(...args: ComponentType<IComponent>[]) {
            let componentTypeId = -1;
            let len = args.length;
            for (let i = 0; i < len; i++) {
                if (typeof (args[i]) === "number") {
                    componentTypeId = args[i] as number;
                }
                else {
                    componentTypeId = (args[i] as ComponentCtor<IComponent>).tid;
                }
                if (componentTypeId == -1) {
                    throw Error('存在没有注册的组件！');
                }
                this.mask.set(componentTypeId);

                if (this.indices.indexOf(componentTypeId) < 0) { // 去重
                    this.indices.push(componentTypeId);
                }
            }
            if (len > 1) {
                this.indices.sort((a, b) => { return a - b; }); // 对组件类型id进行排序，这样关注相同组件的系统就能共用同一个group
            }
        }

        public toString(): string {
            return this.indices.join('-'); // 生成group的key
        }

        public abstract getKey(): string;

        public abstract isMatch(entity: Entity): boolean;
    }

    /**
     * 用于描述包含任意一个这些组件的实体
     */
    class AnyOf extends BaseOf {
        public isMatch(entity: Entity): boolean {
            // @ts-ignore
            return this.mask.or(entity.mask);
        }

        getKey(): string {
            return 'anyOf:' + this.toString();
        }
    }

    /**
     * 用于描述包含了“这些”组件的实体，这个实体除了包含这些组件还可以包含其他组件
     */
    class AllOf extends BaseOf {
        public isMatch(entity: Entity): boolean {
            // @ts-ignore
            return this.mask.and(entity.mask);
        }

        getKey(): string {
            return 'allOf:' + this.toString();
        }
    }

    /**
     * 不包含指定的任意一个组件
     */
    class ExcludeOf extends BaseOf {

        public getKey(): string {
            return 'excludeOf:' + this.toString();
        }

        public isMatch(entity: Entity): boolean {
            // @ts-ignore
            return !this.mask.or(entity.mask);
        }
    }

    export interface IMatcher {
        mid: number;
        indices: number[];
        key: string;
        isMatch(entity: Entity): boolean;
    }

    let macherId: number = 1;

    /**
     * 筛选规则间是“与”的关系
     * 比如：ecs.Macher.allOf(...).excludeOf(...)表达的是allOf && excludeOf，即实体有“这些组件” 并且 “没有这些组件”
     */
    class Matcher implements IMatcher {
        protected rules: BaseOf[] = [];
        protected _indices: number[] | null = null;
        public isMatch!: (entity: Entity) => boolean;
        public mid: number = -1;

        private _key: string | null = null;
        public get key(): string {
            if (!this._key) {
                let s = '';
                for (let i = 0; i < this.rules.length; i++) {
                    s += this.rules[i].getKey()
                    if (i < this.rules.length - 1) {
                        s += ' && '
                    }
                }
                this._key = s;
            }
            return this._key;
        }

        constructor() {
            this.mid = macherId++;
        }

        /**
         * 匹配器关注的组件索引。在创建Group时，Context根据组件id去给Group关联组件的添加和移除事件。
         */
        public get indices() {
            if (this._indices === null) {
                this._indices = [];
                this.rules.forEach((rule) => {
                    Array.prototype.push.apply(this._indices, rule.indices);
                });
            }
            return this._indices;
        }

        /**
         * 组件间是或的关系，表示关注拥有任意一个这些组件的实体。
         * @param args 组件索引
         */
        public anyOf(...args: ComponentType<IComponent>[]): Matcher {
            this.rules.push(new AnyOf(...args));
            this.bindMatchMethod();
            return this;
        }

        /**
         * 组件间是与的关系，表示关注拥有所有这些组件的实体。
         * @param args 组件索引
         */
        public allOf(...args: ComponentType<IComponent>[]): Matcher {
            this.rules.push(new AllOf(...args));
            this.bindMatchMethod();
            return this;
        }

        /**
         * 表示关注只拥有这些组件的实体
         * 
         * 注意：
         *  不是特殊情况不建议使用onlyOf。因为onlyOf会监听所有组件的添加和删除事件。
         * @param args 组件索引
         */
        public onlyOf(...args: ComponentType<IComponent>[]): Matcher {
            this.rules.push(new AllOf(...args));
            let otherTids: ComponentType<IComponent>[] = [];
            for (let ctor of componentCtors) {
                if (args.indexOf(ctor) < 0) {
                    otherTids.push(ctor);
                }
            }
            this.rules.push(new ExcludeOf(...otherTids));
            this.bindMatchMethod();
            return this;
        }

        /**
         * 不包含指定的任意一个组件
         * @param args 
         */
        public excludeOf(...args: ComponentType<IComponent>[]) {
            this.rules.push(new ExcludeOf(...args));
            this.bindMatchMethod();
            return this;
        }

        private bindMatchMethod() {
            if (this.rules.length === 1) {
                this.isMatch = this.isMatch1;
            }
            else if (this.rules.length === 2) {
                this.isMatch = this.isMatch2;
            }
            else {
                this.isMatch = this.isMatchMore;
            }
        }

        private isMatch1(entity: Entity): boolean {
            return this.rules[0].isMatch(entity);
        }

        private isMatch2(entity: Entity): boolean {
            return this.rules[0].isMatch(entity) && this.rules[1].isMatch(entity);
        }

        private isMatchMore(entity: Entity): boolean {
            for (let rule of this.rules) {
                if (!rule.isMatch(entity)) {
                    return false;
                }
            }
            return true;
        }

        public clone(): Matcher {
            let newMatcher = new Matcher();
            newMatcher.mid = macherId++;
            this.rules.forEach(rule => newMatcher.rules.push(rule));
            return newMatcher;
        }
    }

    //#region System
    /**
     * 如果需要监听实体首次进入System的情况，实现这个接口。
     * 
     * entityEnter会在update方法之前执行，实体进入后，不会再次进入entityEnter方法中。
     * 当实体从当前System移除，下次再次符合条件进入System也会执行上述流程。
     */
    export interface IEntityEnterSystem<E extends Entity = Entity> {
        entityEnter(entities: E[]): void;
    }

    /**
     * 如果需要监听实体从当前System移除，需要实现这个接口。
     */
    export interface IEntityRemoveSystem<E extends Entity = Entity> {
        entityRemove(entities: E[]): void;
    }

    /**
     * 第一次执行update
     */
    export interface ISystemFirstUpdate<E extends Entity = Entity> {
        firstUpdate(entities: E[]): void;
    }

    export abstract class ComblockSystem<E extends Entity = Entity> {
        protected group: Group<E>;
        protected dt: number = 0;

        private enteredEntities: Map<number, E> | null = null;
        private removedEntities: Map<number, E> | null = null;

        private hasEntityEnter: boolean = false;
        private hasEntityRemove: boolean = false;

        private tmpExecute: ((dt: number) => void) | null = null;
        private execute!: (dt: number) => void;

        constructor() {
            let hasOwnProperty = Object.hasOwnProperty;
            let prototype = Object.getPrototypeOf(this);
            let hasEntityEnter = hasOwnProperty.call(prototype, 'entityEnter');
            let hasEntityRemove = hasOwnProperty.call(prototype, 'entityRemove');
            let hasFirstUpdate = hasOwnProperty.call(prototype, 'firstUpdate');

            this.hasEntityEnter = hasEntityEnter;
            this.hasEntityRemove = hasEntityRemove;

            if (hasEntityEnter || hasEntityRemove) {
                this.enteredEntities = new Map<number, E>();
                this.removedEntities = new Map<number, E>();

                this.execute = this.execute1;
                this.group = createGroup(this.filter());
                this.group.watchEntityEnterAndRemove(this.enteredEntities, this.removedEntities);
            }
            else {
                this.execute = this.execute0;
                this.group = createGroup(this.filter());
            }

            if (hasFirstUpdate) {
                this.tmpExecute = this.execute;
                this.execute = this.updateOnce;
            }
        }

        init(): void {

        }

        onDestroy(): void {

        }

        hasEntity(): boolean {
            return this.group.count > 0;
        }

        private updateOnce(dt: number) {
            if (this.group.count === 0) {
                return;
            }
            this.dt = dt;
            // 处理刚进来的实体
            if (this.enteredEntities!.size > 0) {
                (this as unknown as IEntityEnterSystem).entityEnter(Array.from(this.enteredEntities!.values()) as E[]);
                this.enteredEntities!.clear();
            }
            (this as unknown as ISystemFirstUpdate).firstUpdate(this.group.matchEntities);
            this.execute = this.tmpExecute!;
            this.execute(dt);
            this.tmpExecute = null;
        }

        /**
         * 只执行update
         * @param dt 
         * @returns 
         */
        private execute0(dt: number): void {
            if (this.group.count === 0) {
                return;
            }
            this.dt = dt;
            this.update(this.group.matchEntities);
        }

        /**
         * 先执行entityRemove，再执行entityEnter，最后执行update。
         * @param dt 
         * @returns 
         */
        private execute1(dt: number): void {
            if (this.removedEntities!.size > 0) {
                if (this.hasEntityRemove) {
                    (this as unknown as IEntityRemoveSystem).entityRemove(Array.from(this.removedEntities!.values()) as E[]);
                }
                this.removedEntities!.clear();
            }
            if (this.group.count === 0) {
                return;
            }
            this.dt = dt;
            // 处理刚进来的实体
            if (this.enteredEntities!.size > 0) {
                if (this.hasEntityEnter) {
                    (this as unknown as IEntityEnterSystem).entityEnter(Array.from(this.enteredEntities!.values()) as E[]);
                }
                this.enteredEntities!.clear();
            }
            this.update(this.group.matchEntities as E[]);
        }

        /**
         * 实体过滤规则
         * 
         * 根据提供的组件过滤实体。
         */
        abstract filter(): IMatcher;
        abstract update(entities: E[]): void;
    }

    /**
     * System的root，对游戏中的System遍历从这里开始。
     * 
     * 一个System组合中只能有一个RootSystem，可以有多个并行的RootSystem。
     */
    export class RootSystem {
        private executeSystemFlows: ComblockSystem[] = [];
        private systemCnt: number = 0;

        add(system: System | ComblockSystem) {
            if (system instanceof System) {
                // 将嵌套的System都“摊平”，放在根System中进行遍历，减少execute的频繁进入退出。
                Array.prototype.push.apply(this.executeSystemFlows, system.comblockSystems);
            }
            else {
                this.executeSystemFlows.push(system as ComblockSystem);
            }
            this.systemCnt = this.executeSystemFlows.length;
            return this;
        }

        init() {
            this.executeSystemFlows.forEach(sys => sys.init());
        }

        execute(dt: number) {
            for (let i = 0; i < this.systemCnt; i++) {
                // @ts-ignore
                this.executeSystemFlows[i].execute(dt);
            }
        }

        clear() {
            this.executeSystemFlows.forEach(sys => sys.onDestroy());
        }
    }

    /**
     * 系统组合器，用于将多个相同功能模块的系统逻辑上放在一起。System也可以嵌套System。
     */
    export class System {
        private _comblockSystems: ComblockSystem[] = [];
        get comblockSystems() {
            return this._comblockSystems;
        }

        add(system: System | ComblockSystem) {
            if (system instanceof System) {
                Array.prototype.push.apply(this._comblockSystems, system._comblockSystems);
                system._comblockSystems.length = 0;
            }
            else {
                this._comblockSystems.push(system as ComblockSystem);
            }
            return this;
        }
    }
    //#endregion
}