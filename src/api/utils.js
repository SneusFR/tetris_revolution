// api/utils.js
export const assetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // au cas où
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${base}${path}`;
};
