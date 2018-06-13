/**
 * File description.
 *
 * @format
 * @copyright 2018
 * @author nl253
 * @see {@link  details and explanation}
 * @requires
 */

const R = require('./regex.js');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {number[]} *
 */
function range(min = 0, max = 10, step = 1) {
  const stack = [];
  while (min < max) {
    stack.push(min);
    min += step;
  }
  return stack;
}

/**
 * @param {string} min
 * @param {string} max
 * @param {number} step
 * @returns {string[]} *
 */
function rangeChar(min = 'a', max = 'z', step = 1) {
  const stack = [];
  let min = min.charCodeAt(0);
  let max = max.charCodeAt(0);
  while (min < max) {
    stack.push(String.fromCharCode(min));
    min += step;
  }
  return stack;
}

const digits = range();

/**
 * @returns {boolean}
 */
const isDigit = d => digits.includes(d);

const letters = new Set(rangeChar());

/**
 * @returns {boolean}
 */
const isLetter = l => letters.includes(l);

const specials = ['.', '$', '^']; // tODO

class Parser {
  /**
   * @param {string} input
   */
  constructor(input = '') {
    this.input = input;
    this.globalPos = 0;
  }

  /**
   * Called on unexpected input. Only does informative logging.
   *
   * @param {string} expectedToken
   * @param {string} unexpectedToken
   * @param {string} extra
   */
  logErr(expectedToken, unexpectedToken, extra = '') {
    console.error(`expected ${expectedToken} but saw ${unexpectedToken}`);
    if (extra.length > 0) console.error(extra);
  }

  /**
   * Called by parse() AFTER it notices AND skips over '('.
   *
   * @param {number} pos
   */
  parseGroup(pos) {
    const g = new R.Group();

    while (focus !== ')') {
      if (pos >= this.input.length) {
        this.logErr(')', focus, 'unexpected end of input - unmatched "("');
        return undefined;
      } else {
        g.addNext(parse(pos));
        pos = this.globalPos; // get end pos of the call
        focus = this.input[pos]; // advance to the next token
      }
    }

    pos++; // skip over ')'

    const tryQuant = parseQuant(g);

    if (tryQuant) return tryQuant;
    // globalPost set by parseCount();
    else {
      this.globalPos = pos; // notify caller
      return g;
    }
  }

  /**
   * Called by parse() and parseGroup() AFTER they notice AND skip over '['.
   *
   * @param {number} pos
   */
  parseSet(pos) {
    const set_ = new R.Or();

    let focus = this.input[pos];

    while (focus !== ']') {
      if (pos >= this.input.length) {
        this.logErr(']', focus, 'unexpected end of input - unmatched "["');
        return undefined;
      } else {
        const tryParseRange = parseSetRange(pos);
        if (tryParseRange) {
          set_.addNext(tryParseRange);
          pos = this.globalPos;
        } else {
          set_.addNext(new Text(focus));
          pos++;
        }
        focus = this.input[pos];
      }
    }

    pos++; // skip over ']'

    const tryQuant = parseQuant(pos, set_);

    if (tryQuant) return tryQuant;
    // globalPost set by parseCount();
    else {
      this.globalPos = pos; // notify caller
      return set_;
    }
  }

  /**
   * Called by parseSet(). Tries to match a-z.
   *
   * In most cases this will fail and parseSet() will backtrack to a.
   *
   * @param {number} pos
   */
  parseSetRange(pos) {
    const node = new R.Or();

    const from = this.input[pos];

    if (isLetter(from) || isDigit(from)) {
      pos++; // skip to -
      focus = this.input[pos];

      if (focus === '-') {
        // ensure it's range eg a-z
        pos++; // skip over '-' to max
        focus = this.input[pos];

        if (isLetter(focus) || isDigit(focus)) {
          this.globalPos = pos; // notify caller of successful progress
          return { to: focus, from };
        } else this.logErr('/[a-zA-Z0-9]/', focus, 'invalid min range symbol');
      } else this.logErr('-', focus);
    } else this.logErr('/[a-zA-Z0-9]/', from, 'invalid max range symbol');

    return undefined;
  }

  /**
   * Called by parseSetRange() AFTER it determines that the first number (min) is a number.
   *
   * @param {number} pos
   */
  parseSetRangeNum(pos) {
    const node = new R.Or();

    let from = this.input[pos];

    pos++; // skip over min to '-'

    if (focus === '-') {
      // ensure it's range eg 0-9
      pos++; // skip over '-' to max
      focus = this.input[pos];

      if (isDigit(focus)) {
        const to = focus;

        while (from < to) {
          node.addNext(new R.Text(from.toString()));
          from++;
        }

        // notify caller of successful progress
        this.globalPos = pos;

        return node;
      } else this.logErr('/[a-zA-Z0-9]/', focus, 'invalid min range number');
    } else this.logErr('-', focus);

    return undefined;
  }

  /**
   * Called by parseSetRange() AFTER it determines that the first character (min) is a letter.
   *
   * @param {number} pos
   */
  parseSetRangeChar(pos) {
    const node = new R.Or();

    const from = this.input[pos];

    pos++; // skip over min to '-'

    if (focus === '-') {
      // ensure it's range eg a-z
      pos++; // skip over '-' to max
      focus = this.input[pos];

      if (isLetter(focus)) {
        const to = focus;

        i = from.charCodeAt(0);
        j = to.charCodeAt(0);

        while (i < j) {
          node.addNext(new R.Text(String.fromCharCode(i)));
          i++;
        }

        // notify caller of successful progress
        this.globalPos = pos;

        return node;
      } else this.logErr('/[a-zA-Z]/', focus, 'invalid min range character');
    } else this.logErr('-', focus);

    return undefined;
  }

  /**
   * Called by parseQuant() AFTER they
   *
   * @param {number} pos
   * @param {BaseSingular} node
   */
  parseCount(pos, node) {
    let min = 0;
    const max = Number.POSITIVE_INFINITY;
    let focus = this.input[pos];

    if (isDigit(focus)) {
      min = Number.parseInt(focus);
      pos++;
      focus = this.input[pos];
    }

    if (focus === ',') {
      pos++;
      return this.parseCountAfterComma(pos, min, max, node);
    } else {
      this.logErr(',', focus);
      return undefined;
    }
  }

  /**
   * Called by parse(), parseSet() and parseGroup() and parse() AFTER they parse a node OR when they end.
   *
   * @param {number} pos
   * @param {BaseSingular} node
   */
  parseQuant(pos, node) {
    const focus = this.input[pos];

    switch (focus) {
      case '+': {
        pos++; // skip over '+'
        this.globalPos = pos;
        return new R.Quantified(node, 1, Number.POSITIVE_INFINITY);
      }
      case '*': {
        pos++; // skip over '*'
        this.globalPos = pos;
        return new R.Quantified(node, 0, Number.POSITIVE_INFINITY);
      }
      case '?': {
        pos++; // skip over '?'
        this.globalPos = pos;
        return new R.Quantified(node, 0, 1);
      }
      case '{': {
        pos++; // skip over '{'
        return parseCount(pos, node);
      }
      default: {
        this.logErr('+ OR * OR ? OR {', focus);
        return undefined;
      }
    }
  }

  /**
   * Called by start().
   *
   * Whenever you are not in a capture group you are here.
   *
   * @param {number} pos
   */
  parse(pos) {
    let focus = this.input[pos];

    switch (focus) {
      case '(': {
        pos++; // skip over '('
        return parseGroup(pos);
      }
      case '[': {
        pos++; // skip over '['
        return parseSet(pos);
      }
      default: {
        let node = new R.Text(focus); // terminal
        pos++; // skip over it
        let tryQuant = parseQuant(pos, node);
        if (tryQuant) return tryQuant; // globalPos set by tryQuant()
        else {
          this.globalPos = pos;
          return node;
        }
      }
    }
  }

  /**
   * Called by parseCount() AFTER it notices AND skips over the comma.
   *
   * @param {number} pos
   * @param {BaseSingular} node
   */
  parseCountAfterComma(pos, min, max, node) {
    let focus = this.input[pos];
    if (isDigit(focus)) {
      max = Number.parseInt(focus);
      pos++;
      focus = this.input[pos];
    }

    if (focus === '}') {
      pos++; // skip over '}'
      this.globalPos = pos;
      return new R.Quantified(node, min, max);
    } else {
      this.logErr('}', focus);
      return undefined;
    }
  }

  /**
   * Begin parsing.
   */
  start() {
    const g0 = new R.Group(); // 0th group

    let pos = this.globalPos;

    while (pos < this.input.length) {
      g0.addNext(parse(pos));

      /*
       * globalPos is set by the call if it succeeds in parsing
       * it tells you where it finished parsing
       */
      pos = this.globalPos;
    }

    return g0;
  }
}

// vim:foldmethod=marker:foldmarker={,}:
