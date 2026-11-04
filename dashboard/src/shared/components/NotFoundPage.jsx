import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 text-center">
    <section>
      <h1 className="text-8xl font-bold tracking-tight text-slate-950 sm:text-9xl">404</h1>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Not found</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        The link may be incorrect, or the page may have moved.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Back to dashboard
      </Link>
    </section>
  </main>
)

export default NotFoundPage
