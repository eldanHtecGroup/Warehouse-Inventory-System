import healthApi from '../api/health.api.js';
import useFetch from '../hooks/useFetch.js';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

const HomePage = () => {
  const { data: health, error, isLoading, refetch } = useFetch(healthApi.getHealth);

  return (
    <section>
      <h1>Dashboard</h1>
      <h2>API status</h2>
      {isLoading && <Loader label="Checking API..." />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {health && (
        <p>
          Backend is <strong>{health.status}</strong> (uptime {Math.round(health.uptime)}s)
        </p>
      )}
    </section>
  );
};

export default HomePage;
