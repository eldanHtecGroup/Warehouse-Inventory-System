import categoryApi from '../api/category.api.js';
import useFetch from './useFetch.js';

// Category list used by filters and forms
const useCategories = () => {
  const { data, error, isLoading, refetch } = useFetch(categoryApi.getAll);
  return { categories: data ?? [], error, isLoading, refetch };
};

export default useCategories;
