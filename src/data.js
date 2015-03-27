'use strict';

let e = {};

e.randomName = function (size = 3) {
  const v = 'aeiouy';
  const c = 'zrtpsdfghjklmwxcvbn';

  let flip = Math.random() > 0.5;
  let name = '';
  for(let i = 0; i < size; ++i, flip = !flip) {
    const l = flip ? c : v;
    name += l.charAt(Math.floor(Math.random() * l.length) );
  }
  return name;
};

e.point = {};
e.point.construct = function (point = {}) {
  let that = {};
  that.x = point.x || 0;
  that.y = point.y || 0;
  that.id = point.id || 0;
  return that;
};

e.point.same = function(point1, point2) {
  return point1.x === point2.x
    && point1.y === point2.y
    && point1.id === point2.id;
};

e.Set = class {
  constructor(set) {
    this.domain = (set && set.domain
                   ? e.jsonClone(set.domain)
                   : { x: [-1, 1], y: [-1, 1] } );

    this.values = (set && set.values
                   ? e.jsonClone(set.values)
                   : [] );

    this.idFromPoint = (set && set.idFromPoint
                   ? e.jsonClone(set.idFromPoint)
                   : [] );

    this.name = (set && set.name
                 ? set.name // immutable
                 : e.randomName(4) );
    return this;
  }

  cloneFrom(set) {
    this.domain = e.jsonClone(set.domain);
    this.values = e.jsonClone(set.values);
    this.name = set.name; // immutable

    return this;
  }

  rename(name) {
    this.name = name;
    return this;
  }

  createId() {


  }

  addPoint(point = {} ) {
    // start to increment from the last point
    point.id = (this.values.length > 0
                ? this.values[this.values.length - 1].id + 1
                : 1);
    while(this.idFromPoint[point.id] !== undefined) {
      ++point.id;
    }

    const valueId = this.values.length;
    this.idFromPoint[point.id] = valueId;
    this.values[valueId] = e.point.construct(point);
    return this;
  }

  // changePointId(point, id) {
  //   point.id = id;
  //   for(


  // }

  // insertPoint(point = {}, Id = 0) {
  //   point.id = Id || this.values.length;
  //   this.values.splice(point.id, 0, e.point.construct(point) );
  //   return this;
  // }

  addRandom(number) {
    const extend = { x: this.domain.x[1] - this.domain.x[0],
                     y: this.domain.y[1] - this.domain.y[0] };
    for(let i = 0; i < number; ++i) {
      this.addPoint( { x: Math.random() * extend.x + this.domain.x[0],
                       y: Math.random() * extend.y + this.domain.y[0]} );
    }
    return this;
  }

};


e.Structure = class {
  constructor(sets = {}) {
    this.sets = sets;
  }

  addSet(set, name = set.name) {
    this.sets[name] = new e.Set(set);
    this.sets[name].name = name;
    return this;
  }

  addSetByReference(set) {
    this.sets[set.name] = set;
    return this;
  }

  getSetByName(name) {
    return this.sets[name];
  }

  removeSetByName(name) {
    delete this.sets[name];
    return this;
  }

  nameExists(name) {
    return this.sets.hasOwnProperty(name);
  }

  getSetNames() {
    return Object.keys(this.sets);
  }

};

// no function here
e.jsonClone = function(jsonObject) {
  return JSON.parse(JSON.stringify(jsonObject) );
};

module.exports = exports = e;
