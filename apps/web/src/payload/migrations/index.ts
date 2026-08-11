import * as migration_20260811_154912_init from './20260811_154912_init';
import * as migration_20260811_160441_reader_accounts from './20260811_160441_reader_accounts';

export const migrations = [
  {
    up: migration_20260811_154912_init.up,
    down: migration_20260811_154912_init.down,
    name: '20260811_154912_init',
  },
  {
    up: migration_20260811_160441_reader_accounts.up,
    down: migration_20260811_160441_reader_accounts.down,
    name: '20260811_160441_reader_accounts'
  },
];
