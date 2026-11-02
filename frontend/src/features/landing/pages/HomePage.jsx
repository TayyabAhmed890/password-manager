import Cards from '../components/Cards'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import Navbar from '../components/Navbar'
import ScrollToTopButton from '../components/ScrollToTopButton'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Navbar />
      <main>
        <Hero />
        <Cards />
      </main>
      <Footer />
      <ScrollToTopButton />
    </div>
  )
}

export default HomePage