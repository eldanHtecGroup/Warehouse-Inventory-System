const EmptyState = ({ title, children }) => (
  <div className="empty-state">
    <p className="empty-state__title">{title}</p>
    {children}
  </div>
);

export default EmptyState;
