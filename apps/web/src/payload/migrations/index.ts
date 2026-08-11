import * as migration_20260811_154912_init from './20260811_154912_init';

export const migrations = [
  {
    up: migration_20260811_154912_init.up,
    down: migration_20260811_154912_init.down,
    name: '20260811_154912_init'
  },
];
