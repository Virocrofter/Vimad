import 'dotenv/config';
import { getSlowQueries } from '../src/modules/admin/admin.profiler.service.js';
getSlowQueries(24, '')
  .then((r) => {
    console.log(
      'OK fingerprints=' +
        r.fingerprints.length +
        ' events=' +
        r.events.length +
        ' pgAvailable=' +
        r.pgAvailable
    );
    process.exit(0);
  })
  .catch((e) => {
    console.error('FAIL:', e?.message);
    console.error(e);
    process.exit(1);
  });
