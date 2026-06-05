import { useState } from "react";
import { Shield, TrendingUp, Zap, Users, Star, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { LandingHeroSection } from "./landing-hero-section";

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

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
      <LandingHeroSection onWatchDemo={scrollToHowItWorks} />

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose ClearClever?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've revolutionized insurance comparison with cutting-edge AI and a seamless user experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(37,99,235,0.12)" }}
                className="group p-6 bg-card border border-border rounded-2xl transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 6 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary mb-4"
                >
                  {feature.icon}
                </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Get insured in three simple steps
            </p>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-8">
            <div className="pointer-events-none absolute top-16 left-[16%] right-[16%] hidden h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />
            {[
              { step: "01", title: "Answer Questions", desc: "Tell us about your insurance needs through our smart questionnaire" },
              { step: "02", title: "Compare Options", desc: "Review AI-powered recommendations and compare policies side-by-side" },
              { step: "03", title: "Get Covered", desc: "Choose your policy and complete purchase in minutes" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.28 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -top-4 -left-4 text-8xl font-bold text-primary/5">
                  {item.step}
                </div>
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 16px 32px rgba(15,23,42,0.1)" }}
                  className="relative bg-card border border-border rounded-2xl p-8 transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold mb-4"
                  >
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied customers who found their perfect coverage
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(15,23,42,0.08)" }}
                className="bg-card border border-border rounded-2xl p-6 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + i * 0.08 }}
                    >
                      <Star className="w-5 h-5 fill-warning text-warning" />
                    </motion.span>
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
                transition={{ delay: index * 0.05, duration: 0.28 }}
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
                <AnimatePresence initial={false}>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-6 relative overflow-hidden">
        <motion.div
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10"
          style={{ backgroundSize: "200% 200%" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Find Your Perfect Insurance?
          </h2>
            <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users and compare policies for free
          </p>
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(37,99,235,0.3)" }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-lg transition-all duration-300 flex items-center gap-2 mx-auto group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.div>
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
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><Link to="/contact-us" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About ClearClever</Link></li>
                <li><Link to="/partners" className="hover:text-foreground transition-colors">Partners</Link></li>
                <li><Link to="/help-center" className="hover:text-foreground transition-colors">Help center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of service</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookie policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 ClearClever. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
