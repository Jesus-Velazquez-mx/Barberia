import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientLoyaltyProgress } from '../components/profile/ClientLoyaltyProgressComponent';
import { useAuth } from '../context/AuthContext';
import { getLoyaltyStatus } from '../services/loyaltyService';
import type { LoyaltyStatus } from '../types/loyaltyType';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const DEFAULT_LOYALTY_ERROR = 'No se pudo cargar tu progreso de lealtad. Intenta de nuevo.';

export function ClientLoyaltyContainer() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<LoyaltyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const userId = user?.id;
  const userRole = user?.role;

  const loadLoyaltyStatus = useCallback(
    async (silent = false) => {
      if (!token || !userId || userRole !== 'client') return;

      const requestId = ++requestIdRef.current;
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await getLoyaltyStatus(token, userId);
        if (requestId !== requestIdRef.current) return;
        setStatus(data);
        setError(null);
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;
        if (!silent) {
          setError(getApiErrorMessage(err, DEFAULT_LOYALTY_ERROR));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [token, userId, userRole]
  );

  useEffect(() => {
    void loadLoyaltyStatus(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadLoyaltyStatus]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') {
        void loadLoyaltyStatus(true);
      }
    };

    const handleWindowFocus = () => {
      void loadLoyaltyStatus(true);
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', refreshOnReturn);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [loadLoyaltyStatus]);

  if (!user || !token || user.role !== 'client') return null;

  return (
    <ClientLoyaltyProgress
      status={status}
      isLoading={isLoading}
      error={error}
      onRetry={() => void loadLoyaltyStatus(false)}
      onBookAppointment={() => navigate('/client/booking')}
      onViewAppointments={() => navigate('/client/appointments')}
    />
  );
}
