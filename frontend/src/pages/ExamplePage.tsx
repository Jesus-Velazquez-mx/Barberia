import { Link, useNavigate } from 'react-router-dom';

function ExamplePage() {
  const navigate = useNavigate();

  return (
    <section style={{ padding: '2rem' }}>
      <h1>Example page</h1>
      <p>This page lives at src/pages/ExamplePage.tsx and is registered as the "/" route in src/router.tsx.</p>

      {/* Contenedor para separar los elementos */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#a855f7', textDecoration: 'none' }}>Home</Link>

        {/* Botón para ir al Login */}
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          IR AL LOGIN
        </button>
      </div>
    </section>
  );
}

export default ExamplePage;