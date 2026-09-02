import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProtectedRoute } from "@/components/protected-route";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import Dashboard from "@/pages/dashboard";
import Facilities from "@/pages/facilities";
import HazardAnalysis from "@/pages/hazard-analysis";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import PopulationRisk from "@/pages/population-risk";
import Relocation from "@/pages/relocation";
import RelocationPolicy from "@/pages/relocation-policy";
import RelocationPriority from "@/pages/relocation-priority";
import Reports from "@/pages/reports";
import RiskMapPage from "@/pages/risk-map";
import SafeSites from "@/pages/safe-sites";
import SiteComparison from "@/pages/site-comparison";
import VillageDetail from "@/pages/village-detail";
import Villages from "@/pages/villages";
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from "wouter";

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Authentication Route */}
        <Route path="/login" component={LoginPage} />

        {/* Protected Operational Command Routes */}
        <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/risk-map" component={() => <ProtectedRoute component={RiskMapPage} />} />
        <Route path="/villages" component={() => <ProtectedRoute component={Villages} />} />
        <Route path="/villages/:villageId" component={() => <ProtectedRoute component={VillageDetail} />} />
        <Route path="/hazard-analysis" component={() => <ProtectedRoute component={HazardAnalysis} />} />
        <Route path="/population-risk" component={() => <ProtectedRoute component={PopulationRisk} />} />
        <Route path="/relocation-priority" component={() => <ProtectedRoute component={RelocationPriority} />} />
        <Route path="/safe-sites" component={() => <ProtectedRoute component={SafeSites} />} />
        <Route path="/site-comparison" component={() => <ProtectedRoute component={SiteComparison} />} />
        <Route path="/relocation-policy" component={() => <ProtectedRoute component={RelocationPolicy} />} />
        <Route path="/relocation/:villageId" component={() => <ProtectedRoute component={Relocation} />} />
        <Route path="/facilities" component={() => <ProtectedRoute component={Facilities} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />

        {/* 404 Fallback */}
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
