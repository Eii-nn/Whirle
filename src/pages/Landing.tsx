import LandingIllustration from '../assets/Landing/model.png'
import Background from '../assets/Landing/Background.svg'
import logo from '../assets/Signup/Logo.svg'

export default function Landing() {
  return (
    <main className="bg relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute top-6 left-6 z-20 flex items-center gap-2 select-none">
        <img
          src={logo}
          alt="Whirl logo"
          className="ml-15 h-5 md:h-7 w-15 drop-shadow"
        />
        <span className="text-white text-5x1 md:text-base font-semibold tracking-wide">HIRL</span>
      </div>
      <button> 
          <a
            href="login"
            className="bg-[#F2F66D]  absolute top-5 right-20 text-sm px-6 py-2 border-2  text-[#6230B8] font-semibold rounded-lg hover:bg-sky-50 transition"
          >
          Login
          </a>
        </button>
      <img 
        src={Background} 
        alt="Background" 
        className='absolute inset-0 w-full h-full object-cover -z-10'
      />
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <header>
          <h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight">
            Whirl Into Fun Conversations Instantly!
          </h1>
          <p className="mt-4 text-l md:text-xl text-white">
          Spin into a fresh conversation anytime, anywhere, with someone completely new.
          </p>
          <button>
            <a
              href="/signup"
              className="mt-6 inline-block bg-[#F2F66D] text-[#6230B8] font-semibold rounded-lg hover:bg-sky-50 transition text-lg font-medium px-6 py-3 rounded-lg shadow transition"
            >
              Start Chatting
            </a>
          </button>
        </header>
        <figure className="relative w-full max-w-sm md:max-w-md">
          <img
            src={LandingIllustration}
            alt="Illustration of a chat conversation"
            className="w-full"
          />
          <figcaption className="sr-only">Example match and connection status bubbles overlaying the chat illustration</figcaption>
          <div className="absolute top-3 left-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-2 rounded-lg shadow">
            You’re now connected! <br />
            Start your Whirl
          </div>
          <div className="absolute bottom-3 right-3 bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg shadow">
            You’ve been matched! <br />
            Say hi to Alex!
          </div>
        </figure>
      </section>
    </main>
  )
}