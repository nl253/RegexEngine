#!/usr/bin/env node

const Parser = require('./parser');

function main() {
  if (process.argv[2] === undefined) {
    console.error('pattern not specified');
  } else if (process.argv[3] === undefined) {
    console.error('input string not given');
  } else {
    const parser = new Parser(process.argv[2]);
    console.debug('the parser ...');
    console.debug(parser);
    console.debug('the result of parsing (the FSM) ...');
    const fsm = parser.start();
    console.debug(fsm);
    const text = process.argv[3];
    console.debug(`text = "${text}"`);
    console.debug('feeding text into FSM ...');
    const fed = fsm.feed(text);
    console.debug(fed);
    console.debug(`After feeding result is ... ${fed.consume()}`);
  }
}

main();

module.exports = main;
