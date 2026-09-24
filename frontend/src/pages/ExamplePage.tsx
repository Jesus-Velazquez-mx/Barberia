import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ExamplePage() {
  const { logout: logoutContext } = useAuth();
  const navigate = useNavigate();

  /* Borra el token y el user, y regresa al login*/
  const handleLogout = () => {
    logoutContext();
    navigate('/login');
  };

  return (
    <section style={{ padding: '2rem' }}>
      <h1>Example page</h1>
      <p>This page lives at src/pages/ExamplePage.tsx and is registered as the "/" route in src/router.tsx.</p>

      {/* Contenedor para separar el link del botón */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#a855f7', textDecoration: 'none' }}>Home</Link>

        {/* Botón de prueba. Se va a borrar */}
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          CERRAR SESIÓN
        </button>
      </div>
    </section>
  );
}

export default ExamplePage;