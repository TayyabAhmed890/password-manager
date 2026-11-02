import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { scrollToTopContent } from '../data/landingContent'

const SCROLL_THRESHOLD = 320

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })

    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!isVisible) {
    return null
  }

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={scrollToTopContent.label}
      className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 shadow-lg transition hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:bottom-7 sm:right-7"
    >
      <ArrowUp size={19} aria-hidden="true" />
    </button>
  )
}

export default ScrollToTopButton
