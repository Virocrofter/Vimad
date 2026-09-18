/* apps/api/src/common/versioning.ts */
import type { Request, Response, NextFunction } from 'express';

export type ApiVersion = 'v1';

const CURRENT_VERSION: ApiVersion = 'v1';
const SUPPORTED_VERSIONS: ApiVersion[] = ['v1'];

export function versionMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check URL path version first: /v1/...
  const urlMatch = req.path.match(/^\/(v\d+)\//);
  const urlVersion = urlMatch?.[1] as ApiVersion | undefined;

  // Check Accept header version: Accept: application/vnd.vimad.v1+json
  const acceptHeader = req.get('accept') ?? '';
  const headerMatch = acceptHeader.match(/vnd\.vimad\.(v\d+)\+json/);
  const headerVersion = headerMatch?.[1] as ApiVersion | undefined;

  // Check custom header: x-api-version: v1
  const customVersion = req.get('x-api-version') as ApiVersion | undefined;

  const requestedVersion = urlVersion ?? headerVersion ?? customVersion ?? CURRENT_VERSION;

  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    res.status(400).json({
      error: {
        code: 'UNSUPPORTED_VERSION',
        message: `API version "${requestedVersion}" is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      },
    });
    return;
  }

  // Attach version to request for route handlers
  (req as any).apiVersion = requestedVersion;
  next();
}

export function getVersionedPath(path: string, version: ApiVersion = CURRENT_VERSION): string {
  return `/${version}${path.startsWith('/') ? path : `/${path}`}`;
}
