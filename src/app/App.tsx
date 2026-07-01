import { Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { PublicLayout } from "@/components/layout";
import { ScrollToTop } from "./ScrollToTop";

// Auth pages
import { LoginPage }          from "@/features/auth/LoginPage";
import { SignupPage }         from "@/features/auth/SignupPage";
import { OnboardingPage }     from "@/features/auth/OnboardingPage";
import { AuthCallbackPage }   from "@/features/auth/AuthCallbackPage";
import { PendingApprovalPage }from "@/features/auth/PendingApprovalPage";

// Public marketplace pages
import { LandingPage }        from "@/features/search/pages/LandingPage";
import { SearchResultsPage }  from "@/features/search/pages/SearchResultsPage";
import { CatalogPage }        from "@/features/catalog/pages/CatalogPage";
import { ProductDetailPage }  from "@/features/catalog/pages/ProductDetailPage";
import { TraceabilityPage }   from "@/features/catalog/pages/TraceabilityPage";
import { StorefrontPage }     from "@/features/seller/pages/StorefrontPage";
import { ProducerProfilePage }from "@/features/seller/pages/ProducerProfilePage";
import { VillagesPage }       from "@/features/seller/pages/VillagesPage";
import { BecomeProducerPage } from "@/features/seller/pages/BecomeProducerPage";
import { CartPage }           from "@/features/orders/pages/CartPage";
import { MyOrdersPage }       from "@/features/orders/pages/MyOrdersPage";
import { BulkInquiriesPage }  from "@/features/orders/pages/BulkInquiriesPage";
import { MyProfilePage }      from "@/features/account/pages/MyProfilePage";
import { FavoritesPage }      from "@/features/account/pages/FavoritesPage";
import { RewardsPage }        from "@/features/rewards/pages/RewardsPage";
import { InfoPage }           from "@/features/misc/InfoPage";
import { NotFoundPage }       from "@/features/misc/NotFoundPage";

// Producer Portal pages
import { ProducerManagementPage } from "@/features/seller/pages/ProducerManagementPage";
import { ProducerInventoryPage }  from "@/features/seller/pages/ProducerInventoryPage";
import { ProducerOrdersPage }     from "@/features/seller/pages/ProducerOrdersPage";
import { ProducerAnalyticsPage }  from "@/features/seller/pages/ProducerAnalyticsPage";
import { ProducerSettingsPage }   from "@/features/seller/pages/ProducerSettingsPage";

// Village Admin pages
import { VillageAdminPage }    from "@/features/seller/pages/VillageAdminPage";
import { VillageProducersPage }from "@/features/seller/pages/VillageProducersPage";
import { VillageStorefrontPage}from "@/features/seller/pages/VillageStorefrontPage";
import { VillageCampaignsPage }from "@/features/seller/pages/VillageCampaignsPage";
import { VillageSettingsPage } from "@/features/seller/pages/VillageSettingsPage";

// Operator Portal pages
import { OperatorPortalPage }   from "@/features/operator/pages/OperatorPortalPage";
import { OperatorVillagesPage } from "@/features/operator/pages/OperatorVillagesPage";
import { OperatorProducersPage }from "@/features/operator/pages/OperatorProducersPage";
import { OperatorInventoryPage }from "@/features/operator/pages/OperatorInventoryPage";
import { OperatorAnalyticsPage }from "@/features/operator/pages/OperatorAnalyticsPage";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* ── Auth (no layout wrapper) ───────────────────────────── */}
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/signup"           element={<SignupPage />} />
          <Route path="/auth/callback"    element={<AuthCallbackPage />} />
          <Route path="/onboarding"       element={<OnboardingPage />} />
          <Route path="/pending-approval" element={<PendingApprovalPage />} />

          {/* ── Public marketplace ───────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"                             element={<LandingPage />} />
            <Route path="/search"                       element={<SearchResultsPage />} />
            <Route path="/shop"                         element={<CatalogPage />} />
            <Route path="/product/:productId"           element={<ProductDetailPage />} />
            <Route path="/product/:productId/passport"  element={<TraceabilityPage />} />
            <Route path="/seller/:sellerId"             element={<StorefrontPage />} />
            <Route path="/producer/:sellerId"           element={<ProducerProfilePage />} />
            <Route path="/villages"                     element={<VillagesPage />} />
            <Route path="/become-a-producer"            element={<BecomeProducerPage />} />
            <Route path="/cart"                         element={<CartPage />} />
            <Route path="/favorites"                    element={<FavoritesPage />} />
            <Route path="/orders"                       element={<MyOrdersPage />} />
            <Route path="/bulk"                         element={<BulkInquiriesPage />} />
            <Route path="/about"                        element={<InfoPage kind="about" />} />
            <Route path="/help"                         element={<InfoPage kind="help" />} />

            {/* ── Auth-gated public pages ── */}
            <Route path="/account" element={
              <ProtectedRoute><MyProfilePage /></ProtectedRoute>
            } />
            <Route path="/rewards" element={
              <ProtectedRoute><RewardsPage /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* ── Producer Portal ───────────────────────────────────── */}
          <Route path="/producer" element={
            <ProtectedRoute role="PRODUCER"><ProducerManagementPage /></ProtectedRoute>
          } />
          <Route path="/producer/inventory" element={
            <ProtectedRoute role="PRODUCER"><ProducerInventoryPage /></ProtectedRoute>
          } />
          <Route path="/producer/orders" element={
            <ProtectedRoute role="PRODUCER"><ProducerOrdersPage /></ProtectedRoute>
          } />
          <Route path="/producer/analytics" element={
            <ProtectedRoute role="PRODUCER"><ProducerAnalyticsPage /></ProtectedRoute>
          } />
          <Route path="/producer/settings" element={
            <ProtectedRoute role="PRODUCER"><ProducerSettingsPage /></ProtectedRoute>
          } />

          {/* ── Village Admin Portal ──────────────────────────────── */}
          <Route path="/village-admin" element={
            <ProtectedRoute role="VILLAGE_ADMIN"><VillageAdminPage /></ProtectedRoute>
          } />
          <Route path="/village-admin/producers" element={
            <ProtectedRoute role="VILLAGE_ADMIN"><VillageProducersPage /></ProtectedRoute>
          } />
          <Route path="/village-admin/storefront" element={
            <ProtectedRoute role="VILLAGE_ADMIN"><VillageStorefrontPage /></ProtectedRoute>
          } />
          <Route path="/village-admin/campaigns" element={
            <ProtectedRoute role="VILLAGE_ADMIN"><VillageCampaignsPage /></ProtectedRoute>
          } />
          <Route path="/village-admin/settings" element={
            <ProtectedRoute role="VILLAGE_ADMIN"><VillageSettingsPage /></ProtectedRoute>
          } />

          {/* ── Operator Portal ───────────────────────────────────── */}
          <Route path="/operator" element={
            <ProtectedRoute role="OPERATOR"><OperatorPortalPage /></ProtectedRoute>
          } />
          <Route path="/operator/villages" element={
            <ProtectedRoute role="OPERATOR"><OperatorVillagesPage /></ProtectedRoute>
          } />
          <Route path="/operator/producers" element={
            <ProtectedRoute role="OPERATOR"><OperatorProducersPage /></ProtectedRoute>
          } />
          <Route path="/operator/inventory" element={
            <ProtectedRoute role="OPERATOR"><OperatorInventoryPage /></ProtectedRoute>
          } />
          <Route path="/operator/analytics" element={
            <ProtectedRoute role="OPERATOR"><OperatorAnalyticsPage /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
