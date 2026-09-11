import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('starts with no notification', async () => {
    expect(await firstValueFrom(service.notification$)).toBeNull();
  });

  it('publishes a success notification', async () => {
    service.success('Board created.');
    expect(await firstValueFrom(service.notification$)).toEqual({
      type: 'success',
      message: 'Board created.',
    });
  });

  it('publishes an error notification', async () => {
    service.error('Could not save.');
    expect(await firstValueFrom(service.notification$)).toEqual({
      type: 'error',
      message: 'Could not save.',
    });
  });

  it('clears the current notification', async () => {
    service.success('Task added.');
    service.clear();
    expect(await firstValueFrom(service.notification$)).toBeNull();
  });

  it('replays the latest value to a new subscriber (BehaviorSubject semantics)', async () => {
    service.success('First');
    service.error('Second');

    const values = await firstValueFrom(service.notification$.pipe(take(1), toArray()));
    expect(values).toEqual([{ type: 'error', message: 'Second' }]);
  });
});
