import { useEffect, useState } from 'react';
import { getHaircutImageUrl } from '../services/recommendationService';
import type { HaircutStyle } from '../types/recommendation';

/* Descarga la imagen en segundo plano para que el navegador la tenga en caché cuando se muestre. */
const preloadImage = (url: string) =>
    new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('Image could not be loaded'));
        image.src = url;
    });

/*
 * Precarga las fotos de catálogo de los cortes dados: pide la URL presignada de cada uno y descarga la imagen.
 * Devuelve las URLs por id de corte, solo de los cortes cuya foto se pudo cargar (los demás no aparecen).
 * No pasa nada si una foto falla: simplemente no se incluye. Pasa `haircuts` con referencia estable.
 */
export function useHaircutImageUrls(haircuts: HaircutStyle[], enabled = true): Record<string, string> {
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;

        haircuts.forEach(async ({ id }) => {
            try {
                const { url } = await getHaircutImageUrl(id);
                await preloadImage(url);
                if (!cancelled) setImageUrls((current) => ({ ...current, [id]: url }));
            } catch {
                // Sin foto (404), red caída o imagen inválida: el corte se muestra solo con su nombre
            }
        });

        return () => {
            cancelled = true;
        };
    }, [haircuts, enabled]);

    return imageUrls;
}
