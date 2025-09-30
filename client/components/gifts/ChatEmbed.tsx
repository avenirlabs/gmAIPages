import React from "react";
import { ChatInterface } from "./ChatInterface";

type Props = {
  starterPrompts?: string[];
  apiBase?: string;
  theme?: "light" | "dark";
  color?: string;      // primary color
  radius?: number;     // border radius
  welcome?: string;    // welcome message
  initial?: string;    // initial prompt text
  userId?: string;
};

/**
 * Adapter for the web component. Passes known props to ChatInterface and
 * silently ignores unsupported ones (so we can add them gradually).
 */
export default function ChatEmbed(props: Props) {
  const {
    starterPrompts,
    apiBase,
    // Theme/color/radius/welcome/initial can be wired into ChatInterface later
    // For now we just pass what ChatInterface supports.
  } = props;

  return (
    <ChatInterface
      starterPrompts={starterPrompts}
      apiBase={apiBase}
    />
  );
}