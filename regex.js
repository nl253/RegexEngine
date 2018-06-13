#!/usr/bin/env node

class BaseSingular {
  constructor() {
    this.next = null;
    this._input = this._rest = null;
  }

  get rest() {
    return this._rest;
  }

  get input() {
    return this._input;
  }

  set rest(newRest) {
    this._rest = newRest;
  }

  set input(newInput) {
    this._input = newInput;
  }

  feed(input) {
    this.input = this.rest = input;
    return this;
  }

  consume() {
    return true;
  }

  setNext(nextFSM) {
    this.next = nextFSM;
    return this;
  }
}

// a{min,max}
class Counting extends BaseSingular {
  constructor(pat, min = 1, max = 1) {
    super();
    this.min = min;
    this.max = max;
    this.loops = 0;
    this.pat = pat;
  }

  get rest() {
    return this.pat.rest;
  }

  get input() {
    return this.pat.input;
  }

  set rest(rest) {
    this.pat.rest = rest;
  }

  set input(input) {
    this.pat.input = input;
  }

  consume() {
    while (this.rest.length > 0 && this.pat.consume()) {
      this.loops++;
    }

    if (this.loops >= this.min && this.loops <= this.max) {
      if (this.next === null) return true;
      else {
        this.next.feed(this.rest);
        return this.next.consume();
      }
    } else return false;
  }
}

// ahc
class Text extends BaseSingular {
  constructor(pat) {
    super();
    this.pat = pat;
  }

  consume() {
    while (this.rest.length > 0) {
      const fst = this.rest[0];

      switch (fst) {
        case '$':
          if (this.rest[1] !== '\n') {
            return false;
          }
          break;

        case '.':
          break;

        default:
          if (fst !== this.pat[0]) return false;
          break;
      }

      this.rest = this.rest.substr(1);
    }

    return true;
  }
}

class BaseSeq extends BaseSingular {
  constructor() {
    super();
    this.nextNodes = [];
  }

  /**
   * Append a new node.
   *
   * @param {BaseSingular} another
   */
  addNext(another) {
    this.nextNodes.push(another);
    return this;
  }
}

class Group extends BaseSeq {
  constructor() {
    super();
  }

  consume() {
    for (let i = 0; i < this.nextNodes.length; i++) {
      let next = this.nextNodes[i];
      // when fst node
      if (i === 0) next.feed(this.rest);
      // get from the prev node
      else next.feed(this.nextNodes[i - 1]);
      const ok = next.consume();
      if (!ok) return false;
    }
    return true;
  }
}

class Or extends BaseSeq {
  constructor() {
    super();
    this.acceptor = null;
  }

  get rest() {
    if (this.acceptor === null) return this.rest;
    else return this.acceptor.rest;
  }

  consume() {
    for (let i = 0; i < this.nextNodes.length; i++) {
      let next = this.nextNodes[i];
      // when fst node
      if (i === 0) next.feed(this.rest);
      // get from the prev node
      else next.feed(this.nextNodes[i - 1]);
      const ok = next.consume();
      if (ok) {
        this.acceptor = next;
        return true;
      }
    }
    return false;
  }
}

/**
 * Parses [abc].
 *
 * @param {string} terms
 * @returns {Or} *
 */
function set(terms) {
  const _set = new Or();
  for (let term of _set) {
    _set.addNext(new Text(term));
  }
  return _set;
}

// [a-z] [0-9]
/**
 * Parses [a-z], [0-9] and [A-Z].
 *
 * @param {string|number} i 
 * @param {string|number} j
 * @returns {Or} *
 */
function setRange(i, j) {
  const node = new Or();

  if (i.prototype.constructor.name === 'Number') {
    while (i < j) {
      node.addNext(new Text(i.toString()));
      i++;
    }
  } else if (i.prototype.constructor.name === 'String') {
    i = i.charCodeAt(0);
    j = j.charCodeAt(0);
    while (i < j) {
      node.addNext(new Text(String.fromCharCode(i)));
      i++;
    }
  } else {
    console.error(`unexpected input
expected string or number
got ${i.toString()} and ${j.toString()}`);
    return undefined;
  }

  return node;
};
// a*
const star = pat => new Counting(pat, 0, Number.POSITIVE_INFINITY);

// a+
const plus = pat => new Counting(pat, 1, Number.POSITIVE_INFINITY);

// a?
const opt = pat => new Counting(pat, 0, 1);

// a{,maxi}
const max = (pat, maxi) => new Counting(pat, 0, maxi);

// a{mini,}
const min = (pat, mini) => new Counting(pat, mini, Number.POSITIVE_INFINITY);
