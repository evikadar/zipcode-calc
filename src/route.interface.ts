export class RouteInterface {
  routes: [{ distanceMeters: number }];
}

export type PriceRange = {
  [key: string]: number;
};

export type Prices = {
  [key: string]: PriceRange;
};
