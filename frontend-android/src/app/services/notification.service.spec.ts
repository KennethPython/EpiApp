import { of, throwError } from 'rxjs';
import { NotificationService } from './notification.service';
import { MedicationService } from './medication.service';
import { MedicationLogService } from './medication-log.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Medication, MedicationLog } from '../models/medication.model';

// LocalNotifications is auto-mocked via src/__mocks__/@capacitor/local-notifications.ts
const mockLocalNotifications = LocalNotifications as jest.Mocked<typeof LocalNotifications>;

describe('NotificationService', () => {
  let service: NotificationService;
  let medicationService: jest.Mocked<Pick<MedicationService, 'getAll'>>;
  let medicationLogService: jest.Mocked<Pick<MedicationLogService, 'markTaken'>>;

  const makeMed = (id: number, times: string[]): Medication =>
    ({ id, name: `Med ${id}`, dosage: '10mg', times });

  beforeEach(() => {
    jest.clearAllMocks();

    medicationService = { getAll: jest.fn() } as any;
    medicationLogService = { markTaken: jest.fn() } as any;

    service = new NotificationService(
      medicationService as unknown as MedicationService,
      medicationLogService as unknown as MedicationLogService,
    );
  });

  // ── handleTakeNow ────────────────────────────────────────────

  describe('handleTakeNow', () => {
    it('marks all medications at the given time as taken for today', async () => {
      const time = '09:00';
      medicationService.getAll.mockReturnValue(of([
        makeMed(1, ['09:00', '21:00']),
        makeMed(2, ['14:00']),        // different time — should be skipped
        makeMed(3, ['09:00']),
      ]));
      medicationLogService.markTaken.mockReturnValue(of({} as MedicationLog));

      await service.handleTakeNow(time);

      expect(medicationLogService.markTaken).toHaveBeenCalledTimes(2);
      expect(medicationLogService.markTaken).toHaveBeenCalledWith(1, '09:00', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
      expect(medicationLogService.markTaken).toHaveBeenCalledWith(3, '09:00', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    });

    it('uses today\'s local date (YYYY-MM-DD format)', async () => {
      medicationService.getAll.mockReturnValue(of([makeMed(1, ['09:00'])]));
      medicationLogService.markTaken.mockReturnValue(of({} as MedicationLog));

      const before = new Date();
      await service.handleTakeNow('09:00');
      const after = new Date();

      const [dateArg] = (medicationLogService.markTaken.mock.calls[0] as string[]).slice(2);
      const expected = `${before.getFullYear()}-${String(before.getMonth() + 1).padStart(2, '0')}-${String(before.getDate()).padStart(2, '0')}`;
      const expectedAfter = `${after.getFullYear()}-${String(after.getMonth() + 1).padStart(2, '0')}-${String(after.getDate()).padStart(2, '0')}`;

      // Date must be today (accounts for edge case of test running at midnight)
      expect([expected, expectedAfter]).toContain(dateArg);
    });

    it('does nothing when no medications are scheduled at the given time', async () => {
      medicationService.getAll.mockReturnValue(of([
        makeMed(1, ['14:00']),
        makeMed(2, ['21:00']),
      ]));

      await service.handleTakeNow('09:00');

      expect(medicationLogService.markTaken).not.toHaveBeenCalled();
    });

    it('skips medications that have no id', async () => {
      medicationService.getAll.mockReturnValue(of([
        { name: 'No-id med', dosage: '5mg', times: ['09:00'] }, // no id
      ]));

      await service.handleTakeNow('09:00');

      expect(medicationLogService.markTaken).not.toHaveBeenCalled();
    });

    it('continues marking remaining meds when one markTaken call fails', async () => {
      medicationService.getAll.mockReturnValue(of([
        makeMed(1, ['09:00']),
        makeMed(2, ['09:00']),
      ]));
      medicationLogService.markTaken
        .mockReturnValueOnce(throwError(() => new Error('conflict')))
        .mockReturnValueOnce(of({} as MedicationLog));

      await service.handleTakeNow('09:00');

      expect(medicationLogService.markTaken).toHaveBeenCalledTimes(2);
    });

    it('does nothing when fetching medications fails', async () => {
      medicationService.getAll.mockReturnValue(throwError(() => new Error('network error')));

      await service.handleTakeNow('09:00');

      expect(medicationLogService.markTaken).not.toHaveBeenCalled();
    });
  });

  // ── init / listener wiring ───────────────────────────────────

  describe('init', () => {
    it('registers a localNotificationActionPerformed listener', () => {
      service.init();
      expect(mockLocalNotifications.addListener).toHaveBeenCalledWith(
        'localNotificationActionPerformed',
        expect.any(Function),
      );
    });

    it('calls handleTakeNow when TAKE_NOW action is received for a med reminder', async () => {
      const handleTakeNowSpy = jest.spyOn(service, 'handleTakeNow').mockResolvedValue();

      service.init();

      // Capture the listener registered with addListener
      const listener = (mockLocalNotifications.addListener as jest.Mock).mock.calls[0][1] as Function;

      await listener({
        actionId: 'TAKE_NOW',
        notification: { extra: { isMedReminder: true, time: '09:00' } },
      });

      expect(handleTakeNowSpy).toHaveBeenCalledWith('09:00');
    });

    it('does not call handleTakeNow for CANCEL action', async () => {
      const handleTakeNowSpy = jest.spyOn(service, 'handleTakeNow').mockResolvedValue();

      service.init();

      const listener = (mockLocalNotifications.addListener as jest.Mock).mock.calls[0][1] as Function;

      await listener({
        actionId: 'CANCEL',
        notification: { extra: { isMedReminder: true, time: '09:00' } },
      });

      expect(handleTakeNowSpy).not.toHaveBeenCalled();
    });

    it('does not call handleTakeNow for a non-med-reminder notification', async () => {
      const handleTakeNowSpy = jest.spyOn(service, 'handleTakeNow').mockResolvedValue();

      service.init();

      const listener = (mockLocalNotifications.addListener as jest.Mock).mock.calls[0][1] as Function;

      await listener({
        actionId: 'TAKE_NOW',
        notification: { extra: { isMedReminder: false, time: '09:00' } },
      });

      expect(handleTakeNowSpy).not.toHaveBeenCalled();
    });
  });
});
