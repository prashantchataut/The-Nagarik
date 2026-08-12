import * as migration_20260811_154912_init from './20260811_154912_init';
import * as migration_20260811_160441_reader_accounts from './20260811_160441_reader_accounts';
import * as migration_20260811_162228_engagement_events from './20260811_162228_engagement_events';
import * as migration_20260812_140232_reader_library from './20260812_140232_reader_library';

export const migrations = [
  {
    up: migration_20260811_154912_init.up,
    down: migration_20260811_154912_init.down,
    name: '20260811_154912_init',
  },
  {
    up: migration_20260811_160441_reader_accounts.up,
    down: migration_20260811_160441_reader_accounts.down,
    name: '20260811_160441_reader_accounts',
  },
  {
    up: migration_20260811_162228_engagement_events.up,
    down: migration_20260811_162228_engagement_events.down,
    name: '20260811_162228_engagement_events',
  },
  {
    up: migration_20260812_140232_reader_library.up,
    down: migration_20260812_140232_reader_library.down,
    name: '20260812_140232_reader_library'
  },
];
