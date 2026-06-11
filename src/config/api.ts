const HOSTED_API_BASE_URL = 'https://duckling-api-332057590473.us-central1.run.app';

export const CODE_API_BASE_URL =
  import.meta.env.VITE_CODE_API_BASE_URL ?? (import.meta.env.PROD ? HOSTED_API_BASE_URL : '');

export const COMPETE_API_BASE_URL =
  import.meta.env.VITE_COMPETE_API_BASE_URL ?? (import.meta.env.PROD ? `${HOSTED_API_BASE_URL}/api` : '/api');

export const AUTH_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

export const AUTH_API_ENABLED = import.meta.env.VITE_ENABLE_AUTH_API === 'true';
