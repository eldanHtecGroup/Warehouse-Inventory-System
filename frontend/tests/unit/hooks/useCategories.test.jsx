import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import categoryApi from '../../../src/api/category.api.js';
import useCategories from '../../../src/hooks/useCategories.js';
import { buildCategory } from '../../helpers/fixtures.js';

describe('useCategories', () => {
  it('returns an empty list while loading, then the categories', async () => {
    const categories = [buildCategory()];
    vi.spyOn(categoryApi, 'getAll').mockResolvedValue(categories);

    const { result } = renderHook(() => useCategories());

    expect(result.current.categories).toEqual([]);
    await waitFor(() => expect(result.current.categories).toEqual(categories));
    expect(result.current.isLoading).toBe(false);
  });
});
