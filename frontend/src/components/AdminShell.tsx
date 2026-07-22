"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  FolderTree,
  LayoutGrid,
  LogOut,
  Maximize,
  Minimize,
  Moon,
  Package,
  Percent,
  Plus,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Store,
  TicketPercent,
  UserRound,
  Users,
} from "lucide-react";

import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export type AdminNavKey =
  | "users"
  | "roles"
  | "categories"
  | "products"
  | "attributes"
  | "profile"
  | "shop"
  | "tax"
  | "coupons";

const SIDEBAR_PIN_KEY = "valaiyagam_sidebar_pinned";

function navHref(key: AdminNavKey) {
  if (key === "products") return "/?tab=products";
  if (key === "categories") return "/?tab=categories";
  if (key === "attributes") return "/?tab=attributes";
  if (key === "roles") return "/?tab=roles";
  if (key === "profile") return "/?tab=profile";
  if (key === "shop") return "/?tab=shop";
  if (key === "tax") return "/?tab=tax";
  if (key === "coupons") return "/?tab=coupons";
  return "/?tab=users";
}

function initials(name?: string | null) {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

export function AdminShell({
  children,
  title,
  breadcrumbs,
  activeNav,
}: {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  activeNav: AdminNavKey;
}) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const pathname = usePathname();
  const [pinned, setPinned] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const expanded = pinned || hovered;
  const mini = !pinned;

  const isProductsSection =
    activeNav === "products" || pathname.startsWith("/products");
  const isEcommerceActive =
    isProductsSection ||
    activeNav === "categories" ||
    activeNav === "attributes";

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_PIN_KEY);
    if (saved === "0") setPinned(false);
    if (saved === "1") setPinned(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_PIN_KEY, pinned ? "1" : "0");
  }, [pinned]);

  useEffect(() => {
    if (isEcommerceActive) setEcommerceOpen(true);
  }, [isEcommerceActive]);

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function tabHref(key: AdminNavKey) {
    return navHref(key);
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser may block fullscreen without gesture/permission.
    }
  }

  const crumbs = useMemo(
    () =>
      breadcrumbs ?? [
        { label: "Admin", href: "/" },
        { label: title },
      ],
    [breadcrumbs, title],
  );

  const sidebarWidth = expanded ? "w-[250px]" : "w-[70px]";
  const contentPad = pinned ? "lg:pl-[250px]" : "lg:pl-[70px]";
  const contentOffset = pinned ? "250px" : "70px";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside
        className={`vz-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col transition-[width] duration-200 lg:flex ${sidebarWidth} ${
          mini && expanded ? "shadow-[8px_0_24px_rgba(0,0,0,0.08)]" : ""
        }`}
        onMouseEnter={() => {
          if (!pinned) setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`relative flex h-[70px] items-center border-b border-[var(--card-border)] ${
            expanded ? "gap-3 px-3" : "justify-center px-2"
          }`}
        >
          <Link
            href="/"
            className={`flex min-w-0 items-center ${
              expanded ? "gap-2.5" : "justify-center"
            }`}
            title="Classic Way"
          >
            <span className="brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.jpeg" alt="Classic Way logo" />
            </span>
            {expanded && <span className="brand-title-text">Classic Way</span>}
          </Link>

          <button
            type="button"
            onClick={() => {
              setPinned((value) => !value);
              setHovered(false);
            }}
            className={`sidebar-pin absolute right-3 top-1/2 -translate-y-1/2 ${
              pinned ? "sidebar-pin-active" : ""
            } ${expanded ? "" : "hidden"}`}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar expanded"}
            title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
          >
            {pinned ? <span className="sidebar-pin-dot" /> : null}
          </button>
        </div>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto py-4">
          {expanded && (
            <p className="mb-2 px-5 text-[11px] font-semibold tracking-[0.04em] text-[var(--muted)]">
              Menu
            </p>
          )}

          <NavButton
            active={activeNav === "users"}
            collapsed={!expanded}
            href={tabHref("users")}
            icon={<Users size={16} />}
            label="Users"
          />
          <NavButton
            active={activeNav === "roles"}
            collapsed={!expanded}
            href={tabHref("roles")}
            icon={<ShieldCheck size={16} />}
            label="Roles"
          />

          <button
            type="button"
            onClick={() => {
              if (!expanded) {
                setPinned(true);
                setEcommerceOpen(true);
              } else {
                setEcommerceOpen((open) => !open);
              }
            }}
            className={`nav-item ${isEcommerceActive ? "nav-item-active" : "nav-item-idle"} ${
              !expanded ? "justify-center px-0" : ""
            }`}
            title="Ecommerce"
          >
            <ShoppingBag size={16} />
            {expanded && (
              <>
                <span className="flex-1 text-left">Ecommerce</span>
                <ChevronDown
                  size={14}
                  className={`transition ${ecommerceOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {expanded && ecommerceOpen && (
            <div className="mb-1 ml-4 border-l border-[var(--card-border)] pl-2">
              <NavButton
                active={
                  (isProductsSection && !pathname.startsWith("/products/")) ||
                  /^\/products\/\d+$/.test(pathname)
                }
                collapsed={false}
                href={tabHref("products")}
                icon={<Package size={15} />}
                label="Products"
                nested
              />
              <NavButton
                active={pathname === "/products/new"}
                collapsed={false}
                href="/products/new"
                icon={<Plus size={15} />}
                label="Create Product"
                nested
              />
              <NavButton
                active={activeNav === "categories"}
                collapsed={false}
                href={tabHref("categories")}
                icon={<FolderTree size={15} />}
                label="Categories"
                nested
              />
              <NavButton
                active={activeNav === "attributes"}
                collapsed={false}
                href={tabHref("attributes")}
                icon={<Settings2 size={15} />}
                label="Attributes"
                nested
              />
            </div>
          )}

          {!expanded && (
            <>
              <NavButton
                active={isProductsSection}
                collapsed
                href={tabHref("products")}
                icon={<Package size={16} />}
                label="Products"
              />
              <NavButton
                active={activeNav === "categories"}
                collapsed
                href={tabHref("categories")}
                icon={<FolderTree size={16} />}
                label="Categories"
              />
              <NavButton
                active={activeNav === "attributes"}
                collapsed
                href={tabHref("attributes")}
                icon={<Settings2 size={16} />}
                label="Attributes"
              />
            </>
          )}
        </nav>

        <div className="border-t border-[var(--card-border)] p-3">
          <button
            onClick={() => dispatch(logout())}
            className={`flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[#f3f6f9] hover:text-[var(--foreground)] ${
              !expanded ? "justify-center" : ""
            }`}
            title="Sign out"
          >
            <LogOut size={15} />
            {expanded && "Sign out"}
          </button>
        </div>
      </aside>

      <div
        className={`transition-[padding] duration-200 ${contentPad}`}
        style={{ ["--content-offset" as string]: contentOffset }}
      >
        <header className="vz-topbar sticky top-0 z-20">
          <div className="w-full max-w-sm">
            <input
              className="form-input bg-[#f3f3f9]"
              placeholder="Search..."
              aria-label="Search"
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <HeaderIconButton label="Layout">
              <LayoutGrid size={17} />
            </HeaderIconButton>
            <HeaderIconButton
              label="Toggle fullscreen"
              onClick={() => void toggleFullscreen()}
              badge="5"
              badgeTone="blue"
            >
              {fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </HeaderIconButton>
            <HeaderIconButton label="Theme" className="theme-icon-button">
              <Moon size={17} />
            </HeaderIconButton>
            <HeaderIconButton label="Notifications" badge="1" badgeTone="orange">
              <Bell size={17} />
            </HeaderIconButton>

            <div className="relative ml-1" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 p-1.5"
                aria-label="Profile menu"
              >
                <span className="avatar-circle grid size-8 place-items-center bg-[var(--theme-green)] text-xs font-bold text-white">
                  {initials(currentUser?.full_name)}
                </span>
                <span className="hidden pr-1 text-left sm:block">
                  <span className="block text-sm font-semibold leading-tight">
                    {currentUser?.full_name ?? "Admin"}
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    Administrator
                  </span>
                </span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 border border-[var(--card-border)] bg-white p-2">
                  <p className="truncate px-2 py-1 text-xs text-[var(--muted)]">
                    {currentUser?.email}
                  </p>
                  <Link
                    href="/?tab=profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#f3f3f9]"
                  >
                    <UserRound size={15} /> Profile settings
                  </Link>
                  <Link
                    href="/?tab=shop"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#f3f3f9]"
                  >
                    <Store size={15} /> Our shop details
                  </Link>
                  <Link
                    href="/?tab=tax"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#f3f3f9]"
                  >
                    <Percent size={15} /> Tax
                  </Link>
                  <Link
                    href="/?tab=coupons"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[#f3f3f9]"
                  >
                    <TicketPercent size={15} /> Coupons
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      dispatch(logout());
                    }}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-[#f06548] hover:bg-[#fef4f2]"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="vz-page-title-box sticky top-[70px] z-10">
          <h1 className="vz-page-title">{title}</h1>
          <ol className="vz-breadcrumb">
            {crumbs.map((crumb, index) => (
              <li
                key={`${crumb.label}-${index}`}
                className="flex items-center gap-2"
              >
                {index > 0 && <span className="vz-breadcrumb-sep">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span className="text-[var(--foreground)]">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <main className="px-4 py-5 pb-28 sm:px-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--card-border)] bg-white lg:hidden">
        <MobileNav active={activeNav === "users"} href={tabHref("users")}>
          <Users size={16} /> Users
        </MobileNav>
        <MobileNav active={activeNav === "roles"} href={tabHref("roles")}>
          <ShieldCheck size={16} /> Roles
        </MobileNav>
        <MobileNav active={isProductsSection} href={tabHref("products")}>
          <Package size={16} /> Products
        </MobileNav>
        <MobileNav
          active={activeNav === "categories"}
          href={tabHref("categories")}
        >
          <FolderTree size={16} /> Categories
        </MobileNav>
        <MobileNav
          active={activeNav === "attributes"}
          href={tabHref("attributes")}
        >
          <Settings2 size={16} /> Attributes
        </MobileNav>
      </nav>
    </div>
  );
}

function HeaderIconButton({
  children,
  label,
  onClick,
  badge,
  badgeTone = "orange",
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: string;
  badgeTone?: "orange" | "blue";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative hidden p-2 text-[var(--muted)] hover:text-[var(--primary)] sm:inline-flex ${className}`}
      aria-label={label}
      title={label}
    >
      {children}
      {badge ? (
        <span
          className={`absolute -right-0.5 -top-0.5 grid size-4 place-items-center text-[9px] font-bold text-white ${
            badgeTone === "blue" ? "bg-[#3577f1]" : "bg-[#f06548]"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function NavButton({
  active,
  href,
  icon,
  label,
  collapsed = false,
  nested = false,
}: {
  active: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`nav-item ${active ? "nav-item-active" : "nav-item-idle"} ${
        collapsed ? "justify-center px-0" : ""
      } ${nested ? "py-2 text-[13px]" : ""}`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function MobileNav({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-1 py-3 text-[10px] font-semibold ${
        active ? "bg-[#f3f3f9] text-[var(--primary)]" : "text-[var(--muted)]"
      }`}
    >
      {children}
    </Link>
  );
}

export function useAdminTabParam(defaultTab: AdminNavKey = "users"): AdminNavKey {
  const params = useSearchParams();
  const tab = params.get("tab");
  if (
    tab === "roles" ||
    tab === "categories" ||
    tab === "products" ||
    tab === "attributes" ||
    tab === "users" ||
    tab === "profile" ||
    tab === "shop" ||
    tab === "tax" ||
    tab === "coupons"
  ) {
    return tab;
  }
  return defaultTab;
}
