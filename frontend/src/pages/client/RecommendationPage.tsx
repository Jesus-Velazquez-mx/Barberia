import { RecommendationContainer } from '../../containers/RecommendationContainer';

function RecommendationPage() {
  return (
    <section className="flex w-full max-w-300 flex-col gap-8">
      <header>
        <h1 className="m-0 font-sans text-3xl font-semibold tracking-normal text-(--text-h)">Recomendación de corte</h1>
        <p className="mt-1 text-sm font-semibold text-(--text)">
          Sube o toma una foto, cuéntanos qué buscas y te sugerimos el corte ideal para ti.
        </p>
      </header>
      <RecommendationContainer />
    </section>
  );
}

export default RecommendationPage;
