/**
 * fetchers is an object where you can optionally
 * pass keys that match the route names.
 *
 * BUT - how do we prevent the user from passing
 * fetchers that don't exist in the routes array?
 *
 * We'll need to change this to a function which takes
 * in the config as an argument.
 *
 * Desired API:
 *
 * const config = makeConfigObj(config);
 */

import { F } from "ts-toolbelt";

// ok this actually works I thought it would not lol
export const makeConfigObj = <
  const TRoutes extends ReadonlyArray<string>,
  TFetchers extends Record<F.NoInfer<TRoutes>[number], (...args: any[]) => any>
>(config: {
  routes: TRoutes;
  fetchers: TFetchers;
}) => config;

const config = makeConfigObj({
  routes: ["/", "/about", "/contact"],
  fetchers: {
    // @ts-expect-error
    "/does-not-exist": () => {
      return {};
    },
  },
});

//Matts solution would allow us not to do this? -- happens the same
const seedConfig = {
  routes: ["/", "/about", "/contact"],
  fetchers: {
    "/does-not-exist": () => {
      return {};
    },
  },
};

interface ConfigObj<TRoute extends string> {
  routes: TRoute[];
  fetchers: {
    [K in TRoute]: () => any;
  };
}
const makeOtherConfigObj = <TRoute extends string>(
  config: ConfigObj<TRoute>
) => {
  return config;
};
// no it does not
const otherConfig = makeOtherConfigObj(seedConfig);

// This works because we pass the parameter here
makeOtherConfigObj({
  routes: ["/", "/about", "/contact"],
  fetchers: {
    //@ts-expect-error
    "/does-not-exist": () => {
      return {};
    },
  },
});
