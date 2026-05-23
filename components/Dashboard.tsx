'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bot, Zap, Users, BookOpen, MessageSquare, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScheduleWidget } from '@/components/features/dashboard/ScheduleWidget'
import { TrendingThreadsWidget } from '@/components/features/dashboard/TrendingThreadsWidget'
import { RecentActivityWidget } from '@/components/features/dashboard/RecentActivityWidget'

const slides = [
  {
    label: 'Forums',
    title: 'Join the Conversation',
    subtitle: 'Ask questions, share answers, and grow together',
    image: '/discussion-image.png',
    badge: 'Discussion',
    href: '/forums',
    Icon: MessageSquare,
  },
  {
    label: 'Study Groups',
    title: 'Study Together',
    subtitle: 'Find your people and ace your exams as a team',
    image: '/study-group-image.png',
    badge: 'Collaborate',
    href: '/groups',
    Icon: Users,
  },
  {
    label: 'Materials',
    title: 'Shared Resources',
    subtitle: 'Notes, slides, and past papers — all in one place',
    image: '/resources-image.png',
    badge: 'Resources',
    href: '/materials',
    Icon: BookOpen,
  },
]

export default function Dashboard() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [paused])

  const slide = slides[current]!
  const { Icon } = slide

  return (
    <div className="bg-background transition-colors duration-300">
      {/* ── Carousel hero ── */}
      <section
        className="relative min-h-[420px] overflow-hidden"
        style={{ height: '58vh' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background crossfade */}
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.image}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            <Image
              src={slide.image}
              alt={slide.label}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            {/* Bottom-heavy gradient — image breathes at top, text sits on dark at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
            {/* Left fade for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-20 flex h-full flex-col px-6 py-5 sm:px-10 md:px-12">
          {/* Image breathing room */}
          <div className="flex-1" />

          {/* Bottom: slide context + CTA + dots */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex items-end justify-between gap-4"
            >
              <div>
                <div className="mb-1.5 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-sm">
                  <Icon className="h-3 w-3" />
                  {slide.badge}
                </div>
                <p className="text-lg leading-snug font-bold text-white">{slide.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/65">
                  <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {slide.subtitle}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-3">
                <Link
                  href="/ai-tutor"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ask AI Tutor</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Bottom bar: pills + dots (left) · Explore link (right) ── */}
          <div className="mt-4 flex items-center justify-between gap-4 pb-1">
            {/* Left: pills + dots aligned together */}
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="flex items-center gap-2">
                {slides.map((s, i) => {
                  const PillIcon = s.Icon
                  return (
                    <button
                      key={s.label}
                      onClick={() => setCurrent(i)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors ${
                        i === current
                          ? 'text-foreground border-white/60 bg-white/80 dark:border-white/40 dark:bg-white/20 dark:text-white'
                          : 'text-foreground/70 hover:text-foreground border-white/40 bg-white/50 hover:bg-white/70 dark:border-white/20 dark:bg-transparent dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/90'
                      }`}
                    >
                      <PillIcon className="h-3.5 w-3.5" />
                      {s.label}
                    </button>
                  )
                })}
              </div>
              {/* Dots — aligned with pills */}
              <div className="flex shrink-0 items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    aria-label={`View slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'bg-foreground w-5 dark:bg-white'
                        : 'bg-foreground/35 hover:bg-foreground/60 w-1.5 dark:bg-white/35 dark:hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Explore CTA — hidden on mobile, visible sm+ */}
            <Link
              href={slide.href}
              className="text-foreground/80 hover:text-foreground hidden shrink-0 items-center gap-1.5 rounded-full border border-white/50 bg-white/60 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/80 sm:inline-flex dark:border-white/25 dark:bg-white/10 dark:text-white/80 dark:hover:border-white/40 dark:hover:bg-white/20 dark:hover:text-white"
            >
              Explore {slide.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Sentinel at 50% hero height — layout observes this to trigger navbar background */}
        <div
          id="hero-nav-sentinel"
          className="pointer-events-none absolute inset-x-0"
          style={{ top: '50%' }}
        />

        {/* Cloud — fades image into page background in both modes */}
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t to-transparent" />
      </section>

      {/* ── Workspace ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mx-auto max-w-7xl px-5 py-6 sm:px-8 md:px-12"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
          {/* Left: Trending Discussions */}
          <div className="border-border self-start overflow-hidden rounded-2xl border p-5">
            <TrendingThreadsWidget />
          </div>

          {/* Right: Upcoming + Recent as separate cards */}
          <div className="flex flex-col gap-4">
            <div className="border-border rounded-2xl border p-5">
              <ScheduleWidget />
            </div>
            <div className="border-border rounded-2xl border p-5">
              <RecentActivityWidget />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
