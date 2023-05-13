import { Equal, Expect } from "../helpers/type-utils";

export function makeEventHandlers<TKey extends string>(obj: {
  [K in TKey]: (name: K) => void;
}) {
  return obj;
}

// I'm still processing how this is even working. I solved it without much thought but this looks weird. Matt even went a step before and inferred from an object rather than keys:
// and this works as well!
function makeEventHandlersMatt<TObj>(obj: {
  [K in keyof TObj]: (name: K) => void;
}) {
  return obj;
}

const obj = makeEventHandlers({
  click: (name) => {
    console.log(name);

    type test = Expect<Equal<typeof name, "click">>;
  },
  focus: (name) => {
    console.log(name);

    type test = Expect<Equal<typeof name, "focus">>;
  },
});
