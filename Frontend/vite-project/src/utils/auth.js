import { jwtDecode } from 'jwt-decode';

export function getRoleFromToken(token) {
  try {
    const decoded = jwtDecode(token);

    // Direct field
    if (decoded.role) return normalize(decoded.role);

    // Array of roles
    if (Array.isArray(decoded.roles) && decoded.roles.length) {
      return pickPreferred(decoded.roles.map(normalize));
    }

    // Spring Security authorities (could be collection or string)
    if (decoded.authorities) {
      const authorities = Array.isArray(decoded.authorities)
        ? decoded.authorities
        : typeof decoded.authorities === 'string'
          ? decoded.authorities.split(/[,\s]+/)
          : [];
      if (authorities.length) {
        return pickPreferred(authorities.map(a => normalize(a.replace(/^ROLE_/i, ''))));
      }
    }

    // scope claim (OAuth2) as fallback
    if (decoded.scope) {
      const scopes = typeof decoded.scope === 'string' ? decoded.scope.split(/\s+/) : decoded.scope;
      const maybe = scopes.map(normalize).find(r => ['ADMIN','STAFF','CLIENT'].includes(r));
      if (maybe) return maybe;
    }
    return null;
  } catch (error) {
    console.error('Decode token failed', error);
    return null;
  }
}

function normalize(r) {
  if (!r) return null;
  return String(r).toUpperCase();
}

function pickPreferred(list) {
  // Priority order
  const priority = ['ADMIN','STAFF','CLIENT'];
  for (const p of priority) {
    if (list.includes(p)) return p;
  }
  return list[0] || null;
}
