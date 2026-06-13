// Layout Wrapper
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0C1F16]">
      <Navbar />
      <main className="flex-1 md:ml-60 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
