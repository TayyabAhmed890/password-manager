import { Link } from 'react-router-dom'
import { brandContent, footerContent } from '../data/landingContent'

const Footer = () => {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link to="/" className="font-semibold text-neutral-900">{brandContent.name}</Link>
        <p>{footerContent.tagline}</p>
        <div className="flex gap-5">
          <Link className="transition hover:text-neutral-950" to="/login">{footerContent.login}</Link>
          <Link className="transition hover:text-neutral-950" to="/register">{footerContent.register}</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer