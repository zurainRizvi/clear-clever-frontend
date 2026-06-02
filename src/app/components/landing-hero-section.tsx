import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowRightCircle,
  BrainCircuit,
  CheckCircle2,
  Lock,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";
import { DarkModeToggle } from "./dark-mode-toggle";
import heroVehicle from "@/assets/landing/hero-vehicle.png";
import heroVehicleBike from "@/assets/landing/hero-vehicle-bike.png";
import heroVehicleJeep from "@/assets/landing/hero-vehicle-jeep.png";
import heroHome from "@/assets/landing/hero-home.png";
import heroHomeApartment from "@/assets/landing/hero-home-apartment.png";
import heroHomeCottage from "@/assets/landing/hero-home-cottage.png";
import heroLifeFamily from "@/assets/landing/hero-life-family.png";
import heroLifeHealth from "@/assets/landing/hero-life-health.png";
import heroPet from "@/assets/landing/hero-pet.png";
import heroPetDog from "@/assets/landing/hero-pet-dog.png";
import heroPetCat from "@/assets/landing/hero-pet-cat.png";
import logoHbl from "@/assets/landing/partners/hbl.svg";
import logoJubilee from "@/assets/landing/partners/jubilee.svg";
import logoAdamjee from "@/assets/landing/partners/adamjee.svg";
import logoTpl from "@/assets/landing/partners/tpl.svg";
import logoAllianz from "@/assets/landing/partners/allianz.svg";
import logoEfu from "@/assets/landing/partners/efu-life.svg";
import logoIgi from "@/assets/landing/partners/igi.svg";

const NAV_LINKS = ["Features", "How It Works", "Testimonials", "FAQ"] as const;

const FEATURE_HIGHLIGHTS = [
  {
    icon: Target,
    title: "Personalized Recommendations",
    description: "Tailored to your needs",
    iconColor: "#2563EB",
    bg: "#EEF4FF",
  },
  {
    icon: ShieldCheck,
    title: "Compare & Choose",
    description: "View plans side by side",
    iconColor: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data stays protected",
    iconColor: "#8B5CF6",
    bg: "#F5F3FF",
  },
] as const;

type InsuranceSlideImage = { src: string; label: string };

type InsuranceCard = {
  title: string;
  shortLabel: string;
  description: string;
  images: InsuranceSlideImage[];
  background: string;
  accentColor: string;
  href: string;
};

const INSURANCE_CARDS: InsuranceCard[] = [
  {
    title: "Vehicle Insurance",
    shortLabel: "Vehicle",
    description: "Protect your car, bike, or jeep against accidents, theft and damages.",
    images: [
      { src: heroVehicle, label: "Car" },
      { src: heroVehicleBike, label: "Bike" },
      { src: heroVehicleJeep, label: "Jeep" },
    ],
    background: "#F8FBFF",
    accentColor: "#2563EB",
    href: "/compare?category=auto",
  },
  {
    title: "Home Insurance",
    shortLabel: "Home",
    description: "Cover houses, apartments, cottages, and everything inside them.",
    images: [
      { src: heroHome, label: "House" },
      { src: heroHomeApartment, label: "Apartment" },
      { src: heroHomeCottage, label: "Cottage" },
    ],
    background: "#F6FFF8",
    accentColor: "#10B981",
    href: "/compare?category=home",
  },
  {
    title: "Life Insurance",
    shortLabel: "Life",
    description: "Protect your family with coverage for parents, children, and health needs.",
    images: [
      { src: heroLifeFamily, label: "Family" },
      { src: heroLifeHealth, label: "Health" },
    ],
    background: "#FFF8F5",
    accentColor: "#F59E0B",
    href: "/compare?category=life",
  },
  {
    title: "Pet Insurance",
    shortLabel: "Pet",
    description: "Give dogs, cats, and other pets the best care with financial protection.",
    images: [
      { src: heroPet, label: "Pets" },
      { src: heroPetDog, label: "Dog" },
      { src: heroPetCat, label: "Cat" },
    ],
    background: "#FCF7FF",
    accentColor: "#8B5CF6",
    href: "/compare?category=pet",
  },
];

const STATS = [
  { icon: Users, value: "100+", label: "Policies Compared", iconColor: "#2563EB" },
  { icon: Shield, value: "20+", label: "Insurance Partners", iconColor: "#2563EB" },
  { icon: Star, value: "Trusted", label: "By Hundreds", iconColor: "#F59E0B" },
  { icon: Lock, value: "100%", label: "Secure Process", iconColor: "#2563EB" },
] as const;

const PARTNER_LOGOS = [
  { name: "HBL Insurance", src: logoHbl },
  { name: "Jubilee Insurance", src: logoJubilee },
  { name: "Adamjee Insurance", src: logoAdamjee },
  { name: "TPL Insurance", src: logoTpl },
  { name: "Allianz", src: logoAllianz },
  { name: "EFU Life", src: logoEfu },
  { name: "IGI General", src: logoIgi },
] as const;

const CAROUSEL_INTERVAL_MS = 5000;
const IMAGE_CYCLE_MS = 2200;
const NAVBAR_HEIGHT_PX = 88;

function CategoryImageRotator({
  images,
  accentColor,
}: {
  images: InsuranceSlideImage[];
  accentColor: string;
}) {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % images.length);
    }, IMAGE_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [images]);

  const current = images[imageIndex];

  return (
    <div className="relative mx-auto h-36 w-full max-w-[280px] shrink-0 md:mx-0 md:h-40 md:w-44">
      <AnimatePresence mode="wait">
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.label}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.35 }}
          className="h-full w-full object-contain object-center"
        />
      </AnimatePresence>
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        {current.label}
      </span>
    </div>
  );
}

function HeroInsuranceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (index: number) => {
    setActiveIndex((current) => {
      if (index !== current) {
        setDirection(index > current ? 1 : -1);
      }
      return index;
    });
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % INSURANCE_CARDS.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const card = INSURANCE_CARDS[activeIndex];

  const slideVariants = {
    enter: (slideDirection: number) => ({
      x: slideDirection > 0 ? 48 : -48,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (slideDirection: number) => ({
      x: slideDirection > 0 ? -48 : 48,
      opacity: 0,
    }),
  };

  return (
    <div>
      <div className="relative min-h-[220px] overflow-hidden md:min-h-[250px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={card.title}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={card.href} className="block">
              <motion.div
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(15,23,42,0.1)" }}
                className="flex flex-col gap-5 rounded-2xl p-5 md:flex-row md:items-center md:gap-6 md:p-6"
                style={{ backgroundColor: card.background }}
              >
                <CategoryImageRotator images={card.images} accentColor={card.accentColor} />
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold text-[#0F172A] md:text-xl">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#64748B] md:text-base">
                    {card.description}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: card.accentColor }}
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div
                  className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white md:mx-0"
                  style={{ backgroundColor: card.accentColor }}
                >
                  <ArrowRightCircle className="h-5 w-5" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {INSURANCE_CARDS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => goTo(index)}
              aria-current={isActive ? "true" : undefined}
              className="rounded-full px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm"
              style={{
                backgroundColor: isActive ? item.accentColor : "#F1F5F9",
                color: isActive ? "#FFFFFF" : "#64748B",
              }}
            >
              {item.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {INSURANCE_CARDS.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Show ${INSURANCE_CARDS[index].title}`}
            className="h-2 rounded-full transition-all"
            style={{
              width: index === activeIndex ? 24 : 8,
              backgroundColor: index === activeIndex ? "#2563EB" : "#CBD5E1",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PartnerLogoMarquee() {
  const track = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <motion.div
        className="flex w-max items-center gap-14 px-4 opacity-90"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
      >
        {track.map((partner, index) => (
          <img
            key={`${partner.name}-${index}`}
            src={partner.src}
            alt={partner.name}
            className="h-10 w-auto max-w-[150px] shrink-0 object-contain md:h-11 md:max-w-[170px]"
          />
        ))}
      </motion.div>
    </div>
  );
}

export function LandingHeroSection({ onWatchDemo }: { onWatchDemo: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const navLinks = useMemo(
    () =>
      NAV_LINKS.map((item) => ({
        item,
        href:
          item === "FAQ"
            ? "#faq"
            : item === "How It Works"
              ? "#how-it-works"
              : `#${item.toLowerCase()}`,
      })),
    []
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToHash = (hash: string) => {
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT_PX - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  return (
    <div className="font-[Inter,sans-serif] bg-background text-foreground pt-[88px]">
      {/* Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 h-[88px] border-b backdrop-blur transition-all ${
          scrolled
            ? "border-border bg-background/90 shadow-md"
            : "border-border bg-background/95 shadow-none"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 md:px-10 xl:px-20">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <ShieldCheck className="h-8 w-8 text-[#2563EB]" strokeWidth={2.25} />
            <span className="text-xl font-bold text-[#2563EB]">ClearClever</span>
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {navLinks.map(({ item, href }) => {
              return (
                <a
                  key={item}
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToHash(href);
                  }}
                  className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <DarkModeToggle className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-accent" />
            <Link
              to="/signin"
              className="hidden px-4 py-2 text-[15px] font-medium text-foreground transition-colors hover:text-[#2563EB] sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-[14px] bg-[#2563EB] px-5 py-2.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#2563EB]/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-12 md:pt-14 md:pb-16 lg:pt-16">
        <div
          className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#2563EB]/8 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#8B5CF6]/6 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-[1400px] px-5 md:px-10 xl:px-20">
          <div className="grid items-center gap-12 lg:grid-cols-[48%_52%] lg:gap-10 xl:gap-14">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-[680px]"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-sm font-medium text-[#2563EB]">
                <Sparkles className="h-4 w-4" />
                Smart. Simple. Tailored for You.
              </div>

              <h1 className="mb-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-[4.75rem]">
                Find Insurance
                <br />
                That Fits <span className="text-[#2563EB]">Your Life</span>
              </h1>

              <p className="mb-8 max-w-[680px] text-lg leading-[1.8] text-[#64748B] md:text-2xl">
                Answer a few simple questions and get personalized insurance recommendations for your
                vehicle, home, life, pets, and the things that matter most.
              </p>

              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link to="/compare">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-8 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/20 transition-shadow hover:shadow-xl sm:w-auto md:h-16 md:px-8"
                  >
                    Start Your Assessment
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onWatchDemo}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-7 text-base font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB]/40 hover:bg-[#F8FAFF] sm:w-auto md:h-16"
                >
                  <Play className="h-5 w-5 fill-[#0F172A] text-[#0F172A]" />
                  See How It Works
                </motion.button>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                {FEATURE_HIGHLIGHTS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.08 }}
                      className="flex flex-col gap-2"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: item.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.iconColor }} />
                      </div>
                      <p className="text-sm font-bold leading-snug text-[#0F172A]">{item.title}</p>
                      <p className="text-sm text-[#64748B]">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right column — category card */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.12 }}
              className="relative mx-auto w-full max-w-xl lg:max-w-none"
            >
              <div className="relative overflow-visible rounded-[32px] border border-border bg-card p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)] md:p-10 md:pb-16">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-[#0F172A] md:text-2xl">
                      What would you like coverage for?
                    </h2>
                    <p className="mt-1 text-sm text-[#64748B] md:text-base">
                      Select a category to get started
                    </p>
                  </div>
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="hidden shrink-0 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF]">
                        <BrainCircuit className="h-5 w-5 text-[#2563EB]" />
                      </div>
                      <div className="min-w-[10.5rem]">
                        <p className="text-sm font-bold leading-tight text-[#0F172A]">
                          Smart Recommendations
                        </p>
                        <p className="text-xs leading-snug text-[#64748B]">Based on your answers</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <HeroInsuranceCarousel />

                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-7 left-1/2 z-20 hidden -translate-x-1/2 rounded-2xl border border-border bg-card px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] md:block"
                >
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5]">
                      <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">Quick • Simple • Smart</p>
                      <p className="text-xs text-[#64748B]">Takes less than 3 minutes</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-14 rounded-3xl border border-[#E2E8F0] bg-white p-6 md:mt-20 md:p-9"
          >
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
              {STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex flex-col items-center text-center md:flex-row md:items-center md:gap-4 md:text-left">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFF] md:mb-0">
                      <Icon className="h-6 w-6" style={{ color: stat.iconColor }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-[#0F172A] md:text-3xl">{stat.value}</p>
                      <p className="text-sm text-[#64748B] md:text-base">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Partners */}
          <div className="mt-14 pb-8 md:mt-20">
            <p className="mb-8 text-center text-base text-[#94A3B8] md:text-lg">
              We work with trusted insurance partners
            </p>
            <PartnerLogoMarquee />
          </div>
        </div>
      </section>
    </div>
  );
}
