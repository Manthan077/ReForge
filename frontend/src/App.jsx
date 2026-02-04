import { Routes, Route } from "react-router-dom";
import ClonePage from "./pages/ClonePage";
import PreviewPage from "./pages/PreviewPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ClonePage />} />
      <Route path="/preview" element={<PreviewPage />} />
    </Routes>
  );
}
