import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout";
import { ScrollToTop } from "./ScrollToTop";

// Public marketplace pages
import { LandingPage } from "@/features/search/pages/LandingPage";
import { SearchResultsPage } from "@/features/search/pages/SearchResultsPage";
import { CatalogPage } from "@/features/catalog/pages/CatalogPage";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";
import { TraceabilityPage } from "@/features/catalog/pages/TraceabilityPage";
import { StorefrontPage } from "@/features/seller/pages/StorefrontPage";
import { ProducerProfilePage } from "@/features/seller/pages/ProducerProfilePage";
import { VillagesPage } from "@/features/seller/pages/VillagesPage";
import { BecomeProducerPage } from "@/features/seller/pages/BecomeProducerPage";
import { CartPage } from "@/features/orders/pages/CartPage";
import { MyOrdersPage } from "@/features/orders/pages/MyOrdersPage";
import { BulkInquiriesPage } from "@/features/orders/pages/BulkInquiriesPage";
import { MyProfilePage } from "@/features/account/pages/MyProfilePage";
import { RewardsPage } from "@/features/rewards/pages/RewardsPage";
import { InfoPage } from "@/features/misc/InfoPage";
import { NotFoundPage } from "@/features/misc/NotFoundPage";

// Portal pages (own full-screen layout)
import { ProducerManagementPage } from "@/features/seller/pages/ProducerManagementPage";
import { VillageAdminPage } from "@/features/seller/pages/VillageAdminPage";
import { OperatorPortalPage } from "@/features/operator/pages/OperatorPortalPage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public marketplace */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/shop" element={<CatalogPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/product/:productId/passport" element={<TraceabilityPage />} />
          <Route path="/seller/:sellerId" element={<StorefrontPage />} />
          <Route path="/producer/:sellerId" element={<ProducerProfilePage />} />
          <Route path="/villages" element={<VillagesPage />} />
          <Route path="/become-a-producer" element={<BecomeProducerPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/bulk" element={<BulkInquiriesPage />} />
          <Route path="/account" element={<MyProfilePage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/about" element={<InfoPage kind="about" />} />
          <Route path="/help" element={<InfoPage kind="help" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Portals — full-screen with their own sidebar layout */}
        <Route path="/producer" element={<ProducerManagementPage />} />
        <Route path="/village-admin" element={<VillageAdminPage />} />
        <Route path="/operator" element={<OperatorPortalPage />} />
      </Routes>
    </>
  );
}
