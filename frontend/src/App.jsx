import { BrowserRouter } from 'react-router';

import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import ToastProvider from './context/ToastProvider.jsx';
import AppRouter from './routes/AppRouter.jsx';

// Last-resort boundary; pages have their own inside MainLayout so the navbar stays usable
const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
