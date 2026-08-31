import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from '@/pages/dashboard';
import Facilities from '@/pages/facilities';
import HazardAnalysis from '@/pages/hazard-analysis';
import NotFound from '@/pages/not-found';
import Relocation from '@/pages/relocation';
import RelocationPriority from '@/pages/relocation-priority';
import Reports from '@/pages/reports';
import RiskMapPage from '@/pages/risk-map';
import SafeSites from '@/pages/safe-sites';
import SiteComparison from '@/pages/site-comparison';
import VillageDetail from '@/pages/village-detail';
import Villages from '@/pages/villages';
import PopulationRisk from '@/pages/population-risk';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
         <Route path="/" component={Dashboard} />
         <Route path="/risk-map" component={RiskMapPage} />
         <Route path="/villages" component={Villages} />
         <Route path="/villages/:villageId" component={VillageDetail} />
         <Route path="/hazard-analysis" component={HazardAnalysis} />
         <Route path="/population-risk" component={PopulationRisk} />
         <Route path="/relocation-priority" component={RelocationPriority} />
         <Route path="/safe-sites" component={SafeSites} />
         <Route path="/site-comparison" component={SiteComparison} />
         <Route path="/relocation/:villageId" component={Relocation} />
         <Route path="/facilities" component={Facilities} />
         <Route path="/reports" component={Reports} />
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
