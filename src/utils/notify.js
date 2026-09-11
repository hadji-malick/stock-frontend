import { toast } from 'react-hot-toast';

export const getErrorMessage = (err, fallback = 'Erreur') => {
  if (!err) return fallback;
  return (
    err.response?.data?.error ||
    err.response?.data?.message ||
    (typeof err === 'string' ? err : null) ||
    err.message ||
    fallback
  );
};

export const notifyError = (err, fallback = 'Erreur') => {
  const msg = getErrorMessage(err, fallback);
  toast.error(msg);
};

export default notifyError;
