// const EventEmitter = require('events')
const Emitter = require('energy')
// @ts-check
/** Class representing entire lift system */
class LiftSystem {
  /**
   * Create lift system
   * @param {number} liftNum - number of operating lifts
   * @param {number} floorNum - number of floors
   * @param {number[]} initialFloors - array representing where lifts starts (must be smaller then floorNum)
   * @param {number[]} liftsSpeed - array representing how fast every lift (require fraction of 1)
   */
  constructor (liftNum, floorNum, initialFloors = [], liftsSpeed = []) {
    this.floorNum = floorNum
    this.lifts = []
    this._init(liftNum, floorNum, initialFloors, liftsSpeed)
    this.queue = new Queue()
    this.numOfOperating = 0
    this.myEmmiter = new Emitter()
    this.myEmmiter.on('newItem', () => {
      this.processQueue()
    })
    this.myEmmiter.on('getFree', () => {
      if (this.queue.items.length > 0) {
        this.processQueue()
      }
    })
  }
  async processQueue () {
    const queueOut = this.queue.items[this.queue.items.length - 1]
    this.queue.remove()
    const liftToOperate = this.defineLift(queueOut.from)
    console.log(`task ${JSON.stringify(queueOut)} given to ${liftToOperate}`)
    this.numOfOperating++
    await this._updateLiftCurrentFloor(liftToOperate, queueOut.from)
    await this._updateLiftCurrentFloor(liftToOperate, queueOut.to)
    this.myEmmiter.emit('getFree')
    this.numOfOperating--
  }
  askForLifting (from, to) {
    this.queue.add({ from, to })
    if (this.numOfOperating !== this.lifts.length) {
      this.myEmmiter.emit('newItem')
    }
  }

  defineLift (from) {
    const ans = this.lifts
      .filter(el => el.free)
      .sort((prev, next) => Math.abs(prev.curFloor - from) - Math.abs(next.curFloor - from))[0]
      .id
    return ans
  }

  _updateLiftCurrentFloor (idx, destination) {
    return new Promise((resolve, reject) => {
      const lift = this.lifts[idx]
      lift.free = false
      const initialFloor = lift.curFloor
      let { speed, curFloor } = lift
      const up = initialFloor < destination

      if (initialFloor !== destination) {
        const movingLift = setInterval(() => {
          up ? ++curFloor : --curFloor
          lift.setFloor(curFloor)
          if (curFloor === destination) {
            lift.free = true
            resolve({ msg: 'reached' })
            console.log(`LIFT ${idx} HAS REACHED ITS DESTINATION – FLOOR ${destination}`)
          }
        }, 1000 / speed)

        setTimeout(() => {
          clearInterval(movingLift)
        }, 1000 / speed * (Math.abs(destination - initialFloor)) + 100)
      } else {
        resolve({ msg: 'reached' })
      }
    })
  }

  _init (liftNum, floorNum, initialFloors, liftsSpeed) {
    let floor
    let speed
    for (let i = 0; i < liftNum; i++) {
      (typeof initialFloors[i] === 'number' && initialFloors[i] <= floorNum) ? floor = initialFloors[i] : floor = 0;
      (typeof liftsSpeed[i] === 'number' && liftsSpeed[i] <= 1) ? speed = liftsSpeed[i] : speed = 1
      this.lifts.push(new Lift(i, floor, speed))
    }
  }
}

class Lift {
  constructor (id, initialFloor, liftSpeed) {
    this.id = id
    this.curFloor = initialFloor
    this.speed = liftSpeed
    this.free = true
    // console.log(`The lift ${this.id} has speed ${this.speed} and it is initialised on floor ${this.curFloor}`)
  }
  setFloor (floor) {
    this.curFloor = floor
    // console.log(`Lift ${this.id} is now on floor ${this.curFloor}`)
  }
}

class Queue {
  constructor () {
    this.items = []
  }
  /**
   * Add new item to the begining of array
   * @param {{from: number, to: number}} item – represents the items child
   */
  add (item) {
    this.items.unshift(item)
  }
  remove () {
    this.items.pop()
  }
}

const liftSystem = new LiftSystem(3, 10, [1, 5, 7])
liftSystem.askForLifting(4, 1)
liftSystem.askForLifting(1, 2)
liftSystem.askForLifting(5, 2)
liftSystem.askForLifting(5, 2)
liftSystem.askForLifting(5, 2)
