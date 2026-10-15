import { useEffect, useRef, useState } from 'react';

const TEXT_FILTERS = ['search', 'minPrice', 'maxPrice', 'minQuantity', 'maxQuantity'];
const DEBOUNCE_MS = 400;

const pickTextFilters = (query) => Object.fromEntries(TEXT_FILTERS.map((key) => [key, query[key] ?? '']));

const RangeFilter = ({ legend, names: [minName, maxName], step, values, onChange }) => (
  <fieldset className="filters__range">
    <legend>{legend}</legend>
    <div className="filters__range-inputs">
      <input
        type="number"
        name={minName}
        aria-label={`Minimum ${legend.toLowerCase()}`}
        placeholder="Min"
        min="0"
        step={step}
        value={values[minName]}
        onChange={onChange}
      />
      <span aria-hidden="true">–</span>
      <input
        type="number"
        name={maxName}
        aria-label={`Maximum ${legend.toLowerCase()}`}
        placeholder="Max"
        min="0"
        step={step}
        value={values[maxName]}
        onChange={onChange}
      />
    </div>
  </fieldset>
);

// Typed filters are debounced so the list isn't refetched on every keystroke;
// select filters are applied immediately.
const ProductFilters = ({ query, categories, onChange, onReset }) => {
  const [draft, setDraft] = useState(() => pickTextFilters(query));
  const pending = useRef({});
  const timer = useRef(null);

  // When the URL changes from outside (e.g. a navigation link), copy the new values into
  // the inputs. Fields whose trimmed text already matches the URL keep what the user typed.
  const queryText = pickTextFilters(query);
  const queryKey = JSON.stringify(queryText);
  const [syncedQueryKey, setSyncedQueryKey] = useState(queryKey);
  if (queryKey !== syncedQueryKey) {
    setSyncedQueryKey(queryKey);
    setDraft((current) =>
      Object.fromEntries(
        TEXT_FILTERS.map((key) => [key, current[key].trim() === queryText[key] ? current[key] : queryText[key]]),
      ),
    );
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));

    pending.current = { ...pending.current, [name]: value.trim() };
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange(pending.current);
      pending.current = {};
    }, DEBOUNCE_MS);
  };

  const handleSelectChange = (event) => onChange({ [event.target.name]: event.target.value });

  const handleReset = () => {
    clearTimeout(timer.current);
    pending.current = {};
    setDraft(pickTextFilters({}));
    onReset();
  };

  return (
    <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="filters__field filters__field--wide">
        Search
        <input
          type="search"
          name="search"
          placeholder="Name or code"
          value={draft.search}
          onChange={handleTextChange}
          maxLength={100}
        />
      </label>

      <label className="filters__field">
        Category
        <select name="categoryId" value={query.categoryId ?? ''} onChange={handleSelectChange}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filters__field">
        Availability
        <select name="inStock" value={query.inStock ?? ''} onChange={handleSelectChange}>
          <option value="">All</option>
          <option value="true">In stock</option>
          <option value="false">Out of stock</option>
        </select>
      </label>

      <RangeFilter
        legend="Price"
        names={['minPrice', 'maxPrice']}
        step="0.01"
        values={draft}
        onChange={handleTextChange}
      />
      <RangeFilter
        legend="Quantity"
        names={['minQuantity', 'maxQuantity']}
        step="1"
        values={draft}
        onChange={handleTextChange}
      />

      <button type="button" className="button filters__reset" onClick={handleReset}>
        Reset filters
      </button>
    </form>
  );
};

export default ProductFilters;
