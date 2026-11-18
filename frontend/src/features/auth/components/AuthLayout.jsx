import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, LockKeyhole } from 'lucide-react'
import { authLayoutContent } from '../data/authContent'

const AuthLayout = ({ children }) => (
  <main className="min-h-screen bg-neutral-50 lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
    <aside className="relative hidden min-h-screen overflow-hidden bg-neutral-950 px-10 py-9 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
      <div className="absolute -right-36 -top-32 size-112 rounded-full border border-white/10" aria-hidden="true" />
      <div className="absolute -right-20 -top-16 size-80 rounded-full border border-white/10" aria-hidden="true" />
      <div className="absolute -bottom-48 -left-32 size-120 rounded-full border border-white/10" aria-hidden="true" />

      <Link to="/" className="relative inline-flex w-fit items-center gap-1" aria-label={`${authLayoutContent.brand} home`}>
        
          <img src="/keynest white.png" alt="" className="size-11 object-contain" />
       
        <span className="font-['Neue_Machina'] text-xl font-bold tracking-tight">{authLayoutContent.brand}</span>
      </Link>

      <div className="relative my-16 max-w-xl">
        <p className="text-sm font-medium text-neutral-300">{authLayoutContent.sideLabel}</p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-5xl">
          {authLayoutContent.sideTitle}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-neutral-300">
          {authLayoutContent.sideDescription}
        </p>
        <ul className="mt-9 space-y-4">
          {authLayoutContent.sidePoints.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm leading-6 text-neutral-200">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-white/30">
                <span className="size-1.5 rounded-full bg-white" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2 border-t border-white/15 pt-5 text-xs leading-5 text-neutral-400">
        <LockKeyhole size={14} aria-hidden="true" />
        {authLayoutContent.privacyNote}
      </div>
    </aside>

    <section className="flex min-h-screen flex-col px-5 py-5 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between lg:justify-end">
        <Link to="/" className="inline-flex items-center gap-1 text-xl font-bold text-neutral-950 lg:hidden font-space">
          <img src="/keynest.png" alt="" className="size-11 object-contain" />
          {authLayoutContent.brand}
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          <span>{authLayoutContent.backToHome}</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
        <div className="w-full max-w-md">{children}</div>
      </div>

    </section>
  </main>
)

export default AuthLayout
