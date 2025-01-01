export const environment = {
  production: false,
  apiUrl: window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://visitor-tracking-api.vercel.app/api',
};
