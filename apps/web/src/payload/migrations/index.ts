import * as migration_20260811_133542_init from './20260811_133542_init';

export const migrations = [
  {
    up: migration_20260811_133542_init.up,
    down: migration_20260811_133542_init.down,
    name: '20260811_133542_init'
  },
];
