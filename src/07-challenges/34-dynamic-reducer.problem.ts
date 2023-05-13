import { expect, it } from "vitest";
import { Equal, Expect } from "../helpers/type-utils";

// Clue - this will be needed!
type PayloadsToDiscriminatedUnion<T extends Record<string, any>> = {
  [K in keyof T]: { type: K } & T[K];
}[keyof T];

/**
 * It turns a record of handler information into a discriminated union:
 *
 * | { type: "LOG_IN", username: string, password: string }
 * | { type: "LOG_OUT" }
 */
type TestingPayloadsToDiscriminatedUnion = PayloadsToDiscriminatedUnion<{
  LOG_IN: { username: string; password: string };
  LOG_OUT: {};
}>;

type ExtractActions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (...args: infer TArgs) => any
    ? TArgs extends [state: any, payload: infer TPayload]
      ? TPayload
      : {}
    : never;
};

type extractActionSubject = {
  noArgs: () => any;
  justState: (state: "justState") => any;
  stateAndPayload: (
    state: "stateAndPayload",
    payload: {
      aPayload: "hello";
    }
  ) => any;
};
type testExtractActions = ExtractActions<extractActionSubject>;
//    ^?
type testGetPayloads = PayloadsToDiscriminatedUnion<testExtractActions>;
//    ^?

type expectExtractActions = Expect<
  Equal<
    testExtractActions,
    { noArgs: {}; justState: {}; stateAndPayload: { aPayload: "hello" } }
  >
>;

/**
 * Clue:
 *
 * You'll need to add two generics here!
 */
export class DynamicReducer<
  TState,
  TBuilder extends Record<string, (...args: any[]) => any> = {}
> {
  private handlers: TBuilder;

  constructor() {
    this.handlers = {} as TBuilder;
  }

  addHandler<TActionType extends string, TPayload>(
    type: TActionType,
    handler: (state: TActionType, payload: TPayload) => TState
  ): this &
    DynamicReducer<
      TState,
      TBuilder & {
        [K in TActionType]: (state: TActionType, payload: TPayload) => TState;
      }
    > {
    (this.handlers as any)[type] = handler;

    return this as any;
  }

  reduce(
    state: TState,
    action: PayloadsToDiscriminatedUnion<ExtractActions<TBuilder>>
  ): TState {
    const handler = this.handlers[action.type];
    if (!handler) {
      return state;
    }

    return handler(state, action);
  }
}

interface State {
  username: string;
  password: string;
}

const reducer = new DynamicReducer<State>()
  .addHandler(
    "LOG_IN",
    (state, action: { username: string; password: string }) => {
      return {
        username: action.username,
        password: action.password,
      };
    }
  )
  .addHandler("LOG_OUT", () => {
    return {
      username: "",
      password: "",
    };
  });

it("Should return the new state after LOG_IN", () => {
  const state = reducer.reduce(
    { username: "", password: "" },
    { type: "LOG_IN", username: "foo", password: "bar" }
  );

  type test = [Expect<Equal<typeof state, State>>];

  expect(state).toEqual({ username: "foo", password: "bar" });
});

it("Should return the new state after LOG_OUT", () => {
  const state = reducer.reduce(
    { username: "foo", password: "bar" },
    { type: "LOG_IN", password: "", username: "" }
  );

  type test = [Expect<Equal<typeof state, State>>];

  expect(state).toEqual({ username: "", password: "" });
});

it("Should error if you pass it an incorrect action", () => {
  reducer.reduce(
    {
      username: "hello",
      password: "hello",
    },
    { type: "LOG_OUT" }
  );
  // @ts-expect-error
  const state = reducer.reduce(
    { username: "foo", password: "bar" },
    {
      type: "NOT_ALLOWED",
    }
  );
});

it("Should error if you pass an incorrect payload", () => {
  // @ts-expect-error
  const state = reducer.reduce(
    { username: "foo", password: "bar" },
    {
      type: "LOG_IN",
    }
  );
});
