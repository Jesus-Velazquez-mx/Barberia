import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, LoginResponse, User } from '../types/auth';

/* Se usa la interfaz para definir los "values" del contexto*/
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    /* Sacar los datos del navegador */
    useEffect(() => {
        /* Token actual */
        const storedToken = localStorage.getItem('token');
        /* User actual */
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken); // asignar token
            setUser(JSON.parse(storedUser)); // asignar user
        }
    }, []);

    /* Login => Guarda el token y user en el navegador. */
    const login = (data: LoginResponse) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
    };

    /* Logout => Elimina el token y user del navegador. */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    /* Está autenticado si hay token */
    const isAuthenticated = !!token;

    /* Debe de coincidir con la interfaz AuthContextValue */
    const exportedValues = {
        user,
        token,
        isAuthenticated,
        login,
        logout
    }

    /* Cualquier cosa que esté dentro el AuthContext.Provider tiene acceso a los valores exportados */
    return (
        <AuthContext.Provider value={exportedValues} >
            {children}
        </AuthContext.Provider>
    );
}

/* Hook personalizado para no tener que usar useContext directamente */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}