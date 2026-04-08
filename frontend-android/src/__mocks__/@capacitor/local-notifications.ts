export const LocalNotifications = {
  requestPermissions: jest.fn().mockResolvedValue({ display: 'granted' }),
  registerActionTypes: jest.fn().mockResolvedValue(undefined),
  getPending: jest.fn().mockResolvedValue({ notifications: [] }),
  cancel: jest.fn().mockResolvedValue(undefined),
  schedule: jest.fn().mockResolvedValue(undefined),
  addListener: jest.fn().mockResolvedValue({ remove: jest.fn() }),
};
