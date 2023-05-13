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

//failure
// type Handlers <T> = T extends {
//   [K: string]: (state: typeof K, payload: any) => any;
// } ? T : never

// const checkHandlers = <THandlers extends Handlers<any>>(handler:THandlers)=>{
//   return handler
// }

// checkHandlers({
//   Hello:(state,payload)=>{
//     return;
//   }
// })

//testing
type GetHandlerInformation<T extends Record<string, any>> = T extends Record<
  infer TKeys,
  (...args: any[]) => any
>
  ? {
      [K in TKeys as T[K] extends (...args: infer TArgs) => any
        ? K
        : never]: T[K] extends (...args: infer TArgs) => any
        ? TArgs extends [state: any, payload: infer TPayload]
          ? TPayload
          : {}
        : never;
    }
  : never;

type testGetHandlerInformation = GetHandlerInformation<{
  //      ^?
  hello: () => any;
  justState: (state: { hola: number }) => any;
  stateAndPayload: (state: string, payload: { payload: number }) => any;
}>;

type resultFromPayloadsToDiscriminatedUnion =
  PayloadsToDiscriminatedUnion<testGetHandlerInformation>;
//    ^?

//Okay wow... so no matter the number of arguments, functions extend anyway...
type testFnExtension = ((state: string) => any) extends (
  //    ^?
  state: string,
  payload: any
) => any
  ? true
  : false;
type testFnExtensionReverse = ((state: string, payload: any) => any) extends (
  //    ^?
  state: string
) => any
  ? true
  : false;

/**
 * Clue:
 *
 * You'll need to add two generics here!
 */
export class DynamicReducer<
  TState,
  TBuilder extends Record<string, (...args: any[]) => any> = {}
> {
  private handlers = {} as TBuilder;

  addHandler<TAction extends string = never, TPayload = never>(
    type: TAction,
    // have to do something here so that we avoid getting cut off by the type inference. Seems like the fact that we're requiring args here is just messing up the handler type n the return
    handler: (state: TAction, payload: TPayload) => TState
  ): DynamicReducer<
    TState,
    TBuilder & {
      type: TAction;
      handler: (state: TAction, payload: TPayload) => TState;
    }
  > {
    (this.handlers[type] as any) = handler;
    return this as any;
  }
  reduce(state: TState, action: unknown): unknown {
    const handler = this.handlers[action.type];
    if (!handler) {
      return state;
    }

    return handler(state, action);
  }
}

const testMyReducer = new DynamicReducer<{ myState: number }>()
  //    ^?
  .addHandler("hello", (state, payload: { myGoodness: string }) => ({
    myState: 1,
  }));
// .addHandler(
//   "myOtherHandler",
//   (state, payload: { wowSuchAPayload: number }) => ({ myState: 2 })
// );
testMyReducer.reduce({ myState: 2 }, { type: "" });

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
    { type: "LOG_OUT" }
  );

  type test = [Expect<Equal<typeof state, State>>];

  expect(state).toEqual({ username: "", password: "" });
});

it("Should error if you pass it an incorrect action", () => {
  const state = reducer.reduce(
    { username: "foo", password: "bar" },
    {
      // @ts-expect-error
      type: "NOT_ALLOWED",
    }
  );
});

it("Should error if you pass an incorrect payload", () => {
  const state = reducer.reduce(
    { username: "foo", password: "bar" },
    // @ts-expect-error
    {
      type: "LOG_IN",
    }
  );
});
