import { Link } from 'react-router';
import { ROUTES } from '../constants/routes.js';

const NotFoundPage = () => (
  <section>
    <h1>Page not found</h1>
    <p>
      <Link to={ROUTES.HOME}>Back to dashboard</Link>
    </p>
  </section>
);

export default NotFoundPage;
