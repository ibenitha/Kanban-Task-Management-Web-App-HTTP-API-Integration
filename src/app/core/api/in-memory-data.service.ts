import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';
import seed from '../../../../mock-api/seed.json';

/*
 * Mock backend used ONLY in production (Netlify), where json-server
 * cannot run. It is turned on by `useInMemoryApi` in the environment file.
 *
 * angular-in-memory-web-api intercepts HttpClient requests such as
 * GET /api/boards or PUT /api/tasks/3 and answers them from the
 * collections below. It reads the same seed.json as json-server, so
 * development and production start with identical data.
 */
@Injectable({ providedIn: 'root' })
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    // structuredClone gives each app start its own copy of the seed data.
    return structuredClone(seed);
  }

  // Called on POST to generate the new record's numeric id (max id + 1),
  // the same way json-server does.
  genId(collection: { id: number }[]): number {
    return collection.length > 0 ? Math.max(...collection.map((item) => item.id)) + 1 : 1;
  }
}
