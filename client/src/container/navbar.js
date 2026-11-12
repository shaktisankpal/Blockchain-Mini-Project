import { Fragment, useEffect, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import paitientService from "../services/patientService";
import Icon, { LogoMark } from "../common/icons";
import { useTheme } from "../common/theme";

const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", pharmacy: "Pharmacy", lab: "Lab", insurance: "Insurance", Admin: "Administrator" };

// Links shown in the centre pill, per role.
const ROLE_LINKS = {
  patient: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Health Records", href: "/health-records" },
    { name: "Doctors", href: "/select-doctor" },
    { name: "Pharmacy", href: "/select-pharmacy" },
    { name: "Labs", href: "/select-lab" },
    { name: "Insurance", href: "/select-insurance-company" },
  ],
  doctor: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Patients", href: "/patient-records" },
  ],
  pharmacy: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Patients", href: "/patient-records" },
  ],
  lab: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Patients", href: "/patient-records" },
  ],
  insurance: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Claims", href: "/patient-records" },
  ],
  Admin: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Add User", href: "/add-user" },
  ],
};

const PUBLIC_LINKS = [
  { name: "Network", href: "/#network" },
  { name: "Features", href: "/#features" },
  { name: "How it works", href: "/#how-it-works" },
];

const userNavigation = [
  { name: "Your Profile", href: "/profile" },
  { name: "Sign out", href: "/logout" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const loggedIn = !!authService.getCurrentUser();
  const role = authService.getRole();
  const [fetchedName, setUserName] = useState(null);
  // Read on every render so it updates right after sign-in.
  const userName = authService.getUserName() || fetchedName;

  // Sessions from before the name was stored: look it up once.
  useEffect(() => {
    if (loggedIn && !userName) {
      paitientService
        .getUserDetails()
        .then((res) => {
          const name = res.data && res.data.result && res.data.result.userName;
          authService.setUserName(name);
          setUserName(name);
        })
        .catch(() => {});
    }
  }, [loggedIn, userName]);
  const links = loggedIn ? ROLE_LINKS[role] || [] : PUBLIC_LINKS;

  const pillLink = (item, onClick) =>
    item.href.startsWith("/#") ? (
      <a key={item.name} href={item.href} onClick={onClick} className="rounded-full px-3 py-1.5 text-[13px] font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white">
        {item.name}
      </a>
    ) : (
      <NavLink
        key={item.name}
        to={item.href}
        onClick={onClick}
        className={({ isActive }) =>
          `rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
            isActive ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white"
          }`
        }
      >
        {item.name}
      </NavLink>
    );

  return (
    <header className="sticky top-0 z-40">
      <nav className="border-b border-white/[0.06] bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <LogoMark />
            <span className="whitespace-nowrap font-display text-lg font-semibold text-white">Healthcare Records</span>
          </Link>

          {links.length > 0 && (
            <div className="hidden items-center gap-1 whitespace-nowrap rounded-full border border-white/[0.07] bg-ink-800/80 p-1 lg:flex">
              {links.map((item) => pillLink(item))}
            </div>
          )}

          <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral-300 transition hover:border-white/30 hover:text-white focus:outline-none focus:ring-2 focus:ring-lime/40"
          >
            <Icon name={theme === "light" ? "moon" : "sun"} className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-3 md:flex">
            {loggedIn ? (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-3 rounded-full border border-white/10 py-1 pl-1 pr-4 text-left transition hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-lime/40">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime font-display text-sm font-bold uppercase text-black">
                    {(userName || role || "?").slice(0, 1)}
                  </span>
                  <span className="leading-tight">
                    <span className="block max-w-[160px] truncate text-sm font-medium text-white">{userName || "Account"}</span>
                    <span className="block text-[11px] text-neutral-500">{ROLE_LABEL[role] || role}</span>
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-white/10 bg-ink-800 py-1 shadow-2xl focus:outline-none">
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => (
                          <Link to={item.href} className={`block px-4 py-2 text-sm ${active ? "bg-white/5 text-white" : "text-neutral-300"}`}>
                            {item.name}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <>
                <button className="btn-outline" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="btn-lime !px-5 !py-2 !text-xs" onClick={() => navigate("/register")}>
                  Register
                </button>
              </>
            )}
          </div>

          <button
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-neutral-300 hover:text-white md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Open main menu"
          >
            <Icon name={mobileOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-white/[0.06] px-4 pb-4 pt-3 md:hidden">
            {links.map((item) => (
              <div key={item.name} className="[&>a]:block">
                {pillLink(item, () => setMobileOpen(false))}
              </div>
            ))}
            <div className="mt-3 flex gap-3 border-t border-white/[0.06] pt-4">
              {loggedIn ? (
                userNavigation.map((item) => (
                  <Link key={item.name} to={item.href} onClick={() => setMobileOpen(false)} className="btn-outline">
                    {item.name}
                  </Link>
                ))
              ) : (
                <>
                  <button className="btn-outline" onClick={() => { navigate("/login"); setMobileOpen(false); }}>
                    Sign In
                  </button>
                  <button className="btn-lime !px-5 !py-2 !text-xs" onClick={() => { navigate("/register"); setMobileOpen(false); }}>
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
