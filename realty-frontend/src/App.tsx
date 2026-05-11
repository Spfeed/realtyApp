import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { LoginPage } from "./features/auth/LoginPage";
import { ListingsPage } from "./features/listings/ListingsPage";
import { ListingDetailsPage } from "./features/listings/ListingDetailsPage";
import { MyApplicationsPage } from "./features/applications/MyApplicationsPage";
import { ChatPage } from "./features/chat/ChatPage";
import { OwnerApplicationsPage } from "./features/applications/OwnerApplicationsPage";
import { MyListingsPage } from "./features/listings/MyListingsPage";
import { ProfilePage } from "./features/profile/ProfilePage";
import { CreateListingPage } from "./features/listings/CreateListingPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ChatLayout } from "./features/chat/ChatLayout";
import { ChatEmptyPage } from "./features/chat/ChatEmptyPage";
import { AboutPage } from "./features/about/AboutPage";
import { HostProfilePage } from "./features/profile/HostProfilePage";
import { AppLayout } from "./components/AppLayout";
import { AdminPage } from "./features/admin/AdminPage";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { AdminReferencesPage } from "./features/admin/AdminReferencesPage";
import { AdminModerationPage } from "./features/admin/AdminModerationPage";
import { AdminSupportPage } from "./features/admin/AdminSupportPage";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/listings" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />

          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetailsPage />} />
          <Route path="/users/:id" element={<HostProfilePage />} />

          <Route path="/applications" element={<MyApplicationsPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/listings/create" element={<CreateListingPage />} />
          <Route
            path="/owner/listings/:listingId/applications"
            element={<OwnerApplicationsPage />}
          />

          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminPage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsersPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/references"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminReferencesPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/moderation"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminModerationPage />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/support"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "MODERATOR"]}>
                <AdminSupportPage />
              </RoleProtectedRoute>
            }
          />

          <Route path="/chats" element={<ChatLayout />}>
            <Route index element={<ChatEmptyPage />} />
            <Route path=":conversationId" element={<ChatPage />} />
          </Route>
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
