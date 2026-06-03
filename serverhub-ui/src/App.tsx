import { useStore } from './store/useStore';
import { useMockMetrics } from './hooks/useMockMetrics';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';

export default function App() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  useMockMetrics();

  return isAuthenticated ? <Layout /> : <Login />;
}
