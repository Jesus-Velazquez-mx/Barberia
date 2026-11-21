import { jest } from '@jest/globals';

const markNoShow = jest.fn<(now: Date) => Promise<number>>();

jest.unstable_mockModule('../src/services/appointmentService.js', () => ({ markNoShow }));

const { noShowJob } = await import('../src/jobs/noShowJob.js');

describe('noShowJob', () => {
    beforeEach(() => {
        markNoShow.mockReset();
    });

    it('passes the injected clock to the service and reports the affected appointment count', async () => {
        const now = new Date('2026-11-19T12:00:00.000Z');
        markNoShow.mockResolvedValue(3);

        await expect(noShowJob.run({ now })).resolves.toEqual({ affected: 3 });
        expect(markNoShow).toHaveBeenCalledWith(now);
    });
});
