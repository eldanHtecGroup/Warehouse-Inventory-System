import itemApi from '../api/item.api.js';
import useFetch from '../hooks/useFetch.js';
import ItemTable from '../components/ItemTable.jsx';
import Loader from '../components/common/Loader.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';

const ItemsPage = () => {
  const { data: items, error, isLoading, refetch } = useFetch(itemApi.getAll);

  return (
    <section>
      <h1>Items</h1>
      {isLoading && <Loader />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}
      {items && <ItemTable items={items} />}
    </section>
  );
};

export default ItemsPage;
