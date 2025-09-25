# Accessibility & SEO

Accessibility
- Keyboard: ensure focus styles on buttons/chips (shadcn covers most). Add skip-to-content link. Test tab order in chat.
- Labels: inputs/buttons have accessible names; verify with axe.
- Color contrast: follow Tailwind theme; validate headings and buttons.

SEO
- Per-page <title> and meta description applied from Supabase (Index/Page use a small SEO util).
- Add Open Graph/Twitter tags (TODO): title, description, image.
- Robots: public/robots.txt present.

Checklists
- [ ] Axe clean on key pages
- [ ] Meta title/description present
- [ ] OG/Twitter tags configured
- [ ] Sitemap generation (TODO)
