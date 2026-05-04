import type { HttpMethod } from '../../../shared/api/contracts.js';

export type RouteMatch = {
  params: Record<string, string>;
};

export type Route = {
  method: HttpMethod;
  path: string;
};

export function matchRoute(
  route: Route,
  method: string,
  pathname: string,
): RouteMatch | undefined {
  if (route.method !== method) {
    return undefined;
  }

  const routeParts = route.path.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (routeParts.length !== pathParts.length) {
    return undefined;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const pathPart = pathParts[index];

    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (routePart !== pathPart) {
      return undefined;
    }
  }

  return { params };
}
