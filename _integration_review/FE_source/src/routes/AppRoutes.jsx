import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Companies = lazy(() => import("@/pages/Companies"));
const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const Leads = lazy(() => import("@/pages/Leads"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const SavedLists = lazy(() => import("@/pages/SavedLists"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Settings = lazy(() => import("@/pages/Settings"));

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64 max-w-full" />
      <div className="grid gap-4 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function lazyPage(Page) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Page />
    </Suspense>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={lazyPage(Dashboard)} />
        <Route path="/companies" element={lazyPage(Companies)} />
        <Route path="/companies/:companyId" element={lazyPage(CompanyProfile)} />
        <Route path="/leads" element={lazyPage(Leads)} />
        <Route path="/contacts" element={lazyPage(Contacts)} />
        <Route path="/jobs" element={lazyPage(Jobs)} />
        <Route path="/saved-lists" element={lazyPage(SavedLists)} />
        <Route path="/analytics" element={lazyPage(Analytics)} />
        <Route path="/settings" element={lazyPage(Settings)} />
      </Route>
    </Routes>
  );
}
