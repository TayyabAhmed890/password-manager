import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  Globe,
  KeyRound,
  LockKeyhole,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { heroContent } from '../data/landingContent'

const Hero = () => {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
        <div className="text-center lg:text-left">
          <h1 className="mx-auto max-w-[13ch] text-[clamp(2.5rem,5.2vw,4.25rem)] font-semibold leading-[1.06] tracking-[-0.045em] lg:mx-0">
            {heroContent.title}
            <span className="block text-neutral-500">{heroContent.titleEmphasis}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8 lg:mx-0">
            {heroContent.description}
          </p>
          <div className="mx-auto mt-8 flex w-full max-w-xs flex-col items-stretch justify-center gap-2.5 sm:mx-0 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3 lg:justify-start">
            <Link
              to="/register"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-neutral-950 bg-neutral-950 px-4 text-[13px] font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:min-h-12 sm:w-auto sm:px-6 sm:text-sm"
            >
              {heroContent.primaryAction}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#features"
              className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full border border-neutral-300 px-4 text-[13px] font-semibold text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:min-h-12 sm:w-auto sm:px-5 sm:text-sm"
            >
              {heroContent.secondaryAction}
            </a>
          </div>
          <p className="mt-5 text-xs leading-5 text-neutral-500">{heroContent.reassurance}</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl px-1 pb-4 sm:px-2 lg:hidden">
          <div className="absolute inset-5 rounded-full bg-neutral-100 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto max-w-76 rounded-[2.25rem] border border-neutral-300 bg-neutral-950 p-2 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.4)]">
            <div className="overflow-hidden rounded-[1.8rem] bg-white">
              <div className="flex items-center justify-between px-5 pb-3 pt-4 text-[10px] font-semibold text-neutral-500">
                <span>9:41</span>
                <Smartphone size={13} aria-hidden="true" />
              </div>
              <div className="px-5 pb-5 pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-500">{heroContent.mobilePreviewGreeting}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
                      {heroContent.mobilePreviewTitle}
                    </h2>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
                    <LockKeyhole size={16} aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-neutral-950 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-neutral-300">{heroContent.previewDescription}</p>
                      <p className="mt-1 text-sm font-semibold">{heroContent.previewCount}</p>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-xl border border-white/20">
                      <KeyRound size={17} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-neutral-300">
                    <ShieldCheck size={13} aria-hidden="true" />
                    {heroContent.mobilePreviewFooter}
                  </div>
                </div>

                <div className="mb-2 mt-5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-800">{heroContent.mobilePreviewCount}</p>
                  <Search size={14} className="text-neutral-400" aria-hidden="true" />
                </div>
                <div className="space-y-2.5">
                  {heroContent.previewEntries.slice(0, 2).map(({ name, detail }, index) => (
                    <div key={name} className="flex min-w-0 items-center gap-3 rounded-2xl border border-neutral-200 p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700">
                        {index === 0 ? <Globe size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-neutral-900">{name}</p>
                        <p className="mt-1 truncate text-[10px] text-neutral-500">{detail}</p>
                      </div>
                      <Eye size={15} className="shrink-0 text-neutral-400" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4 text-[10px] text-neutral-500">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {heroContent.previewFooter}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-xl px-1 pb-4 sm:px-2 lg:block">
          <div className="absolute inset-4 rounded-full bg-neutral-100 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_28px_90px_-42px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
              <span className="size-2 rounded-full bg-neutral-300" />
              <span className="size-2 rounded-full bg-neutral-300" />
              <span className="size-2 rounded-full bg-neutral-300" />
              <div className="mx-auto flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] text-neutral-500">
                <KeyRound size={11} aria-hidden="true" />
                keynest.app
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <KeyRound size={18} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{heroContent.previewTitle}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{heroContent.previewDescription}</p>
                  </div>
                </div>
                <div
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-neutral-950 px-3 text-xs font-medium text-white"
                  aria-hidden="true"
                >
                  <Plus size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">{heroContent.previewAdd}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-neutral-200 px-3.5 py-2.5 text-neutral-400">
                <Search size={15} aria-hidden="true" />
                <span className="flex-1 text-left text-xs">{heroContent.previewSearch}</span>
                <span className="hidden rounded border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-400 sm:inline">Ctrl K</span>
              </div>

              <div className="mb-2 mt-5 flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold tracking-wide text-neutral-500">{heroContent.previewCount}</p>
                <p className="text-[11px] text-neutral-400">Recently added</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                {heroContent.previewEntries.map(({ mark, name, detail, category }, index) => (
                  <div
                    key={name}
                    className={`flex min-w-0 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 ${index > 0 ? 'border-t border-neutral-100' : ''}`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700">
                      {mark}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-xs font-semibold text-neutral-900 sm:text-sm">{name}</p>
                        <span className="hidden rounded-md bg-neutral-100 px-1.5 py-0.5 text-[8px] font-medium tracking-wide text-neutral-500 sm:inline">
                          {category}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-neutral-500 sm:text-xs">{detail}</p>
                    </div>
                    <span className="hidden items-center gap-1 text-neutral-400 sm:flex" aria-label="Password hidden">
                      <span className="size-1 rounded-full bg-current" />
                      <span className="size-1 rounded-full bg-current" />
                      <span className="size-1 rounded-full bg-current" />
                      <span className="size-1 rounded-full bg-current" />
                      <span className="size-1 rounded-full bg-current" />
                    </span>
                    <Eye className="size-4 shrink-0 text-neutral-400" strokeWidth={1.7} aria-hidden="true" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 text-[10px] leading-4 text-neutral-500 sm:text-xs">
                <ShieldCheck className="size-4 shrink-0 text-neutral-700" strokeWidth={1.7} aria-hidden="true" />
                <span>{heroContent.previewFooter}</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-1 -left-1 hidden rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg sm:block">
            <p className="text-xs font-semibold">{heroContent.floatingTitle}</p>
            <p className="mt-1 text-[11px] text-neutral-500">{heroContent.floatingDescription}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero