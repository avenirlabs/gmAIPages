import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import MenuAdmin from "./pages/admin/MenuAdmin";
import Page from "./pages/Page";
import NotFound from "./pages/NotFound";
import { Component, PropsWithChildren } from "react";

class ErrorBoundary extends Component<PropsWithChildren, { error: Error | null }>{
  state = { error: null } as { error: Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("App crash:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: "ui-sans-serif, system-ui" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: "#555" }}>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/menu" element={<MenuAdmin />} />
          <Route path=":slug" element={<Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function mount() {
  const rootEl = document.getElementById("root");
  if (!rootEl) {
    const msg = "#root container not found";
    console.error(msg);
    const div = document.createElement("div");
    div.textContent = msg;
    document.body.appendChild(div);
    return;
  }
  try {
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  } catch (err: any) {
    console.error("Fatal render error:", err);
    rootEl.innerHTML = `<pre style="padding:12px;color:#b00020;white-space:pre-wrap">${(err?.stack||err?.message||String(err))}</pre>`;
  }
}

window.addEventListener("error", (e) => {
  console.error("Uncaught error:", e.error || e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

mount();
