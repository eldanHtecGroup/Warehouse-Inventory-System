import httpClient from './httpClient.js';

const getHealth = (options) => httpClient.get('/health', options);

export default { getHealth };
