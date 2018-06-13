#!/usr/bin/env node

const Parser = require('./parser');

function main() {
  console.log(process.argv);
  const parser = new Parser(process.argv[2]);
  console.info('the parser ...');
  console.info(parser);
  console.info('the result of parsing (the FSM) ...');
  const fsm = parser.start();
  console.info(fsm);
  const text = process.argv[3];
  console.info(`text = "${text}"`);
  console.info('feeding text into FSM ...');
  const fed = fsm.feed(text);
  console.info(fed);
  console.info(`After feeding result is ... ${fed.consume()}`);
}

main();

module.exports = main;
