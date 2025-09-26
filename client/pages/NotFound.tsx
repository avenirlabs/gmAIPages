import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Page, Section } from "@/components/layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Page className="bg-neutral-50">
      <div /> {/* Empty header space */}
      <main className="flex items-center justify-center">
        <Section variant="hero" size="lg">
          <h1 className="text-4xl font-bold text-brand-secondary-800">404</h1>
          <p className="text-xl text-brand-secondary-600">Oops! Page not found</p>
          <a href="/" className="text-brand-primary-500 hover:text-brand-primary-600 underline">
            Return to Home
          </a>
        </Section>
      </main>
      <div /> {/* Empty footer space */}
    </Page>
  );
};

export default NotFound;
