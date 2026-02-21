import { Routes, Route } from "react-router-dom";
import ClonePage from "./pages/ClonePage";
import PreviewPage from "./pages/PreviewPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthNavbar from "./components/AuthNavbar";

export default function App() {
  return (
    <>
      <AuthNavbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<ProtectedRoute><ClonePage /></ProtectedRoute>} />
        <Route path="/preview" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
