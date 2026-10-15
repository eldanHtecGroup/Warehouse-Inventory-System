import { Link } from 'react-router';

import { ROUTES } from '../constants/routes.js';
import PageHeader from '../components/common/PageHeader.jsx';

const NotFoundPage = () => (
  <>
    <PageHeader title="Page not found" />
    <p>
      <Link to={ROUTES.HOME}>Back to dashboard</Link>
    </p>
  </>
);

export default NotFoundPage;
