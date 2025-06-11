export const storeAuth = (token: string) => {
  localStorage.setItem('token', token);
  // HTTPS → secure cookie, localhost → no domain
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const domain = isLocal ? '' : `; domain=${location.hostname}`;
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax${secure}${domain}`;
}; 