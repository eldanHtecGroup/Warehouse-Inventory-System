import { mock } from 'node:test';

// Minimal stand-ins for Express req/res objects used by middleware and controller unit tests

export const createReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  validated: {},
  ...overrides,
});

export const createRes = () => {
  const res = { statusCode: 200, headersSent: false, body: undefined, headers: {} };
  res.status = mock.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = mock.fn((body) => {
    res.body = body;
    return res;
  });
  res.send = mock.fn((body) => {
    res.body = body;
    return res;
  });
  res.setHeader = mock.fn((name, value) => {
    res.headers[name.toLowerCase()] = value;
  });
  return res;
};

export const createLog = () => ({
  error: mock.fn(),
  warn: mock.fn(),
  info: mock.fn(),
  debug: mock.fn(),
});
