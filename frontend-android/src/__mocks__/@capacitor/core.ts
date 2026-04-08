export const Capacitor = {
  isNativePlatform: jest.fn().mockReturnValue(false),
  getPlatform: jest.fn().mockReturnValue('web'),
};

export const registerPlugin = jest.fn().mockReturnValue({});
