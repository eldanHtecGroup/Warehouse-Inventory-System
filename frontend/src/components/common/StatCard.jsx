const StatCard = ({ label, value, tone }) => (
  <div className={`stat-card${tone ? ` stat-card--${tone}` : ''}`}>
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__value">{value}</span>
  </div>
);

export default StatCard;
