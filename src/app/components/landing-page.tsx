import { useState } from "react";
import { Shield, TrendingUp, Zap, Users, CheckCircle2, Star, ChevronRight, Play, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { DarkModeToggle } from "./dark-mode-toggle";
import { motion } from "motion/react";

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const previewCards = [
    {
      title: "Auto coverage comparison",
      subtitle: "Compare premiums from TPL, Jubilee, and Adamjee",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Home protection plans",
      subtitle: "Review coverage for apartments and independent houses",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
    },
    {
      title: "Life & family security",
      subtitle: "Transparent recommendations for long-term peace of mind",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80",
    },
  ];
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Recommendations",
      description: "Get personalized insurance suggestions based on your unique needs and risk profile"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Compare 100+ Policies",
      description: "Side-by-side comparison of policies from Pakistan's top insurers"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Best Price Guarantee",
      description: "Find the most competitive rates without compromising on coverage"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Expert Support 24/7",
      description: "Dedicated insurance advisors ready to help you make informed decisions"
    }
  ];

  const stats = [
    { value: "50,000+", label: "Happy Customers" },
    { value: "100+", label: "Insurance Partners" },
    { value: "₨500M+", label: "Claims Processed" },
    { value: "4.9/5", label: "Customer Rating" }
  ];

  const insurers = [
    "State Life", "Jubilee Life", "EFU Life", "Adamjee Insurance",
    "East West Insurance", "IGI Insurance", "United Insurance", "TPL Insurance"
  ];

  const testimonials = [
    {
      name: "Ahmed Khan",
      role: "Auto policyholder, Lahore",
      content:
        "ClearClever helped me compare auto policies in minutes. The recommendations felt personal and the premiums were easy to understand.",
      rating: 5,
    },
    {
      name: "Sara Malik",
      role: "Family coverage seeker",
      content:
        "The comparison flow is calm and clear. I found life coverage that fits our family budget without days of back-and-forth.",
      rating: 5,
    },
    {
      name: "Usman Ali",
      role: "Home insurance customer",
      content:
        "Side-by-side coverage details made the decision simple. It feels like a real product, not a student demo.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ClearClever
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors scroll-smooth">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors scroll-smooth">How It Works</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors scroll-smooth">Testimonials</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors scroll-smooth">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link to="/signin">
              <button className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </button>
            </Link>
            <Link to="/signup">
              <button className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI-Powered Insurance Platform</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Insurance Match
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Compare 100+ insurance policies in seconds. Get AI-powered recommendations tailored to your needs.
              Save time, save money, and get the coverage you deserve.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/compare">
                <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 flex items-center gap-2 group">
                  Compare Policies
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="px-8 py-4 bg-card border border-border text-foreground rounded-xl hover:bg-accent transition-all duration-300 flex items-center gap-2 group"
              >
                <Play className="w-5 h-5" />
                Watch demo
              </button>
            </div>

            {/* Product preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative mx-auto max-w-5xl"
            >
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border rounded-2xl p-4 md:p-6 shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <span className="w-3 h-3 rounded-full bg-destructive/80" />
                  <span className="w-3 h-3 rounded-full bg-warning/80" />
                  <span className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-3 text-xs text-muted-foreground">ClearClever comparison preview</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {previewCards.map((card) => (
                    <div
                      key={card.title}
                      className="group rounded-xl overflow-hidden border border-border bg-muted/20 hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 text-left">
                        <p className="font-semibold text-sm mb-1">{card.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{card.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose ClearClever?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've revolutionized insurance comparison with cutting-edge AI and a seamless user experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-6 bg-card border border-border rounded-2xl hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get insured in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Answer Questions", desc: "Tell us about your insurance needs through our smart questionnaire" },
              { step: "02", title: "Compare Options", desc: "Review AI-powered recommendations and compare policies side-by-side" },
              { step: "03", title: "Get Covered", desc: "Choose your policy and complete purchase in minutes" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-4 -left-4 text-8xl font-bold text-primary/5">
                  {item.step}
                </div>
                <div className="relative bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Insurers */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Leading Insurers</h2>
            <p className="text-muted-foreground">Compare policies from Pakistan's top insurance providers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {insurers.map((insurer, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 bg-card border border-border rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <span className="text-muted-foreground font-medium">{insurer}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied customers who found their perfect coverage
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Got questions? We've got answers
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does ClearClever compare insurance policies?",
                answer: "ClearClever uses advanced AI algorithms to analyze your specific needs and match them with the best policies from our network of 100+ insurance providers. We consider factors like coverage amount, premium cost, claim settlement ratio, and customer reviews to provide personalized recommendations."
              },
              {
                question: "Is ClearClever free to use?",
                answer: "Yes! ClearClever is completely free for policy seekers. We earn a commission from insurance providers when you purchase a policy through our platform, but this doesn't affect the price you pay. You get the same rates as going directly to the insurer."
              },
              {
                question: "How secure is my personal information?",
                answer: "We take data security very seriously. All your personal and financial information is encrypted using bank-level SSL encryption. We're fully compliant with data protection regulations and never share your information with third parties without your explicit consent."
              },
              {
                question: "Can I purchase insurance directly through ClearClever?",
                answer: "Yes! Once you've compared and selected a policy, you can complete the entire purchase process through our platform. We offer multiple payment methods and provide instant policy documents upon successful purchase."
              },
              {
                question: "What if I need to file a claim?",
                answer: "ClearClever provides a dedicated claims management system where you can submit claims, upload documents, and track the status in real-time. Our support team is available 24/7 to assist you throughout the claims process."
              },
              {
                question: "How do I know which insurance is right for me?",
                answer: "Our AI-powered questionnaire asks targeted questions about your needs, risk profile, and budget. Based on your answers, we recommend the most suitable policies and explain why they're a good fit for your specific situation."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/50 transition-all"
                >
                  <span className="font-semibold pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Find Your Perfect Insurance?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join 50,000+ happy customers and start comparing policies today
          </p>
          <Link to="/signup">
            <button className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-lg hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 flex items-center gap-2 mx-auto group">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">ClearClever</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered insurance comparison platform for Pakistan
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Insurance Types</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 ClearClever. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showDemo ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Product demo"
        >
          <div className="relative w-full max-w-4xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setShowDemo(false)}
              className="absolute top-3 right-3 z-10 px-3 py-1.5 text-sm bg-background/90 border border-border rounded-lg hover:bg-accent"
            >
              Close
            </button>
            <div className="aspect-video bg-black">
              <video
                className="w-full h-full object-cover"
                controls
                autoPlay
                playsInline
                poster={previewCards[0]?.image}
              >
                <source
                  src="https://assets.mixkit.co/videos/preview/mixkit-family-walking-on-the-beach-1246-large.mp4"
                  type="video/mp4"
                />
                Your browser does not support video playback.
              </video>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">See how ClearClever works</h3>
              <p className="text-sm text-muted-foreground">
                Compare policies, answer a short questionnaire, and get transparent recommendations
                from trusted Pakistani insurers.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
