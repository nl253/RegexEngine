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
class Quantified extends BaseSingular {
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
    // while (this.rest.length > 0) {
      // const fst = this.rest[0];
      // if (fst !== this.pat) return false;
      // else this.rest = this.rest.substr(1);

      // switch (fst) {

        // case '$':
          // if (this.rest[1] !== '\n') {
            // return false;
          // }
          // break;

        // case '.':
          // break;

        // default:
          // if (fst !== this.pat) return false;
          // break;
      // }
        //
    // }

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
      else focus.feed(this.innerNodes[i - 1].rest);  // get from the prev node
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

  get rest() {
    if (this.acceptor === null) return this.rest;
    else return this.acceptor.rest;
  }

  consume() {
    for (let i = 0; i < this.innerNodes.length; i++) {
      let next = this.innerNodes[i];
      // when fst node
      if (i === 0) next.feed(this.rest);
      // get from the prev node
      else next.feed(this.innerNodes[i - 1]);
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
