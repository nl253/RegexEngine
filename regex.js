/**
 * File description.
 *
 * @format
 * @copyright 2018
 * @author nl253
 * @see {@link  details and explanation}
 * @requires
 */

class BaseSingular {
  constructor() {
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
}

// a{min,max}
class Quantified extends BaseSingular {
  constructor(innerNode, min = 1, max = 1) {
    super();
    this.min = min;
    this.max = max;
    this.loops = 0;
    this.innerNode = innerNode;
  }

  feed(input) {
    this.innerNode.feed(input);
  }

  get rest() {
    return this.innerNode.rest;
  }

  get input() {
    return this.innerNode.input;
  }

  set rest(rest) {
    this.innerNode.rest = rest;
  }

  set input(input) {
    this.innerNode.input = input;
  }

  consume() {
    while (this.rest.length > 0) {
      if (this.innerNode.consume() && this.loops < this.min) this.loops++;
      else break;
    }
    return this.loops >= this.min && this.loops <= this.max;
  }
}

// ahc
class Text extends BaseSingular {
  constructor(pat) {
    super();
    this.pat = pat;
  }

  consume() {
    if (this.rest[0] === this.pat) {
      this.rest = this.rest.substr(1);
      return true;
    } else return false;
  }
}

class BaseSeq extends BaseSingular {
  constructor() {
    super();
    this.innerNodes = [];
  }

  /**
   * Append a new node.
   *
   * @param {BaseSingular} another
   */
  addNext(another) {
    this.innerNodes.push(another);
    return this;
  }
}

class Group extends BaseSeq {
  constructor() {
    super();
  }

  consume() {
    for (let i = 0; i < this.innerNodes.length; i++) {
      let focus = this.innerNodes[i];
      // when fst node
      if (i === 0) focus.feed(this.rest);
      else focus.feed(this.innerNodes[i - 1].rest); // get from the prev node
      const ok = focus.consume();
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

  set rest(newRest) {
    this._rest = newRest;
  }

  get rest() {
    if (this.acceptor === null) return this._rest;
    else return this.acceptor.rest;
  }

  consume() {
    for (let i = 0; i < this.innerNodes.length; i++) {
      let next = this.innerNodes[i];
      // when fst node
      if (i === 0) next.feed(this.rest);
      // get from the prev node
      else next.feed(this.innerNodes[i - 1].rest);
      const ok = next.consume();
      if (ok) {
        this.acceptor = next;
        return true;
      }
    }
    return false;
  }
}

module.exports = {
  Group,
  Or,
  Text,
  Quantified,
};
