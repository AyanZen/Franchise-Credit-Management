import ErrorBoundary from "./components/common/ErrorBoundary";
import PortalApp from "./pages/PortalApp";
import "./styles/portal.css";

export default function App() {
  return (
    <ErrorBoundary>
      <PortalApp />
    </ErrorBoundary>
  );
}
