import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import useQueryParams from '../../../src/hooks/useQueryParams.js';

const DEFAULTS = { sortBy: 'name', page: '1' };

const setup = (initialUrl) =>
  renderHook(
    () => {
      const [query, updateQuery] = useQueryParams(DEFAULTS);
      return { query, updateQuery, search: useLocation().search };
    },
    { wrapper: ({ children }) => <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter> },
  );

describe('useQueryParams', () => {
  it('merges URL params over the defaults', () => {
    const { result } = setup('/products?sortBy=price&search=tea');
    expect(result.current.query).toEqual({ sortBy: 'price', page: '1', search: 'tea' });
  });

  it('sets values and removes empty or default ones from the URL', () => {
    const { result } = setup('/products?search=tea&page=3');

    act(() => result.current.updateQuery({ categoryId: 2, search: '', page: 1, inStock: null, other: undefined }));

    expect(result.current.search).toBe('?categoryId=2');
    expect(result.current.query).toEqual({ sortBy: 'name', page: '1', categoryId: '2' });
  });

  it('keeps params that are not being updated', () => {
    const { result } = setup('/products?search=tea');
    act(() => result.current.updateQuery({ sortBy: 'price' }));
    expect(result.current.search).toBe('?search=tea&sortBy=price');
  });
});
