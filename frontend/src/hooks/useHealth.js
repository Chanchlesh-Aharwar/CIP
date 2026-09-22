import { useEffect, useState } from 'react';
import api from '../services/api';

export default function useHealth() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return { status, error };
}
