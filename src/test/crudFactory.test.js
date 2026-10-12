import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCrudApi, downloadBlob } from '../api/crudFactory';
import axiosClient from '../api/axiosClient';

// Mock axiosClient (vi.mock se eleva automáticamente sobre los imports)
vi.mock('../api/axiosClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('crudFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCrudApi', () => {
    it('should create an API with all CRUD methods', () => {
      const api = createCrudApi('/test/path/');
      
      expect(api.getAll).toBeDefined();
      expect(api.getById).toBeDefined();
      expect(api.create).toBeDefined();
      expect(api.update).toBeDefined();
      expect(api.delete).toBeDefined();
    });

    it('getAll should call axiosClient.get with correct path', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.get.mockResolvedValue({ data: { results: [] } });

      await api.getAll();

      expect(axiosClient.get).toHaveBeenCalledWith('/test/path/', { params: {} });
    });

    it('getAll should pass params to axiosClient.get', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.get.mockResolvedValue({ data: { results: [] } });

      await api.getAll({ search: 'test' });

      expect(axiosClient.get).toHaveBeenCalledWith('/test/path/', { params: { search: 'test' } });
    });

    it('getAll should return results or data from response', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });

      const result = await api.getAll();

      expect(result).toEqual([{ id: 1 }]);
    });

    it('getAll should fallback to local store on error', async () => {
      const api = createCrudApi('/test/path/', [{ id: 1, name: 'Test' }]);
      axiosClient.get.mockRejectedValue(new Error('Network error'));

      const result = await api.getAll();

      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('getById should call axiosClient.get with correct path', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.get.mockResolvedValue({ data: { id: 1 } });

      await api.getById(1);

      expect(axiosClient.get).toHaveBeenCalledWith('/test/path/1/');
    });

    it('getById should return data from response', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.get.mockResolvedValue({ data: { id: 1, name: 'Test' } });

      const result = await api.getById(1);

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('getById should fallback to local store on error', async () => {
      const api = createCrudApi('/test/path/', [{ id: 1, name: 'Test' }]);
      axiosClient.get.mockRejectedValue(new Error('Network error'));

      const result = await api.getById(1);

      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('create should call axiosClient.post with correct path and data', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'New' };
      axiosClient.post.mockResolvedValue({ data: { id: 2, ...data } });

      await api.create(data);

      expect(axiosClient.post).toHaveBeenCalledWith('/test/path/', data);
    });

    it('create should return data from response', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'New' };
      axiosClient.post.mockResolvedValue({ data: { id: 2, ...data } });

      const result = await api.create(data);

      expect(result).toEqual({ id: 2, name: 'New' });
    });

    it('create should fallback to local store on error without response', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'New' };
      axiosClient.post.mockRejectedValue(new Error('Network error'));

      const result = await api.create(data);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New');
    });

    it('create should throw error if backend responds with error', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'New' };
      const error = new Error('Validation error');
      error.response = { status: 400 };
      axiosClient.post.mockRejectedValue(error);

      await expect(api.create(data)).rejects.toThrow();
    });

    it('update should call axiosClient.put with correct path and data', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'Updated' };
      axiosClient.put.mockResolvedValue({ data: { id: 1, ...data } });

      await api.update(1, data);

      expect(axiosClient.put).toHaveBeenCalledWith('/test/path/1/', data);
    });

    it('update should return data from response', async () => {
      const api = createCrudApi('/test/path/');
      const data = { name: 'Updated' };
      axiosClient.put.mockResolvedValue({ data: { id: 1, ...data } });

      const result = await api.update(1, data);

      expect(result).toEqual({ id: 1, name: 'Updated' });
    });

    it('update should fallback to local store on error without response', async () => {
      const api = createCrudApi('/test/path/', [{ id: 1, name: 'Old' }]);
      const data = { name: 'Updated' };
      axiosClient.put.mockRejectedValue(new Error('Network error'));

      const result = await api.update(1, data);

      expect(result).toEqual({ id: 1, name: 'Updated' });
    });

    it('delete should call axiosClient.delete with correct path', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.delete.mockResolvedValue({});

      await api.delete(1);

      expect(axiosClient.delete).toHaveBeenCalledWith('/test/path/1/');
    });

    it('delete should return true on success', async () => {
      const api = createCrudApi('/test/path/');
      axiosClient.delete.mockResolvedValue({});

      const result = await api.delete(1);

      expect(result).toBe(true);
    });

    it('delete should fallback to local store on error without response', async () => {
      const api = createCrudApi('/test/path/', [{ id: 1, name: 'Test' }]);
      axiosClient.delete.mockRejectedValue(new Error('Network error'));

      const result = await api.delete(1);

      expect(result).toBe(true);
    });

    it('should use custom filter function when provided', async () => {
      const customFilter = (items, params) => {
        if (params.category) {
          return items.filter(item => item.category === params.category);
        }
        return items;
      };
      const api = createCrudApi('/test/path/', [{ id: 1, category: 'A' }, { id: 2, category: 'B' }], customFilter);
      axiosClient.get.mockRejectedValue(new Error('Network error'));

      const result = await api.getAll({ category: 'A' });

      expect(result).toEqual([{ id: 1, category: 'A' }]);
    });
  });

  describe('downloadBlob', () => {
    it('should create download link and trigger click', () => {
      const mockBlob = new Blob(['test data'], { type: 'text/plain' });
      const mockUrl = 'blob:test-url';
      
      const urlSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: vi.fn(),
      });
      const revokeObjectUrlSpy = vi.spyOn(window.URL, 'revokeObjectURL');

      downloadBlob(mockBlob, 'text/plain', 'test.txt');

      expect(urlSpy).toHaveBeenCalledWith(mockBlob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith(mockUrl);

      urlSpy.mockRestore();
      createElementSpy.mockRestore();
      revokeObjectUrlSpy.mockRestore();
    });
  });
});
