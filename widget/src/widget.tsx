import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import styles from "./styles.css?inline";
import { ChatInterface } from "@/components/gifts/ChatInterface";

// Create a single query client for the widget
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface Attrs {
  theme?: string;
  color?: string;
  radius?: string;
  welcome?: string;
  initial?: string;
  userId?: string;
  apiBase?: string;
  starterPrompts?: string;
}

class GiftsmateChat extends HTMLElement {
  private root?: ReturnType<typeof createRoot>;
  private shadow?: ShadowRoot;

  static get observedAttributes() {
    return [
      "theme",
      "color",
      "radius",
      "welcome",
      "initial",
      "user-id",
      "api-base",
      "starter-prompts",
    ];
  }

  private get props(): Attrs {
    return {
      theme: this.getAttribute("theme") || "light",
      color: this.getAttribute("color") || "#6C5CE7",
      radius: this.getAttribute("radius") || "12",
      welcome: this.getAttribute("welcome") || "",
      initial: this.getAttribute("initial") || "",
      userId: this.getAttribute("user-id") || "",
      apiBase: this.getAttribute("api-base") || window.location.origin,
      starterPrompts: this.getAttribute("starter-prompts") || "",
    };
  }

  connectedCallback() {
    if (!this.shadow) {
      this.shadow = this.attachShadow({ mode: "open" });

      // Inject styles
      const style = document.createElement("style");
      style.textContent = styles;
      this.shadow.appendChild(style);

      // Create mount point
      const mount = document.createElement("div");
      mount.id = "gm-root";
      this.shadow.appendChild(mount);

      this.root = createRoot(mount);
    }
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private render() {
    if (!this.root) return;
    const p = this.props;

    // Parse starter prompts if provided
    const starterPrompts = p.starterPrompts
      ? p.starterPrompts.split("|").map((s) => s.trim()).filter(Boolean)
      : undefined;

    this.root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <div style={{ all: "initial", display: "block", fontFamily: "system-ui, sans-serif" }}>
            <ChatInterface starterPrompts={starterPrompts} />
          </div>
        </QueryClientProvider>
      </React.StrictMode>
    );
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = undefined;
    }
  }
}

// Register the custom element
if (!customElements.get("giftsmate-chat")) {
  customElements.define("giftsmate-chat", GiftsmateChat);
}