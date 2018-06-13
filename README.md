# Regex Engine in JavaScript

- parses input using a recursive descent parser e.g. `"a(bc)?"` and turns it into a FSM
- syntax supported:

| Syntax Support  |      --      |
|-----------------+--------------|
| Basic sequences | `abc`        |
| Optional match  | `a?`         |
| min, max bound  | `a{min,max}` |
| maximum bound   | `a{,max}`    |
| minimum bound   | `a{min,}`    |
| exact n times   | `a{exactly}` |
| nested captures | `a(b(c))`    |
| plus i.e. a{1,} | `a+`         |
| star i.e. a{,}  | `a*`         |
| alterations     | `a|b`        |

- not supported

| Syntax Support  |      --      |
|-----------------+--------------|
| lnend anchor    | `$`          |
| lnstart anchor  | `^`          |
| back refs       | `\1`         |
| lookaheads      | `(?=pat)`    |
| lookbehinds     | `(?<=pat)`   |
| neg assertions  | `(?!pat)`    |

etc.


## Running

Run `main.js`.

## Tests

Some tests in `checks.test.js`.
