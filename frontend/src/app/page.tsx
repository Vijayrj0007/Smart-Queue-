'use client';

/**
 * Landing Page — Home
 * Modern, professional landing page matching the reference design
 * Sections: Hero, Features, How It Works, Why Choose Us, CTA
 */
import React from 'react';
import Link from 'next/link';
import {
  ArrowRight, Smartphone, Radio, Brain, LayoutDashboard,
  Clock, Users, Shield, BarChart3, AlertTriangle, Bell,
  CheckCircle2, ChevronRight, Zap, TrendingUp, Star
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="bg-hero-gradient relative pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#4F6AF6]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#4F6AF6]/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-[var(--primary-100)] text-sm font-medium text-[var(--primary)] mb-6 shadow-sm">
                <Zap size={14} className="text-yellow-500" />
                #1 Queue Management Platform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[var(--secondary)] mb-6">
                Smart Queue{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F6AF6] to-[#3B50D5]">
                  Management
                </span>{' '}
                System
              </h1>

              <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8 max-w-lg">
                Book tokens remotely and skip long waiting lines. 
                Real-time queue tracking for hospitals, clinics, banks, and government offices.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary text-base !py-3.5 !px-8 group">
                  Book Token
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/locations" className="btn-secondary text-base !py-3.5 !px-8">
                  Track Queue
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-gray-200/60">
                {[
                  { number: '10K+', label: 'Tokens Issued' },
                  { number: '50+', label: 'Locations' },
                  { number: '99%', label: 'Satisfaction' },
                ].map((stat, i) => (
                  <div key={i} className="animate-count-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                    <p className="text-2xl md:text-3xl font-bold text-[var(--primary)]">{stat.number}</p>
                    <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Queue Visualization Card */}
            <div className="relative animate-slide-in-right hidden lg:block">
              <div className="relative z-10">
                {/* Main Queue Display Card */}
                <div className="bg-white rounded-2xl shadow-2xl shadow-blue-100 p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Now Serving</p>
                      <p className="text-5xl font-bold text-[var(--primary)] mt-1">A101</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-white" />
                    </div>
                  </div>
                  <div className="bg-[var(--primary-50)] rounded-xl p-4 mt-4">
                    <p className="text-sm font-medium text-[var(--primary)] mb-3">Queue Status</p>
                    <div className="space-y-2">
                      {[
                        { token: 'A101', status: 'Serving', color: 'bg-green-500' },
                        { token: 'A102', status: 'Called', color: 'bg-blue-500' },
                        { token: 'A103', status: 'Waiting', color: 'bg-yellow-500' },
                        { token: 'A104', status: 'Waiting', color: 'bg-yellow-500' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{item.token}</span>
                          <span className={`${item.color} text-white text-xs font-medium px-2 py-0.5 rounded-full`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Clock size={14} />
                      <span>Est. wait: <strong className="text-[var(--text-primary)]">~12 min</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Users size={14} />
                      <span><strong className="text-[var(--text-primary)]">4</strong> in queue</span>
                    </div>
                  </div>
                </div>

                {/* Floating notification card */}
                <div className="absolute -top-4 -right-8 bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 animate-float border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Bell size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Your turn is next!</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Token A102 - 2 min ago</p>
                  </div>
                </div>

                {/* Floating stat card */}
                <div className="absolute -bottom-6 -left-8 bg-white rounded-xl shadow-lg p-3 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary-50)] flex items-center justify-center">
                      <TrendingUp size={16} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Today&apos;s Served</p>
                      <p className="text-lg font-bold text-[var(--primary)]">247</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-16 md:py-24 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--secondary)] mb-4">
              Our Key Features
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Streamline queue management with our powerful and intuitive features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone size={28} />,
                title: 'Remote Token Booking',
                description: 'Book tokens remotely from your smartphone or computer, reducing the need for physical queues.',
                color: 'from-blue-500 to-blue-600',
                bg: 'bg-blue-50'
              },
              {
                icon: <Radio size={28} />,
                title: 'Real-Time Queue Tracking',
                description: 'Monitor live queue status with real-time updates, accessible from any device, anywhere.',
                color: 'from-purple-500 to-purple-600',
                bg: 'bg-purple-50'
              },
              {
                icon: <Brain size={28} />,
                title: 'AI Waiting Time Prediction',
                description: 'Predict accurate waiting time using smart algorithms and historical queue data analysis.',
                color: 'from-green-500 to-green-600',
                bg: 'bg-green-50'
              },
              {
                icon: <LayoutDashboard size={28} />,
                title: 'Smart Admin Dashboard',
                description: 'Access a comprehensive admin dashboard to manage, analyze and optimize queuing experience.',
                color: 'from-orange-500 to-orange-600',
                bg: 'bg-orange-50'
              },
              {
                icon: <BarChart3 size={28} />,
                title: 'Analytics & Reporting',
                description: 'Get detailed analytics on queue performance, wait times, and service efficiency metrics.',
                color: 'from-cyan-500 to-cyan-600',
                bg: 'bg-cyan-50'
              },
              {
                icon: <AlertTriangle size={28} />,
                title: 'Priority & Emergency',
                description: 'Handle priority and emergency cases efficiently with special queue management tools.',
                color: 'from-red-500 to-red-600',
                bg: 'bg-red-50'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="card group cursor-default"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`}>
                    {React.cloneElement(feature.icon, { className: `text-transparent stroke-current`, style: { stroke: 'url(#grad)' } })}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl absolute ${feature.bg} flex items-center justify-center`}>
                    <span className={`bg-gradient-to-br ${feature.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      {feature.icon}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--secondary)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 md:py-24 bg-[var(--bg-light)]" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--secondary)] mb-4">
              How It Works
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Get started in just 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                icon: <Users size={32} />,
                title: 'Login / Register',
                description: 'Create your account or sign in to access remote token booking features.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                step: '02',
                icon: <MapPinIcon />,
                title: 'Select Service',
                description: 'Choose your preferred hospital, clinic, or service center from the list.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                step: '03',
                icon: <TicketIcon />,
                title: 'Generate Token',
                description: 'Book your digital token instantly and get your queue position.',
                color: 'from-green-500 to-green-600'
              },
              {
                step: '04',
                icon: <Radio size={32} />,
                title: 'Track Queue',
                description: 'Track your queue position in real-time and get notified when your turn arrives.',
                color: 'from-orange-500 to-orange-600'
              },
            ].map((step, i) => (
              <div key={i} className="text-center group relative">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[var(--primary-100)] to-transparent z-0" />
                )}
                
                <div className="relative z-10 inline-flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--primary)]">{step.step}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-[var(--secondary)] mt-2 mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[220px] mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--secondary)] mb-4">
              Why Choose SmartQueue?
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Reduced queue hassles with smart digital management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Clock size={24} />, title: 'Reduced Wait Times', desc: 'Significantly decrease customer waiting times by optimizing the queue process.', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: <Star size={24} />, title: 'Improved Satisfaction', desc: 'Provide a hassle-free, organized and transparent queuing experience.', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: <Zap size={24} />, title: 'Enhanced Efficiency', desc: 'Optimize on all customer and service efficiency with smart allocation.', color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { icon: <BarChart3 size={24} />, title: 'Detailed Analytics', desc: 'Gain valuable insights through detailed analytics, reports & trends.', color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: <AlertTriangle size={24} />, title: 'Priority Handling', desc: 'Handle priority and emergency cases with dedicated fast-track queues.', color: 'text-red-600', bg: 'bg-red-50' },
              { icon: <Bell size={24} />, title: 'Instant Notifications', desc: 'Receive real-time queue updates and alerts when your turn approaches.', color: 'text-cyan-600', bg: 'bg-cyan-50' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl hover:bg-gray-50 transition-colors duration-300 group">
                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className={item.color}>{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[var(--secondary)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="bg-cta-gradient py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Revolutionize Queue Management?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations that trust SmartQueue to streamline their queue operations.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[var(--primary)] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-2"
            >
              Talk to Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Custom SVG icons for steps
function MapPinIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}
