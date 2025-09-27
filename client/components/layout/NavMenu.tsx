import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface NavLink {
  id: string;
  label: string;
  href?: string;
  children?: NavLink[];
  isMega?: boolean;
}

interface NavMenuProps {
  items: NavLink[];
  className?: string;
  onNavigate?: () => void;
}

interface DropdownProps {
  item: NavLink;
  onNavigate?: () => void;
}

function DesktopDropdown({ item, onNavigate }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
    if (event.key === "ArrowDown" && isOpen) {
      event.preventDefault();
      const firstChild = dropdownRef.current?.querySelector<HTMLAnchorElement>('a');
      firstChild?.focus();
    }
  };

  const handleChildKeyDown = (event: React.KeyboardEvent, index: number) => {
    const children = dropdownRef.current?.querySelectorAll<HTMLAnchorElement>('a');
    if (!children) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = children[index + 1];
      if (next) next.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = children[index - 1];
      if (prev) {
        prev.focus();
      } else {
        // Focus back to parent trigger
        const trigger = dropdownRef.current?.closest('.relative')?.querySelector<HTMLButtonElement>('button');
        trigger?.focus();
      }
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      const trigger = dropdownRef.current?.closest('.relative')?.querySelector<HTMLButtonElement>('button');
      trigger?.focus();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.href ? (
        <a
          href={item.href}
          className="flex items-center gap-1 text-sm font-medium text-[#155ca5] hover:underline"
          onClick={onNavigate}
        >
          {item.label}
          <ChevronDown className="h-3 w-3" />
        </a>
      ) : (
        <button
          className="flex items-center gap-1 text-sm font-medium text-[#155ca5] hover:underline"
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={`dropdown-${item.id}`}
        >
          {item.label}
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && item.children && (
        <div
          ref={dropdownRef}
          id={`dropdown-${item.id}`}
          className="absolute top-full left-0 z-50 mt-1 min-w-[200px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
          aria-labelledby={`trigger-${item.id}`}
        >
          {item.children.map((child, index) => (
            <a
              key={child.id}
              href={child.href || "#"}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#DBEBFF] hover:text-[#155ca5] focus:bg-[#DBEBFF] focus:text-[#155ca5] focus:outline-none"
              role="menuitem"
              onClick={onNavigate}
              onKeyDown={(e) => handleChildKeyDown(e, index)}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileAccordionProps {
  item: NavLink;
  onNavigate?: () => void;
}

function MobileAccordion({ item, onNavigate }: MobileAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleParentClick = () => {
    if (item.href) {
      onNavigate?.();
    } else {
      handleToggle();
    }
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        {item.href ? (
          <a
            href={item.href}
            className="flex-1 px-2 py-2 text-sm font-medium text-[#155ca5] hover:bg-[#DBEBFF]"
            onClick={onNavigate}
          >
            {item.label}
          </a>
        ) : (
          <button
            className="flex-1 px-2 py-2 text-left text-sm font-medium text-[#155ca5] hover:bg-[#DBEBFF]"
            onClick={handleToggle}
          >
            {item.label}
          </button>
        )}

        {item.children && (
          <button
            className="p-2 text-[#155ca5] hover:bg-[#DBEBFF]"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-controls={`mobile-submenu-${item.id}`}
            aria-label={`Toggle ${item.label} submenu`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {isExpanded && item.children && (
        <div
          id={`mobile-submenu-${item.id}`}
          className="bg-gray-50 pl-4"
        >
          {item.children.map((child) => (
            <a
              key={child.id}
              href={child.href || "#"}
              className="block px-2 py-2 text-sm text-gray-700 hover:bg-[#DBEBFF] hover:text-[#155ca5]"
              onClick={onNavigate}
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavMenu({ items, className = "", onNavigate }: NavMenuProps) {
  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`hidden md:flex items-center gap-6 ${className}`}>
        {items.map((item) => (
          item.children && item.children.length > 0 ? (
            <DesktopDropdown key={item.id} item={item} onNavigate={onNavigate} />
          ) : (
            <a
              key={item.id}
              href={item.href || "#"}
              className="text-sm font-medium text-[#155ca5] hover:underline"
              onClick={onNavigate}
            >
              {item.label}
            </a>
          )
        ))}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {items.map((item) => (
          item.children && item.children.length > 0 ? (
            <MobileAccordion key={item.id} item={item} onNavigate={onNavigate} />
          ) : (
            <a
              key={item.id}
              href={item.href || "#"}
              className="block px-2 py-2 text-sm font-medium text-[#155ca5] hover:bg-[#DBEBFF] rounded-md"
              onClick={onNavigate}
            >
              {item.label}
            </a>
          )
        ))}
      </div>
    </>
  );
}