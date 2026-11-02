import { Link } from 'react-router-dom'
import { benefitsContent, callToActionContent, featuresContent } from '../data/landingContent'

const Cards = () => {
  const CallToActionIcon = callToActionContent.icon

  return (
    <>
      <section id="why-keynest" className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-neutral-500">{benefitsContent.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {benefitsContent.title}
              <span className="block text-neutral-500">{benefitsContent.titleEmphasis}</span>
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-600">
              {benefitsContent.description}
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {benefitsContent.items.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm transition-colors hover:border-neutral-400 sm:p-7">
                <span className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-7 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-wide text-neutral-500">{featuresContent.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{featuresContent.title}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-neutral-600">
            {featuresContent.description}
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuresContent.items.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-neutral-300 p-6 shadow-sm transition-colors hover:border-neutral-400">
              <span className="flex size-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-neutral-950 px-7 py-10 text-white sm:flex-row sm:items-center sm:px-12 sm:py-12">
          <div>
            <p className="text-sm font-medium tracking-wide text-neutral-400">{callToActionContent.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{callToActionContent.title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-300">{callToActionContent.description}</p>
          </div>
          <Link
            to="/register"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white bg-white px-5 text-sm font-semibold text-neutral-950 transition hover:border-neutral-300 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {callToActionContent.action}
            <CallToActionIcon size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}

export default Cards