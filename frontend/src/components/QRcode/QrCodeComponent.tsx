type QrCodeComponentProps = {
    qrCode: string;
    isLinked: boolean;
    isLoading: boolean;
    isChecking: boolean;
    onVerify: () => void;
};

export default function QrCodeComponent({
    qrCode,
    isLinked,
    isLoading,
    isChecking,
    onVerify,
}: QrCodeComponentProps) {
    if (isLoading) {
        return (
            <div className="w-full max-w-sm mx-auto bg-[#1c1c1c] rounded-2xl shadow-xl border border-neutral-800 p-6 flex flex-col items-center">
                <div className="w-56 h-56 rounded-xl bg-neutral-800 animate-pulse" />
                <span className="text-xs text-neutral-400 mt-4">Verificando estado...</span>
            </div>
        );
    }

    if (isLinked) {
        return (
            <div className="w-full max-w-sm mx-auto bg-[#1c1c1c] rounded-2xl shadow-xl border border-neutral-800 p-6 flex flex-col items-center text-center">
                <span className="inline-flex items-center px-3 py-1  text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-4">
                    Notificaciones Activas
                </span>

                <div className="w-16 h-16 rounded-full bg-[#a68553]/15 border border-[#a68553]/40 flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-[#d4b075]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight">
                    Telegram vinculado
                </h2>

                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                    Tu cuenta ya está conectada con <strong className="text-[#d4b075]">Mr. Barber</strong>. Recibirás recordatorios automáticos 24 horas y 4 horas antes de cada cita.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto bg-[#1c1c1c] rounded-2xl shadow-xl border border-neutral-800 p-6 flex flex-col items-center text-center">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[#a68553]/15 text-[#d4b075] border border-[#a68553]/30 mb-3">
                Notificaciones Telegram
            </span>

            <h2 className="text-xl font-bold text-white tracking-tight">
                Vincula tu cuenta
            </h2>

            <p className="text-sm text-neutral-400 mt-1.5 mb-6 leading-relaxed">
                Escanea este código QR con tu celular para recibir recordatorios automáticos de tus citas.
            </p>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-[#a68553]/60 shadow-md">
                {qrCode ? (
                    <img
                        src={qrCode}
                        alt="Telegram QR code"
                        className="w-56 h-56 object-contain rounded-lg"
                    />
                ) : (
                    <div className="w-56 h-56 rounded-lg bg-neutral-200 animate-pulse flex items-center justify-center">
                        <span className="text-xs font-medium text-neutral-500">Generando QR...</span>
                    </div>
                )}
            </div>

            <p className="mt-5 text-xs text-neutral-400 leading-relaxed">
                Apunta con la cámara de tu teléfono y presiona{' '}
                <strong className="font-semibold text-[#d4b075]">Iniciar</strong> en Telegram.
            </p>

            <button
                type="button"
                onClick={onVerify}
                disabled={isChecking}
                className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#a68553] hover:bg-[#b8955f] disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
                {isChecking ? 'Verificando...' : 'Ya escanee el código'}
            </button>
        </div>
    );
}