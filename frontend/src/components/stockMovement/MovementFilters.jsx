import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/inventory.js';

const MovementFilters = ({ query, onChange, onReset }) => {
  const handleChange = (event) => onChange({ [event.target.name]: event.target.value });

  return (
    <form className="filters" onSubmit={(event) => event.preventDefault()}>
      <label className="filters__field">
        Type
        <select name="type" value={query.type ?? ''} onChange={handleChange}>
          <option value="">All types</option>
          {Object.values(MOVEMENT_TYPES).map((type) => (
            <option key={type} value={type}>
              {MOVEMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        From
        <input type="date" name="from" value={query.from ?? ''} max={query.to || undefined} onChange={handleChange} />
      </label>

      <label className="filters__field">
        To
        <input type="date" name="to" value={query.to ?? ''} min={query.from || undefined} onChange={handleChange} />
      </label>

      <label className="filters__field">
        Order
        <select name="order" value={query.order} onChange={handleChange}>
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </label>

      <button type="button" className="button filters__reset" onClick={onReset}>
        Reset filters
      </button>
    </form>
  );
};

export default MovementFilters;
