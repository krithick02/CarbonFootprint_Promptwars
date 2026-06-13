import { useState } from 'react';
import { Leaf, LayoutDashboard, BookOpen, Lightbulb, TrendingUp, Settings, X, Key, Trash2, MapPin, Sparkles, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'log', icon: BookOpen, label: 'Daily Log' },
  { id: 'insights', icon: Lightbulb, label: 'Insights' },
  { id: 'progress', icon: TrendingUp, label: 'Progress' },
];

export default function Navbar({ activeSection, scrollTo: scrollToProp }) {
  const { apiKey, setApiKey, googleMapsKey, setGoogleMapsKey, geminiKey, setGeminiKey, aiProvider, setAiProvider, resetApp, monthlyFootprint } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  
  // Local state for settings form
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [mapsInput, setMapsInput] = useState(googleMapsKey || '');
  const [geminiInput, setGeminiInput] = useState(geminiKey || '');
  const [providerInput, setProviderInput] = useState(aiProvider || 'gemini');

  const scrollTo = (id) => {
    if (scrollToProp) {
      scrollToProp(id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveKey = () => {
    setApiKey(keyInput.trim());
    setGoogleMapsKey(mapsInput.trim());
    setGeminiKey(geminiInput.trim());
    setAiProvider(providerInput);
    setShowSettings(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all data? This cannot be undone.')) {
      resetApp();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen glass-dark border-r border-[rgba(82,183,136,0.15)] fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(82,183,136,0.15)]">
          <button onClick={() => scrollTo('dashboard')} aria-label="Go to Dashboard" className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#74C69D] to-[#40916C] flex items-center justify-center shadow-[0_0_20px_rgba(82,183,136,0.4)]">
              <Leaf size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-offwhite text-lg leading-tight">EcoTrack</p>
              <p className="text-xs text-[#74C69D] opacity-70">Carbon Footprint</p>
            </div>
          </button>
        </div>

        {/* Monthly Score */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-[rgba(82,183,136,0.1)] border border-[rgba(82,183,136,0.2)]">
          <p className="text-xs text-[rgba(248,249,250,0.5)] mb-1">This Month</p>
          <p className="font-display font-bold text-xl text-[#52B788]">{monthlyFootprint.toFixed(1)} kg</p>
          <p className="text-xs text-[rgba(248,249,250,0.5)]">CO₂e logged</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                aria-label={`Go to ${label}`}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link w-full ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
                {isActive && <ChevronRight size={14} className="ml-auto opacity-60" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="p-3 border-t border-[rgba(82,183,136,0.15)]">
          <button onClick={() => setShowSettings(true)} aria-label="Open Settings" aria-haspopup="dialog" className="nav-link w-full text-left">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass-dark border-b border-[rgba(82,183,136,0.15)] px-4 py-3 flex items-center justify-between">
        <button onClick={() => scrollTo('dashboard')} aria-label="EcoTrack — Go to Dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#74C69D] to-[#40916C] flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-offwhite">EcoTrack</span>
        </button>

        {/* Mobile nav pills */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`p-2 rounded-lg transition-all ${activeSection === id ? 'bg-[rgba(82,183,136,0.2)] text-[#52B788]' : 'text-[rgba(248,249,250,0.5)]'}`}
            >
              <Icon size={16} />
            </button>
          ))}
          <button onClick={() => setShowSettings(true)} aria-label="Open Settings" aria-haspopup="dialog" className="p-2 text-[rgba(248,249,250,0.5)]">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-md animate-scale-in" role="dialog" aria-modal="true" aria-label="Settings">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-offwhite">Settings</h2>
              <button onClick={() => setShowSettings(false)} aria-label="Close Settings" className="text-[rgba(248,249,250,0.5)] hover:text-offwhite transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Google Maps */}
              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2 flex items-center gap-2">
                  <MapPin size={14} className="text-[#F4A261]" />
                  Google Maps API Key
                </label>
                <input
                  type="password"
                  value={mapsInput}
                  onChange={(e) => setMapsInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="form-input mb-1 w-full"
                />
                <p className="text-[10px] text-[rgba(248,249,250,0.4)]">
                  Used for the Trip Planner. Needs Places & Distance Matrix API.
                </p>
              </div>

              {/* AI Provider Toggle */}
              <div>
                <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#52B788]" />
                  AI Provider for Tips
                </label>
                <div className="flex gap-2 mb-2">
                  <button 
                    onClick={() => setProviderInput('gemini')}
                    className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${providerInput === 'gemini' ? 'bg-[rgba(82,183,136,0.2)] border-[#52B788] text-[#52B788]' : 'border-[rgba(248,249,250,0.1)] text-[rgba(248,249,250,0.5)]'}`}
                  >
                    Gemini 1.5
                  </button>
                  <button 
                    onClick={() => setProviderInput('claude')}
                    className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-all ${providerInput === 'claude' ? 'bg-[rgba(82,183,136,0.2)] border-[#52B788] text-[#52B788]' : 'border-[rgba(248,249,250,0.1)] text-[rgba(248,249,250,0.5)]'}`}
                  >
                    Claude 3.5
                  </button>
                </div>
              </div>

              {/* Gemini Key */}
              {providerInput === 'gemini' && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2 flex items-center gap-2">
                    <Key size={14} className="text-[#4CC9F0]" />
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiInput}
                    onChange={(e) => setGeminiInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="form-input mb-1 w-full"
                  />
                  <p className="text-[10px] text-[rgba(248,249,250,0.4)]">
                    Generous free tier available at aistudio.google.com
                  </p>
                </div>
              )}

              {/* Claude Key */}
              {providerInput === 'claude' && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-[rgba(248,249,250,0.7)] mb-2 flex items-center gap-2">
                    <Key size={14} className="text-[#9B5DE5]" />
                    Anthropic API Key
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-ant-..."
                    className="form-input mb-1 w-full"
                  />
                </div>
              )}
            </div>

            <button onClick={handleSaveKey} className="btn-primary w-full mb-4">
              Save Settings
            </button>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Reset All Data
            </button>
          </div>
        </div>
      )}
    </>
  );
}
