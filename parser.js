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

function range(min = 0, max = 10, step = 1) {
  let stack = [];
  while (min < max) {
    stack.push(min);
    min += step;
  }
  return stack;
}

function rangeChar(min = 'a', max = 'z', step = 1) {
  let stack = [];
  let min = min.charCodeAt(0);
  let max = max.charCodeAt(0);
  while (min < max) {
    stack.push(String.fromCharCode(min));
    min += step;
  }
  return stack;
}

const digits = range();
const isDigit = d => digits.includes(d);

const letters = new Set(rangeChar());
const isLetter = l => letters.includes(l);

const specials = ['.', '$', '^'] // TODO

class Parser {
  constructor(input = '') {
    this.input = input;
    this.globalPos = 0;
  }

  /**
   * Called on unexpected input. Only does informative logging.
   */
  logErr(expectedToken, unexpectedToken, extra = '') {
    console.error(`expected ${expectedToken} but saw ${unexpectedToken}`);
    if (extra.length > 0) console.error(extra);
  }

  /**
   * Called by parse() AFTER it notices AND skips over '('.
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
    this.globalPos = pos; // notify caller
    return g;
  }

  /**
   * Called by parse() and parseGroup() AFTER they notice AND skip over '['.
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
    set_ = parseCount(pos, set_) || parsePlus(pos, set_) || parseOpt(pos, set_) || parseStar(pos, set_) || set_;
    this.globalPos = pos; // notify caller
    return set_;
  }

  /**
   * Called by parseSet(). Tries to match a-z. 
   *
   * In most cases this will fail and parseSet() will backtrack to a.
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
          node.addNext(new Text(from.toString()));
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
          node.addNext(new Text(String.fromCharCode(i)));
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
   * Called by parseSet() and parseGroup() and parse() AFTER it parses a node.
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
   * Called by start(). 
   *
   * Whenever you are not in a capture group you are here.
   */
  parse(pos) {}

  /**
   * Called by parseCount() AFTER it notices AND skips over the comma.
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
      return new R.Counting(node, min, max)
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

      // globalPos is set by the call if it succeeds in parsing
      // it tells you where it finished parsing
      pos = this.globalPos; 
    }

    return g0;
  }
}

// vim:foldmethod=marker:foldmarker={,}:
