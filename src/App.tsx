import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import HackathonsPage from "./pages/HackathonsPage";
import MentorsPage from "./pages/MentorsPage";
import CoursesPage from "./pages/CoursesPage";
import PatentsPage from "./pages/PatentsPage";
import IdeasPage from "./pages/IdeasPage";
import InvestorsPage from "./pages/InvestorsPage";
import ProblemStatementWizard from "./pages/ProblemStatementWizard";
import PitchDeckPage from "./pages/PitchDeckPage";
import MentorDashboard from "./pages/MentorDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import IncubationHubPage from "./pages/IncubationHubPage";
import CopyrightsPage from "./pages/CopyrightsPage";
import ProcurementPage from "./pages/ProcurementPage";
import TeamsPage from "./pages/TeamsPage";
import TermsPage from "./pages/TermsPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import PaymentVerificationPage from "./pages/PaymentVerificationPage";
import NotFound from "./pages/NotFound";
import AppFeedback from "./components/AppFeedback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/hackathons" element={<HackathonsPage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/patents" element={<PatentsPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/investors" element={<InvestorsPage />} />
            <Route path="/submit-idea" element={<ProblemStatementWizard />} />
            <Route path="/pitch-deck" element={<PitchDeckPage />} />
            <Route path="/mentor-dashboard" element={<MentorDashboard />} />
            <Route path="/investor-dashboard" element={<InvestorDashboard />} />
            <Route path="/incubation" element={<IncubationHubPage />} />
            <Route path="/copyrights" element={<CopyrightsPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/payment-verification" element={<PaymentVerificationPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AppFeedback />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
