import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/globalConfig.js', () => ({
    default: { AWS_BUCKET_KEY_PREFIX_USER: 'user/images/', AWS_BUCKET_KEY_PREFIX_HAIRCUTS: 'haircuts/' },
}));

const { toSnakeCase, getHaircutPhotoKey, getHaircutImageExtension } = await import('../src/utils/photoKey.js');

describe('toSnakeCase', () => {
    test.each([
        ['Wolf Cut', 'wolf_cut'],
        ['Classic Ikari Side Part', 'classic_ikari_side_part'],
        ['  Buzz   Cut  ', 'buzz_cut'],
        ['Corte Clásico Ñandú', 'corte_clasico_nandu'],
        ['../../etc/passwd', 'etc_passwd'],
    ])('%s -> %s', (input, expected) => {
        expect(toSnakeCase(input)).toBe(expected);
    });
});

describe('getHaircutPhotoKey', () => {
    test('builds the key from the haircuts prefix, snake_case name and extension', () => {
        expect(getHaircutPhotoKey('Wolf Cut', 'webp')).toBe('haircuts/wolf_cut.webp');
    });
});

describe('getHaircutImageExtension', () => {
    test.each([
        ['image/jpeg', 'jpg'],
        ['image/png', 'png'],
        ['image/webp', 'webp'],
    ] as const)('%s -> %s', (contentType, extension) => {
        expect(getHaircutImageExtension(contentType)).toBe(extension);
    });
});
