/**
 * File description.
 *
 * @copyright 2018 
 * @author nl253
 * @see {@link  details and explanation}
 * @requires 
 */

const Parser = require('./parser');

const msg = (regex, input) => `pattern /${regex}/ matches input "${input}"`;

// INPUT | REGEX
const tests = [
  ['aaaaaaa', 'a+'          ],
  ['aaaa'   , 'a{4}'        ],
  ['12331'  , '[123]+'      ],
  ['12331'  , '[123]{5}'    ],
  ['jkl'    , 'jkl'         ],
  ['jkl'    , 'j(kl)?'      ],
  ['j'      , 'j(kl)?'      ],
  ['j'      , 'j(kl)*'      ],
  ['j'      , 'j(kl){,}'    ],
  ['slkdf'  , '[slkdf]{2,4}'],
];

for (let entry of tests) {

  const input = entry[0];
  const regex = entry[1];

  test(msg(input, regex), () => {
    let parser = new Parser(regex);
    let fsm = parser.start();
    fsm.feed(input);
    let result = fsm.consume();
    expect(result).toBe(true);
  });
}
