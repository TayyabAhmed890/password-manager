import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  ChevronDown,
  Moon,
  List,
  Pencil,
  Trash2,
} from 'lucide-react'
import { heroContent, brandContent } from '../data/landingContent'

const Hero = () => {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
        <div className="text-center lg:text-left">
          <h1 className="mx-auto max-w-[13ch] text-[clamp(2.6rem,5.2vw,4.28rem)] font-bold leading-[1.06] tracking-[-0.045em] lg:mx-0 font-space ">
            {heroContent.title}
            <span className="block text-neutral-500">{heroContent.titleEmphasis}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-neutral-600 sm:text-md md:text-xl sm:leading-8 lg:mx-0 font-space">
            {heroContent.description}
          </p>
          <div className="font-space mx-auto mt-8 flex w-full max-w-xs flex-col items-stretch justify-center gap-2.5 sm:mx-0 sm:mt-9 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-3 lg:justify-start">
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

        </div>


        {/* Mobile Dashboard Preview */}
        <div className="relative mx-auto w-full max-w-xl px-1 pb-5 sm:px-2 lg:hidden">

          {/* Background Glow */}
          <div className="absolute inset-5 rounded-full bg-neutral-100 blur-3xl" />

          {/* Dashboard Window */}
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#fafafa] shadow-[0_24px_70px_-35px_rgba(0,0,0,0.22)]">

            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-3">

              <div className="flex items-center gap-1">



                <img src="keynest.png" alt="" className="size-10 object-contain" />
                <span className="font-space text-lg font-semibold tracking-tight">
                  {brandContent.name}
                </span>

                <span className="hidden h-5 w-px bg-neutral-200 xs:block" />

                <span className="hidden text-[10px] text-neutral-400 xs:block">
                  {heroContent.previewDescription}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <div className="flex size-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500">
                  <Moon size={14} />
                </div>

                <div className="flex size-8 items-center justify-center rounded-full bg-neutral-950 font-space text-[10px] font-semibold text-white">
                  M
                </div>

              </div>

            </div>

            {/* Dashboard Content */}
            <div className="p-3.5 sm:p-5">

              {/* Heading */}
              <div className="flex items-center justify-between gap-2">

                <div className="min-w-0">



                  <h2 className="mt-1 font-space text-xl font-semibold tracking-tighter text-neutral-950 sm:text-2xl">
                    {heroContent.previewTitle}
                  </h2>

                  <p className="mt-1 text-[10px] text-neutral-500 sm:text-xs">
                    {heroContent.mobilePreviewGreeting}
                  </p>

                </div>

                <div className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-neutral-950 px-2.5 text-[10px] font-semibold text-white sm:px-3 sm:text-xs">
                  <Plus size={13} />
                  {heroContent.previewAdd}
                </div>

              </div>

              {/* Saved Logins */}
              <div className="mt-5 flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <h3 className="font-space text-xs font-semibold text-neutral-900">
                    Saved logins
                  </h3>

                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] text-neutral-500">
                    {heroContent.previewCount}
                  </span>

                </div>

                <span className="text-[9px] text-neutral-400">
                  Recently added
                </span>

              </div>

              {/* Search */}
              <div className="mt-3 flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">

                <Search size={14} className="shrink-0 text-neutral-400" />

                <span className="min-w-0 flex-1 truncate text-[10px] text-neutral-400 sm:text-xs">
                  {heroContent.previewSearch}
                </span>

              </div>

              {/* Login Cards */}
              <div className="mt-3 space-y-2.5">

                {heroContent.previewEntries.map(({ mark, name, detail, category }) => (

                  <div
                    key={name}
                    className="rounded-xl border border-neutral-200 bg-white p-3"
                  >

                    {/* Account Details */}
                    <div className="flex items-center gap-2.5">

                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 font-space text-xs font-semibold text-neutral-700">
                        {mark}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-1.5">

                          <p className="truncate font-space text-xs font-semibold text-neutral-900">
                            {name}
                          </p>

                          <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[8px] text-neutral-500">
                            {category}
                          </span>

                        </div>

                        <p className="mt-1 truncate text-[10px] text-neutral-500">
                          {detail}
                        </p>

                      </div>


                    </div>

                    {/* Password and Actions */}
                    <div className="mt-3 flex items-center gap-1.5">

                      <div className="flex h-8 min-w-0 flex-1 items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-2.5">

                        <span className="truncate text-[10px] tracking-[2px] ">
                          ••••••••••••
                        </span>


                      </div>

                      <div className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-[9px] font-medium text-neutral-600">
                        <Pencil size={11} />
                        Update
                      </div>

                      <div className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 px-2 text-[9px] font-medium text-neutral-600">
                        <Eye size={11} />
                        Show
                      </div>

                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600">
                        <Trash2 size={12} />
                      </div>

                    </div>

                  </div>

                ))}

              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-3 text-center text-[9px] leading-4 text-neutral-500">

                <ShieldCheck size={13} className="shrink-0" />

                <span>{heroContent.previewFooter}</span>

              </div>

            </div>

          </div>

          {/* Floating Card */}
          <div className="absolute -bottom-1 right-2 hidden rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-lg sm:block">

            <div className="flex items-center gap-2">

              <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-950 text-white">
                <Eye size={15} />
              </div>

              <div>
                <p className="font-space text-[10px] font-semibold text-neutral-950">
                  {heroContent.privacyTitle}
                </p>

                <p className="mt-0.5 text-[9px] text-neutral-500">
                  {heroContent.privacyDescription}
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* Desktop Dashboard Preview */}
        <div className="relative mx-auto hidden w-full max-w-xl px-1 pb-4 sm:px-2 lg:block">

          {/* Background Glow */}
          <div
            className="absolute inset-4 rounded-full bg-neutral-100 blur-3xl"
            aria-hidden="true"
          />

          {/* Dashboard Window */}
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[#fafafa] shadow-[0_28px_90px_-42px_rgba(0,0,0,0.28)]">

            {/* Top Navigation */}
            <div className="flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">

              <div className="flex items-center gap-1">

                <img src="keynest.png" alt="" className="size-10 object-contain" />
                <span className="font-space text-lg font-semibold tracking-tight">
                  {brandContent.name}
                </span>


              </div>

              <div className="flex items-center gap-3">

                <span className="flex size-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500">
                  <Moon size={14} />
                </span>

                <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pr-2.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-neutral-950 font-space text-[10px] font-semibold text-white">
                    M
                  </span>

                  <span className="text-[11px] font-medium text-neutral-700">
                    mark
                  </span>

                  <ChevronDown size={12} className="text-neutral-400" />
                </div>

              </div>
            </div>

            <div className="flex min-h-110">

              {/* Sidebar */}
              <aside className="flex w-16.5 shrink-0 flex-col items-center justify-between border-r border-neutral-200 bg-white py-5">

                <div className="flex flex-col items-center gap-5">

                  <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-950 text-white">
                    <List size={19} />
                  </div>

                  <div className="flex size-10 items-center justify-center rounded-xl text-neutral-400">
                    <Plus size={19} />
                  </div>

                </div>

                <div className="flex flex-col items-center gap-5 text-neutral-400">
                  <Trash2 size={17} />

                  <ArrowRight size={17} />
                </div>

              </aside>

              {/* Main Content */}
              <div className="min-w-0 flex-1 p-5">

                {/* Dashboard Heading */}
                <div className="flex items-end justify-between gap-3">

                  <div>


                    <h2 className="mt-1 font-space text-[27px] font-semibold tracking-tighter text-neutral-950">
                      {heroContent.previewTitle}
                    </h2>


                  </div>

                  <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-[11px] font-semibold text-white">
                    <Plus size={14} />
                    {heroContent.previewAdd}
                  </div>

                </div>

                <div className="my-5 border-t border-neutral-200" />

                {/* Search */}
                <div className="mb-3 flex items-center justify-between">

                  <p className="font-space text-xs font-semibold text-neutral-800">
                    {heroContent.previewCount}
                  </p>

                  <span className="text-[10px] text-neutral-400">
                    Recently added
                  </span>

                </div>

                <div className="flex h-10 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5">

                  <Search size={15} className="text-neutral-400" />

                  <span className="flex-1 text-[11px] text-neutral-400">
                    {heroContent.previewSearch}
                  </span>



                </div>

                {/* Login Entries */}
                <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">

                  {heroContent.previewEntries.map(({ mark, name, detail }, index) => (

                    <div
                      key={name}
                      className={`px-3.5 py-3 ${index > 0 ? 'border-t border-neutral-100' : ''
                        }`}
                    >

                      {/* Account Information */}
                      <div className="flex items-center gap-3">

                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 font-space text-sm font-medium text-neutral-700">
                          {mark}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <p className="truncate font-space text-xs font-semibold text-neutral-900">
                              {name}
                            </p>



                          </div>

                          <p className="mt-1 truncate text-[10px] text-neutral-500">
                            {detail}
                          </p>

                        </div>


                      </div>

                      {/* Password Actions */}
                      <div className="mt-2.5 flex items-center gap-2 pl-12">

                        <div className="flex h-8 flex-1 items-center rounded-lg border border-neutral-100 bg-neutral-50">
                          <div className="flex w-full items-center justify-between px-3">
                            <span className="text-[11px] tracking-[3px]">
                              •••••••••
                            </span>

                          </div>
                        </div>

                        <div className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-[9px] font-medium text-neutral-600">
                          <Pencil size={11} />
                          Update
                        </div>

                        <div className="flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-[9px] font-medium text-neutral-600">
                          <Eye size={11} />
                          Show
                        </div>

                        <div className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-400">
                          <Trash2 size={12} />
                        </div>

                      </div>

                    </div>

                  ))}

                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-3 text-[10px] text-neutral-500">

                  <ShieldCheck size={13} />

                  <span>{heroContent.previewFooter}</span>

                </div>

              </div>
            </div>
          </div>

          {/* Floating Feature Card */}
          <div className="absolute -bottom-1 -left-1 hidden rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-lg sm:block">

            <p className="font-space text-xs font-semibold">
              {heroContent.floatingTitle}
            </p>

            <p className="mt-1 text-[11px] text-neutral-500">
              {heroContent.floatingDescription}
            </p>

          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero