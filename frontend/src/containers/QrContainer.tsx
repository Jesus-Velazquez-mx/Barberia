import { useCallback, useEffect, useState } from 'react';
import QrCodeComponent from '../components/QRcode/QrCodeComponent';
import { useAuth } from '../context/AuthContext';
import { generateTelegramQr } from '../services/qrService';
import { getClientById } from '../services/clientService';

export function QrContainer() {
    const [qrCode, setQrCode] = useState<string>('');
    const [isLinked, setIsLinked] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const { user, token } = useAuth();

    /* Checa si hay un clientTelegramId vinculado*/
    const checkTelegramStatus = useCallback(async () => {
        if (!user?.id || !token) return;

        try {
            setIsChecking(true);
            const client = await getClientById(user.id, token);
            /* True o False dependientendo del clientTelegramId */
            const hasTelegram = Boolean(client.clientTelegramId);
            setIsLinked(hasTelegram);
            if (!hasTelegram && !qrCode) {
                /* Aquí se genera el QR */
                const url = await generateTelegramQr(user.id);
                setQrCode(url);
            }
        } catch (error) {
            console.error('Error al verificar vinculación de Telegram:', error);
        } finally {
            setIsLoading(false);
            setIsChecking(false);
        }
    }, [user?.id, token, qrCode]);

    useEffect(() => {
        void checkTelegramStatus();
    }, [checkTelegramStatus]);

    /* Si el usuario abre Telegram en el mismo dispositivo y vuelve a la pestaña, verifica solo (VIBECODEADO) */
    useEffect(() => {
        if (isLinked) return;

        const handleWindowFocus = () => {
            void checkTelegramStatus();
        };

        window.addEventListener('focus', handleWindowFocus);
        return () => window.removeEventListener('focus', handleWindowFocus);
    }, [isLinked, checkTelegramStatus]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <QrCodeComponent
                qrCode={qrCode}
                isLinked={isLinked}
                isLoading={isLoading}
                isChecking={isChecking}
                onVerify={() => void checkTelegramStatus()}
            />
        </div>
    );
}