import { describe, it } from 'vitest';
import VehicleService from '../js/services/VehicleService';

describe('scratch test clear', () => {
  it('should clear data and print errors', async () => {
    const res = await VehicleService.clearDemoData();
    console.log('CLEAR DATA RESULT:', res);
  });
});
