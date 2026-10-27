import { createContext, useContext, useState, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import router from '../router';
import type { AuthContextValue, LoginResponse, User } from '../types/auth';
import { isStoredTokenValid, isStoredUserValid } from '../utils/userValidation';
import { setUnauthorizedHandler } from '../services/apiClient';
import { Modal } from '../components/ModalComponent';
import { Button } from '../components/ButtonComponent';
import { ShieldAlert } from 'lucide-react';

/* Páginas donde nunca debe mostrarse el modal de sesión inválida (Landing, Login, Register) */
const PUBLIC_PATHS = ['/', '/login', '/register'];

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/* Fecha de expiración (ms) leída del claim `exp` del JWT, o null si no se puede leer */
function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/* Se usa la interfaz para definir los "values" del contexto*/
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  /* true mientras no se ha revisado el localStorage; evita redirecciones prematuras en las rutas protegidas */
  const [isLoading, setIsLoading] = useState(true);
  /* true solo cuando había una sesión guardada y resultó inválida o expirada */
  const [isSessionInvalid, setIsSessionInvalid] = useState(false);
  /* El AuthProvider vive fuera del router, así que se observa la ubicación desde el router */
  const pathname = useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => router.state.location.pathname
  );

  /* Sacar los datos del navegador (solo al montar) */
  useEffect(() => {
    const restoreSession = async () => {
      /* Token actual */
      const storedToken = localStorage.getItem('token');
      /* User actual */
      const storedUser = localStorage.getItem('user');

      let parsedUser: User | null;
      try {
        parsedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        parsedUser = null;
      }

      const tokenValid = storedToken ? await isStoredTokenValid(storedToken) : false;
      const sessionValid = tokenValid && isStoredUserValid(parsedUser);

      if (sessionValid) {
        setToken(storedToken); // asignar token
        setUser(parsedUser); // asignar user
      } else {
        /* Solo es una sesión inválida si existía algo guardado */
        setIsSessionInvalid(!!storedToken || !!storedUser);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };

    void restoreSession();
  }, []);

  /* Mientras haya sesión, se avisa al modal cuando el token expira (por tiempo) o el backend responde 401.
     No se limpia la sesión aquí: eso redirigiría a /login (ruta pública) antes de mostrar el modal;
     la sesión se limpia hasta que el usuario presiona "Aceptar" (logout). */
  useEffect(() => {
    if (!token) return;

    const markSessionInvalid = () => setIsSessionInvalid(true);
    setUnauthorizedHandler(markSessionInvalid);

    const expiresAt = getTokenExpiration(token);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (expiresAt !== null) {
      /* setTimeout no admite retardos mayores a ~24.8 días */
      timeoutId = setTimeout(markSessionInvalid, Math.min(Math.max(expiresAt - Date.now(), 0), MAX_TIMEOUT_MS));
    }

    return () => {
      setUnauthorizedHandler(null);
      clearTimeout(timeoutId);
    };
  }, [token]);

  /* Login => Guarda el token y user en el navegador. */
  const login = (data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsSessionInvalid(false);
  };

  /* Logout => Elimina el token y user del navegador. */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsSessionInvalid(false);
  };

  /* Está autenticado si hay token */
  const isAuthenticated = !!token;

  /* Debe de coincidir con la interfaz AuthContextValue */
  const exportedValues = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  /* Cualquier cosa que esté dentro el AuthContext.Provider tiene acceso a los valores exportados */
  return (
    <AuthContext.Provider value={exportedValues}>
      {children}
      <SessionInvalidModal isOpen={isSessionInvalid && !PUBLIC_PATHS.includes(pathname)} onClose={logout} />
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

function SessionInvalidModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOutsideClick={false} className="max-w-md! pb-8! text-center!">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-(--accent)/40 bg-(--accent)/10">
        <ShieldAlert size={30} strokeWidth={1.8} className="text-(--accent)" aria-hidden="true" />
      </div>

      <h2 className="mb-3! mt-5! font-sans! font-bold! tracking-normal! text-(--text-h)!">Tu sesión expiró</h2>
      <p className="mx-auto max-w-sm text-(--text)">
        Por seguridad, debes iniciar sesión nuevamente para continuar usando tu cuenta.
      </p>

      <Button onClick={onClose} className="mt-7! h-12! w-full! normal-case!">
        Continuar
      </Button>
    </Modal>
  );
}
