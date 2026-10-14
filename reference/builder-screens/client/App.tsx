import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ChildrenList from "./pages/ChildrenList";
import ChildDetails from "./pages/ChildDetails";
import BlockList from "./pages/BlockList";
import BlockForm from "./pages/BlockForm";
import ExceptionList from "./pages/ExceptionList";
import ExceptionForm from "./pages/ExceptionForm";
import VoiceMessageList from "./pages/VoiceMessageList";
import VoiceMessageForm from "./pages/VoiceMessageForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChildrenList />} />
          <Route path="/child/:id" element={<ChildDetails />} />
          <Route path="/child/:id/block" element={<BlockList />} />
          <Route path="/child/:id/block/new" element={<BlockForm />} />
          <Route path="/child/:id/block/:recordId/edit" element={<BlockForm />} />
          <Route path="/child/:id/exception" element={<ExceptionList />} />
          <Route path="/child/:id/exception/new" element={<ExceptionForm />} />
          <Route path="/child/:id/exception/:recordId/edit" element={<ExceptionForm />} />
          <Route path="/child/:id/voice-message" element={<VoiceMessageList />} />
          <Route path="/child/:id/voice-message/new" element={<VoiceMessageForm />} />
          <Route path="/child/:id/voice-message/:recordId/edit" element={<VoiceMessageForm />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
