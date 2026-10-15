import config from '../../config/index.js';

// React 19 hoists <title> into <head>, so each page sets the browser tab title here
const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <title>{`${title} · ${config.appName}`}</title>
    <div>
      <h1>{title}</h1>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);

export default PageHeader;
