import { Pool } from "../Pool";
import { PoolObserver } from "./PoolObserver";
import { Entity } from "../Entity";
import { EntityBehavior } from "./EntityBehavior";
import { Systems } from "../Systems";
import { SystemObserver } from "./SystemObserver";

/**
 * Inspired by Unity
 */
// namespace entitas {
//   export namespace viewer {


    declare var dat
    declare var example

 
    export var gui
    /**
     * @class VisualDebugging
     */
    export class VisualDebugging {
      public static _controllers
      public static _entities
      public static _pools
      public static _systems

      /**
       *
       * @param pool
       */
      public static init(pool: Pool) {
        if ((pool._debug || location.search === "?debug=true") && window['dat']) {
          gui = new dat.GUI({ height: 5 * 32 - 1, width: 300 })

          const observer = new PoolObserver(pool)

          VisualDebugging._controllers = {}
          VisualDebugging._entities = gui.addFolder('Entities')
          VisualDebugging._pools = gui.addFolder('Pools')
          VisualDebugging._systems = gui.addFolder('Systems')

          VisualDebugging._entities.open()
          VisualDebugging._pools.open()
          VisualDebugging._systems.open()

          VisualDebugging._pools.add(observer, 'entities').listen()
          VisualDebugging._pools.add(observer, 'reusable').listen()

          pool.onEntityCreated.add((pool, entity: Entity) => {
            const proxy = new EntityBehavior(entity)
            VisualDebugging._controllers[entity.id] = VisualDebugging._entities.add(proxy, proxy.name).listen()
          })

          pool.onEntityDestroyed.add((pool, entity: Entity) => {
            const controller = VisualDebugging._controllers[entity.id]
            delete VisualDebugging._controllers[entity.id]
            VisualDebugging._entities.remove(controller)
          })

          /** Wrap the Systems::initialize method */
          const superInitialize = Systems.prototype.initialize

          Systems.prototype.initialize = function () {
            superInitialize.call(this)

            const sys = new SystemObserver(this)
            VisualDebugging._systems.add(sys, 'initialize').listen()
            VisualDebugging._systems.add(sys, 'execute').listen()
          }

          // function get_Systems() {
          //   return "Systems " + " (" +
          //     this._initializeSystems.length + " init, " +
          //     this._executeSystems.length + " exe "
          // }

          Object.defineProperty(Systems.prototype, 'name', { get: () => 'Systems' })
          Object.defineProperty(Systems.prototype, 'Systems', {
            get: () => {
              return "Systems " + " (" +
                this['_initializeSystems'].length + " init, " +
                this['_executeSystems'].length + " exe "
            }
          })
        }
      }
    }
//   }
// }