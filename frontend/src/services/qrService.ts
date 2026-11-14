import QRCode from 'qrcode';

const bot_name = 'MrBarberNotificationBot';


const buildTelegramLink = (clientId: string): string => {
    return `https://t.me/${bot_name}?start=${encodeURIComponent(clientId)}`;
}

export const generateTelegramQr = async (clientId: string): Promise<string> => {
    if (!clientId) {
        throw new Error('The ID is requirted to generate the QR code.');
    }

    const Link = buildTelegramLink(clientId);
    return await QRCode.toDataURL(Link, {
        width: 240,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
    });
}

