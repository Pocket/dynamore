import { setTimeout } from 'timers/promises';

export async function backoff(tries: number, cap: number) {
  const maxWait = Math.min(cap, 2 ** tries * 100);
  // Pick random number from set [0, maxWait]
  const jitterWait = Math.floor(Math.random() * (maxWait + 1) + 0);
  await setTimeout(jitterWait);
}
