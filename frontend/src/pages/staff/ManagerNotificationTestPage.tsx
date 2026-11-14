import { useState } from 'react';
import { BellRing, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { reminderTest, type TestReminderResult } from '../../services/notificationTestService';
import { useAuth } from '../../context/AuthContext';

function ManagerNotificationTest() {
    const { user, token } = useAuth();
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<TestReminderResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const onClick = async () => {
        if (!user?.id || !token || isSending) return;

        setIsSending(true);
        setResult(null);
        setErrorMsg(null);

        try {
            const response = await reminderTest(token);
            setResult(response);
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Ocurrió un error al enviar las notificaciones de prueba.';
            setErrorMsg(message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="w-full max-w-md mx-auto bg-[#1c1c1c] rounded-2xl shadow-xl border border-neutral-800 p-6 flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-semibold bg-[#a68553]/15 text-[#d4b075] border border-[#a68553]/30 mb-4">
                    <BellRing className="w-3.5 h-3.5" />
                    Envío Manual de Recordatorios
                </span>

                <h2 className="text-xl font-bold text-white tracking-tight">
                    Recordatorios de Telegram
                </h2>

                <p className="text-sm text-neutral-400 mt-2 mb-6 leading-relaxed">
                    Ejecuta un envío manual de prueba para las citas próximas (24h y 4h) sin registrar cambios en la bitácora del sistema.
                </p>

                <button
                    type="button"
                    onClick={onClick}
                    disabled={isSending || !token}
                    className="w-full py-3 px-5 rounded-xl text-sm font-semibold bg-[#a68553] hover:bg-[#b8955f] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-black/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isSending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando recordatorios...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Envío manual de notificaciones
                        </>
                    )}
                </button>

                {result && (
                    <div className="mt-5 w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-left">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Envío de prueba completado
                        </div>
                        <ul className="text-xs text-neutral-300 space-y-1">
                            <li>
                                • Citas detectadas en ventana: <strong className="text-white">{result.totalFound}</strong>
                            </li>
                            <li>
                                • Mensajes enviados: <strong className="text-white">{result.sent}</strong>
                            </li>
                            <li>
                                • Sin Telegram vinculado: <strong className="text-white">{result.withoutTelegram}</strong>
                            </li>
                            <li>
                                • Fallidos: <strong className="text-white">{result.failed}</strong>
                            </li>
                        </ul>
                    </div>
                )}

                {errorMsg && (
                    <div className="mt-5 w-full rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 flex items-start gap-2.5 text-left">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-rose-300 leading-relaxed">{errorMsg}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManagerNotificationTest;