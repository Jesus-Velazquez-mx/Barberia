import { Link } from 'react-router-dom';

// Example page — copy this pattern when adding a new route: a component in
// `src/pages/`, registered in `src/router.tsx`.
function ExamplePage() {
  return (
    <section>
      <h1>Example page</h1>
      <p>This page lives at src/pages/ExamplePage.tsx and is registered as the "/" route in src/router.tsx.</p>
      <Link to="/">Home</Link>
    </section>
  );
}

export default ExamplePage;
