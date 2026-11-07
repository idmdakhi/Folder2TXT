import axios from 'axios';
import { uploadToGist, uploadMultipleFilesToGist, validateGithubToken } from '../../src/services/githubService';

jest.mock('axios');
const post = axios.post as jest.Mock;
const get = axios.get as jest.Mock;
const token = 'synthetic-test-token';

beforeEach(() => jest.resetAllMocks());

describe('Gist uploads', () => {
  it('defaults to a private gist and sends authentication headers', async () => {
    post.mockResolvedValue({ status: 201, data: { id: '123', html_url: 'https://gist.github.com/123' } });
    expect(await uploadToGist('hello', { token })).toEqual({ success: true, gistId: '123', gistUrl: 'https://gist.github.com/123' });
    expect(post).toHaveBeenCalledWith('https://api.github.com/gists', { description: 'Project export via folder2text', public: false, files: { 'project-export.txt': { content: 'hello' } } }, { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'folder2text-cli' } });
  });

  it('honors custom filename, visibility and description including empty content', async () => {
    post.mockResolvedValue({ status: 201, data: { id: '123' } });
    await uploadToGist('', { token, filename: 'custom.md', description: 'Example', public: true });
    expect(post.mock.calls[0][1]).toEqual({ description: 'Example', public: true, files: { 'custom.md': { content: '' } } });
  });

  it.each(['', '123456789'])('rejects a short token without a request: %j', async invalid => {
    expect((await uploadToGist('text', { token: invalid })).success).toBe(false);
    expect((await uploadMultipleFilesToGist([{ filename: 'a', content: '' }], { token: invalid })).success).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it.each([0, 101])('rejects %i files without a request', async count => {
    const files = Array.from({ length: count }, (_, i) => ({ filename: `${i}.txt`, content: 'text' }));
    expect((await uploadMultipleFilesToGist(files, { token })).success).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it('accepts exactly 100 files with a minimum length token', async () => {
    post.mockResolvedValue({ status: 201, data: { id: '123', html_url: 'url' } });
    const files = Array.from({ length: 100 }, (_, i) => ({ filename: `${i}.txt`, content: `text ${i}` }));
    expect(await uploadMultipleFilesToGist(files, { token: '1234567890', public: true, description: 'many' })).toEqual({ success: true, gistId: '123', gistUrl: 'url' });
    expect(Object.keys(post.mock.calls[0][1].files)).toHaveLength(100);
    expect(post.mock.calls[0][1]).toMatchObject({ description: 'many', public: true, files: { '99.txt': { content: 'text 99' } } });
  });

  describe.each([
    ['single', () => uploadToGist('text', { token })],
    ['multiple', () => uploadMultipleFilesToGist([{ filename: 'a.txt', content: 'text' }], { token })],
  ] as const)('%s upload failures', (_name, upload) => {
    it.each([{ status: 200, data: { id: '123' } }, { status: 201, data: {} }])('rejects unsuccessful API responses: %j', async response => {
      post.mockResolvedValue(response);
      expect(await upload()).toMatchObject({ success: false, error: expect.stringContaining('Failed to create Gist') });
    });
    it.each([[401, /Invalid or expired/], [403, /permission/], [422, /Invalid request/], [500, /GitHub API error: 500/]] as const)('maps HTTP %i errors', async (status, message) => {
      post.mockRejectedValue({ response: { status, data: { message: 'failure' } } });
      expect(await upload()).toEqual({ success: false, error: expect.stringMatching(message) });
    });
    it('distinguishes network and local errors', async () => {
      post.mockRejectedValueOnce({ request: {} }).mockRejectedValueOnce(new Error('local failure')).mockRejectedValueOnce({});
      expect(await upload()).toMatchObject({ success: false, error: expect.stringContaining('Network error') });
      expect(await upload()).toEqual({ success: false, error: 'local failure' });
      expect(await upload()).toEqual({ success: false, error: 'An unexpected error occurred' });
    });
  });
});

describe('token validation', () => {
  it('returns the authenticated username', async () => {
    get.mockResolvedValue({ status: 200, data: { login: 'synthetic-user' } });
    expect(await validateGithubToken(token)).toEqual({ valid: true, username: 'synthetic-user' });
    expect(get).toHaveBeenCalledWith('https://api.github.com/user', { headers: expect.objectContaining({ Authorization: `token ${token}` }) });
  });
  it.each([{ status: 200, data: {} }, { status: 401, data: { login: 'user' } }])('rejects an invalid response: %j', async response => {
    get.mockResolvedValue(response);
    expect(await validateGithubToken(token)).toEqual({ valid: false });
  });
  it('returns false on request failure', async () => {
    get.mockRejectedValue(new Error('offline'));
    expect(await validateGithubToken(token)).toEqual({ valid: false });
  });
});
