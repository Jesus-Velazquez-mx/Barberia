import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
    title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
    const { logout: logoutContext } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutContext();
        navigate('/login');
    };

    return (
        <div>
            <h1>{title}</h1>
            <p>Esta es una página temporal. Será reemplazada por la vista real.</p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" style={{ color: '#a855f7', textDecoration: 'none' }}>Home</Link>
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
        </div>
    )
}