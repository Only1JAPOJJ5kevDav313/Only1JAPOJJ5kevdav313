import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import AdminSidebar from './AdminSidebar';
import { findAdminNavItem } from './adminNav';
import DashboardShell, {
  type DashboardCrumb,
} from '../dashboard/DashboardShell';

export type AdminBreadcrumb = { label: string; to?: string };

type AdminLayoutProps = {
  children: ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
};

export default function AdminLayout({
  children,
  breadcrumbs = [],
}: AdminLayoutProps) {
  const location = useLocation();
  const page = findAdminNavItem(location.pathname);
  const isOverview = page?.path === '/admin';
  const crumbs: DashboardCrumb[] = [
    { label: 'PFControl', to: '/' },
    { label: 'Admin', to: '/admin', mobileHidden: true },
    ...(page && !isOverview
      ? [{ label: page.label, to: breadcrumbs.length ? page.path : undefined }]
      : [{ label: 'Overview', to: breadcrumbs.length ? '/admin' : undefined }]),
    ...breadcrumbs,
  ];

  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      crumbs={crumbs}
      storageKey="admin-sidebar-collapsed"
    >
      {children}
    </DashboardShell>
  );
}
