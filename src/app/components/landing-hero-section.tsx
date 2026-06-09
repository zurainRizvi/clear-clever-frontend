import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowRightCircle,
  BrainCircuit,
  CheckCircle2,
  Lock,
  Menu,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import { DarkModeToggle } from "./dark-mode-toggle";
import {
  buttonPress,
  cardLiftHoverStrong,
  floatBadge,
  gradientShineClass,
  iconWiggleHover,
  layoutSpring,
  mediumTransition,
  navUnderlineClass,
  primaryButtonHover,
  quickTransition,
  staggerDelay,
} from "@/lib/motion-presets";
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
      { src: heroLifeFamily, label: "Coverage" },
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

const IMAGES_PER_CATEGORY = 3;
const IMAGE_HOLD_MS = 2400;
const NAVBAR_HEIGHT_PX = 88;

function imagesForCategory(images: InsuranceSlideImage[]): InsuranceSlideImage[] {
  if (images.length >= IMAGES_PER_CATEGORY) return images.slice(0, IMAGES_PER_CATEGORY);
  const padded = [...images];
  while (padded.length < IMAGES_PER_CATEGORY) {
    padded.push(images[padded.length % images.length]);
  }
  return padded;
}

function HeroInsuranceCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageReady, setImageReady] = useState(false);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [direction, setDirection] = useState(1);

  const card = INSURANCE_CARDS[activeIndex];
  const slideImages = useMemo(() => imagesForCategory(card.images), [card.images]);
  const currentImage = slideImages[imageIndex];

  const goTo = (index: number) => {
    setActiveIndex((current) => {
      if (index !== current) {
        setDirection(index > current ? 1 : -1);
      }
      return index;
    });
    setImageIndex(0);
    setImageReady(false);
    setCategoryProgress(0);
  };

  useEffect(() => {
    setImageIndex(0);
    setImageReady(false);
    setCategoryProgress(0);
  }, [activeIndex]);

  useEffect(() => {
    setImageReady(false);
    const img = new Image();
    img.src = currentImage.src;
    const markReady = () => setImageReady(true);
    if (img.complete) {
      markReady();
    } else {
      img.onload = markReady;
      img.onerror = markReady;
    }
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [currentImage.src, imageIndex, activeIndex]);

  useEffect(() => {
    if (!imageReady) return;

    const isLastImage = imageIndex === IMAGES_PER_CATEGORY - 1;
    const segmentDuration = isLastImage ? 500 : IMAGE_HOLD_MS;
    const segmentStart = performance.now();
    let frame = 0;

    const advanceCategory = () => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % INSURANCE_CARDS.length);
    };

    const tick = (now: number) => {
      const elapsed = now - segmentStart;
      const segmentT = Math.min(1, elapsed / segmentDuration);
      const base = imageIndex / IMAGES_PER_CATEGORY;
      setCategoryProgress(base + segmentT / IMAGES_PER_CATEGORY);

      if (elapsed >= segmentDuration) {
        if (isLastImage) {
          setCategoryProgress(1);
          advanceCategory();
        } else {
          setImageIndex((current) => current + 1);
          setImageReady(false);
        }
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [imageIndex, imageReady, activeIndex]);

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
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link to={card.href} className="block">
              <motion.div
                {...cardLiftHoverStrong}
                className="flex flex-col gap-5 rounded-2xl border border-border p-5 md:flex-row md:items-center md:gap-6 md:p-6"
                style={{ backgroundColor: card.background }}
              >
                <div className="relative mx-auto h-36 w-full max-w-[280px] shrink-0 md:mx-0 md:h-40 md:w-44">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${card.title}-${currentImage.src}-${imageIndex}`}
                      src={currentImage.src}
                      alt={currentImage.label}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={quickTransition}
                      className="h-full w-full object-contain object-center"
                    />
                  </AnimatePresence>
                  <span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
                    style={{ backgroundColor: card.accentColor }}
                  >
                    {currentImage.label}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <h3 className="text-lg font-bold text-foreground md:text-xl">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
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

      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-card to-transparent" />
        <div
          className="flex justify-start gap-2 overflow-x-auto px-1 py-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {INSURANCE_CARDS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => goTo(index)}
                aria-current={isActive ? "true" : undefined}
                className="relative shrink-0 snap-start rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm"
                style={{ color: isActive ? "#FFFFFF" : "#64748B" }}
              >
                {isActive ? (
                  <motion.span
                    layoutId="hero-category-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: item.accentColor }}
                    transition={layoutSpring}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full bg-[#F1F5F9] dark:bg-muted" />
                )}
                <span className="relative z-[1]">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {INSURANCE_CARDS.map((item, index) => {
          const isActive = index === activeIndex;
          const fill =
            index < activeIndex ? 1 : isActive ? Math.min(1, Math.max(0, categoryProgress)) : 0;
          return (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show ${item.title}`}
              className="relative h-2 overflow-hidden rounded-full bg-[#CBD5E1] transition-[width] duration-300 dark:bg-muted"
              style={{ width: isActive ? 28 : 8 }}
            >
              <motion.span
                className="absolute inset-y-0 left-0 w-full rounded-full origin-left"
                style={{
                  backgroundColor: isActive ? item.accentColor : "#2563EB",
                }}
                animate={{ scaleX: fill }}
                initial={false}
                transition={{ duration: 0.04, ease: "linear" }}
              />
            </button>
          );
        })}
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
        transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    setMobileNavOpen(false);
  };

  return (
    <div className="font-[Inter,sans-serif] bg-background text-foreground pt-[72px] sm:pt-[88px]">
      {/* Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 min-h-[72px] sm:h-[88px] border-b backdrop-blur transition-all ${
          scrolled
            ? "border-border bg-background/90 shadow-md"
            : "border-border bg-background/95 shadow-none"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-5 md:px-10 xl:px-20 py-3 sm:py-0">
          <motion.div {...buttonPress} className="shrink-0 min-w-0">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5">
            <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-[#2563EB]" strokeWidth={2.25} />
            <span className="text-lg sm:text-xl font-bold text-[#2563EB] truncate">ClearClever</span>
          </Link>
          </motion.div>

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
                  className="group relative text-[15px] font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {item}
                  <span className={navUnderlineClass} />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <DarkModeToggle className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none transition-colors hover:border-primary/30 hover:bg-accent" />
            <Link
              to="/signin"
              className="hidden px-4 py-2 text-[15px] font-medium text-foreground transition-colors hover:text-[#2563EB] sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-[14px] bg-[#2563EB] px-3.5 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#2563EB]/25 whitespace-nowrap"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNavOpen ? (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={quickTransition}
              className="overflow-hidden border-t border-border bg-background/95 lg:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {navLinks.map(({ item, href }) => (
                  <a
                    key={item}
                    href={href}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToHash(href);
                    }}
                    className="rounded-xl px-4 py-3 text-[15px] font-medium text-muted-foreground hover:bg-accent hover:text-primary"
                  >
                    {item}
                  </a>
                ))}
                <Link
                  to="/signin"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] font-medium text-foreground hover:bg-accent sm:hidden"
                >
                  Sign In
                </Link>
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
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
              transition={mediumTransition}
              className="max-w-[680px]"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-sm font-medium text-[#2563EB]">
                <Sparkles className="h-4 w-4" />
                Smart. Simple. Tailored for You.
              </div>

              <h1 className="mb-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-[4.75rem]">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...quickTransition, delay: 0.03 }}
                  className="block"
                >
                  Find Insurance
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...quickTransition, delay: 0.06 }}
                  className="block"
                >
                  That Fits <span className="text-[#2563EB]">Your Life</span>
                </motion.span>
              </h1>

              <p className="mb-8 max-w-[680px] text-lg leading-[1.8] text-[#64748B] md:text-2xl">
                Answer a few simple questions and get personalized insurance recommendations for your
                vehicle, home, life, pets, and the things that matter most.
              </p>

              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link to="/compare">
                  <motion.button
                    {...primaryButtonHover}
                    className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#2563EB] px-8 text-base font-semibold text-white shadow-lg shadow-[#2563EB]/20 sm:w-auto md:h-16 md:px-8"
                  >
                    <span className={gradientShineClass} />
                    Start Your Assessment
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                <motion.button
                  type="button"
                  {...buttonPress}
                  onClick={onWatchDemo}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#CBD5E1] bg-white px-7 text-base font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB]/40 hover:bg-[#F8FAFF] sm:w-auto md:h-16"
                >
                  <Play className="h-5 w-5 fill-[#0F172A] text-[#0F172A]" />
                  See How It Works
                </motion.button>
              </div>

              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
                {FEATURE_HIGHLIGHTS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...quickTransition, delay: 0.05 + staggerDelay(index, false, 0.03) }}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card/80 p-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: item.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.iconColor }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-snug text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right column — category card */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mediumTransition, delay: 0.04 }}
              className="relative mx-auto w-full max-w-xl lg:max-w-none"
            >
              <div className="relative overflow-visible rounded-[32px] border border-border bg-card p-6 shadow-[0_30px_60px_rgba(15,23,42,0.08)] md:p-10 md:pb-16">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-foreground md:text-2xl">
                      What would you like coverage for?
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground md:text-base">
                      Select a category to get started
                    </p>
                  </div>
                  <motion.div
                    {...floatBadge(4, 1.1)}
                    className="hidden shrink-0 rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <BrainCircuit className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-[10.5rem]">
                        <p className="text-sm font-bold leading-tight text-foreground">
                          Smart Recommendations
                        </p>
                        <p className="text-xs leading-snug text-muted-foreground">Based on your answers</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <HeroInsuranceCarousel />

                <motion.div
                  {...floatBadge(5, 1, 0.15)}
                  className="absolute -bottom-7 left-1/2 z-20 hidden -translate-x-1/2 rounded-2xl border border-border bg-card px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] md:block"
                >
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Quick • Simple • Smart</p>
                      <p className="text-xs text-muted-foreground">Takes less than 3 minutes</p>
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
            transition={mediumTransition}
            className="mt-14 rounded-3xl border border-border bg-card p-6 md:mt-20 md:p-9"
          >
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
              {STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...quickTransition, delay: staggerDelay(index, false, 0.04) }}
                    {...cardLiftHoverStrong}
                    className="flex flex-col items-center text-center md:flex-row md:items-center md:gap-4 md:text-left"
                  >
                    <motion.div
                      {...iconWiggleHover}
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted md:mb-0"
                    >
                      <Icon className="h-6 w-6" style={{ color: stat.iconColor }} />
                    </motion.div>
                    <div>
                      <p className="text-2xl font-extrabold text-foreground md:text-3xl">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground md:text-base">{stat.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Partners */}
          <div className="mt-14 pb-8 md:mt-20">
            <p className="mb-8 text-center text-base text-muted-foreground md:text-lg">
              We work with trusted insurance partners
            </p>
            <PartnerLogoMarquee />
          </div>
        </div>
      </section>
    </div>
  );
}
