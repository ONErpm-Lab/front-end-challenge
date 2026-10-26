import { Logger } from '../shared/shared.interfaces';
import { Clock, FetchFn, Sleep } from '../shared/shared.types';

export interface ApiRouterOptions {
  readonly env: NodeJS.ProcessEnv;
  readonly logger?: Logger;
  /** Test seams: replace the network, the clock and the sleeping. */
  readonly fetchFn?: FetchFn;
  readonly now?: Clock;
  readonly sleep?: Sleep;
}
