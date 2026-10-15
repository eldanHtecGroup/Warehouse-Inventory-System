import { BrowserRouter } from 'react-router';

import ToastProvider from './context/ToastProvider.jsx';
import AppRouter from './routes/AppRouter.jsx';

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </BrowserRouter>
);

export default App;
