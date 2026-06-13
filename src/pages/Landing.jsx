import { useEffect, useRef } from 'react';
import { ArrowRight, Leaf, BarChart3, Lightbulb, Globe2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Landing({ onStart }) {
  const canvasRef = useRef(null);
  const { onboardingComplete } = useApp();

  // CO₂ particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 20;
        this.size = Math.random() * 4 + 2;
        this.speedY = -(Math.random() * 1.5 + 0.5);
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.5 + 0.1;
        this.label = Math.random() > 0.7 ? 'CO₂' : null;
      }
      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y < canvas.height * 0.3) {
          this.opacity = Math.max(0, this.opacity - 0.015);
        } else {
          this.opacity = Math.min(this.maxOpacity, this.opacity + 0.02);
        }
        if (this.opacity <= 0 && this.y < canvas.height * 0.3) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        if (this.label) {
          ctx.font = `${this.size * 3}px Inter, sans-serif`;
          ctx.fillStyle = '#52B788';
          ctx.fillText(this.label, this.x, this.y);
        } else {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = '#52B788';
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Initialize
    for (let i = 0; i < 60; i++) {
      const p = new Particle();
      p.y = Math.random() * canvas.height;
      p.opacity = Math.random() * p.maxOpacity;
      particles.push(p);
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => { p.update(); p.draw(); });
      animId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleStart = () => {
    if (onStart) onStart();
  };

  return (
    <div className="min-h-screen bg-[#0C1F16] overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Radial bg glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse,rgba(82,183,136,0.08)_0%,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[radial-gradient(ellipse,rgba(27,67,50,0.6)_0%,transparent_70%)]" />
        </div>

        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          id="particle-canvas"
          className="absolute inset-0 w-full h-full"
        />

        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-mint/30 text-mint text-sm font-medium mb-8 animate-fade-in-up">
            <Globe2 size={14} />
            Track • Analyze • Act
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl text-offwhite mb-6 leading-tight animate-fade-in-up delay-100">
            Your Carbon{' '}
            <span className="gradient-text">Footprint</span>
            <br />Starts Here
          </h1>

          <p className="text-lg md:text-xl text-[rgba(248,249,250,0.65)] mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Understand, track, and reduce your personal environmental impact with AI-powered insights and real-time carbon calculations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
            <button onClick={handleStart} className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-4">
              {onboardingComplete ? 'Go to Dashboard' : 'Start Tracking'}
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-secondary text-base px-8 py-4"
            >
              Learn More
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in-up delay-400">
            {[
              { value: '4t', label: 'Global avg / year' },
              { value: '2t', label: 'Paris target' },
              { value: '73%', label: 'Reducible w/ habits' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display font-bold text-2xl gradient-text">{s.value}</p>
                <p className="text-xs text-[rgba(248,249,250,0.45)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-mint/40 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-mint rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl text-offwhite mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-[rgba(248,249,250,0.55)] text-lg">Three simple steps to a greener life</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Leaf,
                title: 'Log Your Activities',
                desc: 'Track daily activities like driving, meals, and energy use with pre-built quick-add cards. Each entry instantly shows its CO₂ impact.',
                color: '#52B788',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Analyze Your Impact',
                desc: 'See your carbon footprint broken down by category—transport, food, energy, and shopping—with beautiful real-time charts.',
                color: '#F4A261',
              },
              {
                step: '03',
                icon: Lightbulb,
                title: 'Get AI-Powered Tips',
                desc: 'Receive personalized reduction tips generated by Claude AI based on your unique emission profile and biggest impact areas.',
                color: '#4CC9F0',
              },
            ].map((item, i) => (
              <div key={i} className="card p-8 text-center group">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}
                >
                  <item.icon size={28} style={{ color: item.color }} />
                </div>
                <div className="font-display font-bold text-5xl opacity-10 text-offwhite mb-2">{item.step}</div>
                <h3 className="font-display font-bold text-xl text-offwhite mb-3">{item.title}</h3>
                <p className="text-sm text-[rgba(248,249,250,0.55)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <button onClick={handleStart} className="btn-primary text-base px-10 py-4 flex items-center gap-2 mx-auto">
              {onboardingComplete ? 'Go to Dashboard' : 'Start Tracking Now'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[rgba(82,183,136,0.1)] py-8 text-center text-sm text-[rgba(248,249,250,0.3)]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf size={14} className="text-mint opacity-50" />
          <span className="font-display font-semibold text-mint opacity-50">EcoTrack</span>
        </div>
        <p>Built for a greener planet · PromptWars Hackathon 2025</p>
      </footer>
    </div>
  );
}
