export function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      {/* Instagram follow */}
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-8 text-center md:flex-row md:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-[#222529]">
            Follow us on Instagram
          </h3>
          <p className="mt-1 text-sm text-[#777]">
            See latest gifts, ideas, and deals.
          </p>
        </div>
        <a
          href="https://www.instagram.com/giftsmate/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-[#222529] hover:text-[#155ca5]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-2a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
          Follow on Instagram
        </a>
      </div>

      {/* Footer links */}
      <div className="container mx-auto grid gap-8 px-4 pb-8 md:grid-cols-4">
        <div>
          <h4 className="text-sm font-semibold text-[#222529]">
            Customer Service
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-[#222529]">
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Help & FAQs
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Order Tracking
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Shipping & Delivery
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Orders History
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#222529]">About Us</h4>
          <ul className="mt-3 space-y-2 text-sm text-[#222529]">
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Our Story
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Careers
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Stores
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#222529]">Sellers</h4>
          <ul className="mt-3 space-y-2 text-sm text-[#222529]">
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Why sell with us?
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Affiliates
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#222529]">Get in touch</h4>
          <ul className="mt-3 space-y-2 text-sm text-[#222529]">
            <li>
              <a
                className="hover:text-[#155ca5]"
                href="mailto:hello@giftsmate.net"
              >
                hello@giftsmate.net
              </a>
            </li>
            <li>
              <a className="hover:text-[#155ca5]" href="#">
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
