import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-[500] py-4 px-6 md:px-12 flex justify-between items-center bg-transparent backdrop-blur-xl border-b border-white/5">
      <Link to="/" className="z-50 relative flex items-center gap-3">
        <span className="font-sync tracking-[0.3em] text-white text-xs md:text-sm font-bold">15D WINGS</span>
      </Link>
    </nav>
  );
}
