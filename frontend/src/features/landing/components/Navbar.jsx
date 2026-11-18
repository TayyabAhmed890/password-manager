import { useState } from 'react'
import { ArrowRight, KeyRound, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { brandContent, navigationLinks } from '../data/landingContent'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-1"
          aria-label={brandContent.homeLabel}
        >
          
            <img src="/keynest.png" alt="" className="size-11 object-contain" />
          
          <span
            className="text-xl font-bold tracking-tight font-space"
          >
            {brandContent.name}
          </span>
        </Link>

        <div className="ml-auto hidden items-center gap-7 md:flex">
          <nav className="flex items-center gap-7 text-sm font-medium text-neutral-600" aria-label="Main navigation">
            {navigationLinks.map((item) => (
              <a key={item.href} className="transition hover:text-neutral-950" href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-300 px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              {brandContent.login}
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              {brandContent.getStarted}
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-800 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 md:hidden"
          aria-label={isMenuOpen ? brandContent.closeMenuLabel : brandContent.openMenuLabel}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none md:hidden ${isMenuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <nav
            id="mobile-navigation"
            className="border-t border-neutral-200 bg-white px-5 py-5 sm:px-8"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigationLinks.map((item) => (
              <a
                key={item.href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
                href={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
              <Link
                to="/login"
                onClick={closeMenu}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
              >
                {brandContent.login}
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
              >
                {brandContent.getStarted}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar