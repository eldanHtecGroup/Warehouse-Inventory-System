// Table header cell that toggles sorting. Clicking the active column flips the order.
const SortableHeader = ({ field, label, sortBy, order, onSort, className }) => {
  const isActive = sortBy === field;
  const ariaSort = isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none';

  const handleClick = () => {
    onSort(field, isActive && order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <th className={className} aria-sort={ariaSort}>
      <button type="button" className={`sort-button${isActive ? ' sort-button--active' : ''}`} onClick={handleClick}>
        {label}
        <span aria-hidden="true">{isActive ? (order === 'asc' ? ' ▲' : ' ▼') : ' ↕'}</span>
      </button>
    </th>
  );
};

export default SortableHeader;
