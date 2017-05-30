const O = require('core.operators');
const Maybe = require('data.maybe');

// gets([keys], object)
// Takes an array of property names, and an object, and returns Just
// the value at the given path if such a path exists, Nothing otherwise.
//
// Similar to Sanctuary's `gets` without the predicate:
// https://sanctuary.js.org/#gets
const gets = (keys) => (data) =>
  keys.reduce(
    (accum, key) => accum.map(O.get(key)).chain(Maybe.fromNullable),
    Maybe.of(data)
  )

const data = { foo: { bar: {baz: 1}}}
console.log(gets(['foo', 'bar', 'baz'])(data))
// => Just(2)

console.log(gets(['foo', 'missingkey'])(data))
// => Nothing
