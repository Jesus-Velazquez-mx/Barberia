import gallery1 from '../../assets/images/gallery-1.webp';
import gallery2 from '../../assets/images/gallery-2.webp';
import gallery3 from '../../assets/images/gallery-3.webp';
import gallery4 from '../../assets/images/gallery-4.webp';
import gallery5 from '../../assets/images/gallery-5.webp';
import gallery6 from '../../assets/images/gallery-6.webp';

const GALLERY_IMAGES = [gallery1, gallery2, gallery3, gallery4, gallery5];

export function Gallery() {
  return (
    <section id="galeria" className="bg-[#141414] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            Portafolio visual
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Una nueva forma de hacer arte
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Una muestra de nuestra precisión, técnica y resultados.
          </p>
        </div>

        {/* group/gallery: al hacer hover en el contenedor todas bajan opacidad;
            la foto puntual bajo el cursor usa su propio :hover (con !important)
            para regresar a opacidad completa y ganarle el borde dorado. */}
        <div className="group/gallery mt-14 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
          {GALLERY_IMAGES.map((src, i) => (
            <div
              key={src}
              className="overflow-hidden rounded-lg border-2 border-transparent opacity-100 transition-all duration-300 group-hover/gallery:opacity-40 hover:!opacity-100 hover:!border-[var(--accent)] hover:!shadow-[0_0_20px_rgba(210,172,102,0.45)]"
            >
              <img
                src={src}
                alt={`Trabajo realizado ${i + 1}`}
                className="h-64 w-full object-cover sm:h-80 lg:h-96"
              />
            </div>
          ))}

          <div className="overflow-hidden rounded-lg border-2 border-transparent opacity-100 transition-all duration-300 group-hover/gallery:opacity-40 hover:!opacity-100 hover:!border-[var(--accent)] hover:!shadow-[0_0_20px_rgba(210,172,102,0.45)] sm:hidden">
            <img src={gallery6} className="h-64 w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
