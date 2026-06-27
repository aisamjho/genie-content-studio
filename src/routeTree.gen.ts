/* eslint-disable */
// @ts-nocheck
// Auto-generated — do not edit manually.

import { Route as rootRoute } from './routes/__root'
import { Route as TermsImport } from './routes/terms'
import { Route as PrivacyImport } from './routes/privacy'
import { Route as ContactImport } from './routes/contact'
import { Route as AuthImport } from './routes/auth'
import { Route as AboutImport } from './routes/about'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as IndexImport } from './routes/index'
import { Route as DashboardImport } from './routes/_authenticated.dashboard'

const TermsRoute = TermsImport.update({ id: '/terms', path: '/terms', getParentRoute: () => rootRoute } as any)
const PrivacyRoute = PrivacyImport.update({ id: '/privacy', path: '/privacy', getParentRoute: () => rootRoute } as any)
const ContactRoute = ContactImport.update({ id: '/contact', path: '/contact', getParentRoute: () => rootRoute } as any)
const AuthRoute = AuthImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRoute } as any)
const AboutRoute = AboutImport.update({ id: '/about', path: '/about', getParentRoute: () => rootRoute } as any)
const AuthenticatedRoute = AuthenticatedImport.update({ id: '/_authenticated', getParentRoute: () => rootRoute } as any)
const IndexRoute = IndexImport.update({ id: '/', path: '/', getParentRoute: () => rootRoute } as any)
const DashboardRoute = DashboardImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRoute } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/privacy': typeof PrivacyRoute
  '/terms': typeof TermsRoute
  '/dashboard': typeof DashboardRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/privacy': typeof PrivacyRoute
  '/terms': typeof TermsRoute
  '/dashboard': typeof DashboardRoute
}
export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteWithChildren
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/privacy': typeof PrivacyRoute
  '/terms': typeof TermsRoute
  '/_authenticated/dashboard': typeof DashboardRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fileRoutesByTo: FileRoutesByTo
  fileRoutesById: FileRoutesById
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof import('./router').getRouter>
  }
}

export interface FileRoutesByPath {
  '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexImport; parentRoute: typeof rootRoute }
  '/about': { id: '/about'; path: '/about'; fullPath: '/about'; preLoaderRoute: typeof AboutImport; parentRoute: typeof rootRoute }
  '/auth': { id: '/auth'; path: '/auth'; fullPath: '/auth'; preLoaderRoute: typeof AuthImport; parentRoute: typeof rootRoute }
  '/contact': { id: '/contact'; path: '/contact'; fullPath: '/contact'; preLoaderRoute: typeof ContactImport; parentRoute: typeof rootRoute }
  '/privacy': { id: '/privacy'; path: '/privacy'; fullPath: '/privacy'; preLoaderRoute: typeof PrivacyImport; parentRoute: typeof rootRoute }
  '/terms': { id: '/terms'; path: '/terms'; fullPath: '/terms'; preLoaderRoute: typeof TermsImport; parentRoute: typeof rootRoute }
  '/_authenticated': { id: '/_authenticated'; path: ''; fullPath: '/'; preLoaderRoute: typeof AuthenticatedImport; parentRoute: typeof rootRoute }
  '/_authenticated/dashboard': { id: '/_authenticated/dashboard'; path: '/dashboard'; fullPath: '/dashboard'; preLoaderRoute: typeof DashboardImport; parentRoute: typeof AuthenticatedRoute }
}

interface AuthenticatedChildren { DashboardRoute: typeof DashboardRoute }
const AuthenticatedChildren: AuthenticatedChildren = { DashboardRoute }
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(AuthenticatedChildren)

const rootChildren = {
  IndexRoute, AuthenticatedRoute: AuthenticatedRouteWithChildren,
  AboutRoute, AuthRoute, ContactRoute, PrivacyRoute, TermsRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootChildren)
  ._addFileTypes<FileRouteTypes>()
