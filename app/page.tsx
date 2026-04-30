"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Lock, ShieldCheck, ArrowRight, ChevronDown, Mail, X } from "lucide-react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Analytics } from "@vercel/analytics/next";

// --- STRIPE SETUP ---
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- PINTEREST TRACKING SETUP ---
const TAG_IDS = ["2612612515475"];

const trackPinterest = (event: string, data?: any) => {
  if (typeof window !== "undefined" && (window as any).pintrk) {
    TAG_IDS.forEach((id) => {
      if (data) {
        (window as any).pintrk("track", event, data);
      } else {
        (window as any).pintrk("track", event);
      }
    });
  }
};

// --- DATA: REVIEWS ---
const REVIEWS_TOP = [
  { name: "Miroslava Feria", location: "Mexico", initials: "MF", color: "bg-rose-400", title: "I Needed This Book", text: "I was dating a guy who didn't want a relationship with me, now I understand it wasn't my fault. Now, I am able to see all the signs." },
  { name: "Catalina", location: "Bulgaria", initials: "C", color: "bg-pink-400", title: "I Loved the Book", text: "I loved the book, particularly the case studies and the message examples. Really nice addition to everything else!" },
  { name: "Adora Riestra", location: "Mexico", initials: "A", color: "bg-fuchsia-400", title: "Game Changing Book", text: "It changes your perspective on how you approach men and how you approach yourself. A game changer." },
  { name: "Sarah Jenkins", location: "USA", initials: "SJ", color: "bg-rose-300", title: "Finally Makes Sense", text: "I stopped overanalyzing his late replies. This book gave me the exact framework to stay calm and grounded." },
];

const REVIEWS_BOTTOM = [
  { name: "Noor Afiza", location: "Email to Joao", initials: "NA", color: "bg-pink-300", title: "\"Really helpful\"", text: "Great book. Really helpful for my relationship. It works for some technique like scarcity the most." },
  { name: "Iordan Camelia", location: "Italy", initials: "IC", color: "bg-rose-400", title: "Nice One!", text: "The book is cool! I'm really happy I purchased it. Totally recommend! Thank you 🌻" },
  { name: "Jessica T.", location: "UK", initials: "JT", color: "bg-fuchsia-300", title: "Saved my sanity", text: "Before this, I would panic double-text. Now I know exactly why he pulls back and how to handle it effortlessly." },
  { name: "Elena R.", location: "Spain", initials: "ER", color: "bg-pink-400", title: "Pure Gold", text: "The psychology part is mind-blowing. It's like having a cheat code to understand what they are actually thinking." },
];

// --- DATA: FAQS ---
const FAQS = [
  { question: "Is this book about manipulating men?", answer: "No.\n\nThis isn't about tricks or games.\nIt's about understanding behavior, so you stop reacting emotionally and start responding with clarity.\nNothing here forces someone to like you.\n\nIt simply helps you stop pushing the right people away and stop investing in the wrong ones." },
  { question: "Won't the texts feel weird to send?", answer: "No, and that's the point.\nEverything is designed to feel natural, calm, and grounded.\n\nNot scripted. Not forced.\nYou'll recognize the difference immediately:\n\nless pressure, less overthinking... more control." },
  { question: "What if my situation isn't in the book?", answer: "It doesn't need to be.\nBecause this isn't a collection of random scenarios, it's a pattern.\nOnce you understand the underlying behavior,\n\nyou'll know how to handle situations even if they look different on the surface." },
  { question: "I'm already in a relationship. Is this still for me?", answer: "Yes.\nIn fact, this is where it becomes even more powerful.\nYou'll start seeing dynamics you didn't notice before,\n\nand understand why certain patterns keep repeating." },
  { question: "Why should I take dating advice from a man?", answer: "Because you're trying to understand men.\nThis isn't theory.\n\nIt's perspective from the other side, translated into something you can actually use.\nNot opinions. Patterns." },
  { question: "When do I get access?", answer: "Immediately after purchase.\nNo waiting, no shipping, you'll receive everything instantly." },
  { question: "How long until I see a difference?", answer: "Most women notice it almost immediately.\nNot because something magical happens,\n\nbut because you stop second-guessing yourself.\nAnd that changes everything." },
  { question: "Is my payment secure?", answer: "Yes.\nAll payments are encrypted and processed through secure providers.\n\nYour information is protected at every step." },
  { question: "What if I don't like it?", answer: "You're covered by a 365-day money-back guarantee.\nIf it doesn't change how you understand men,\n\njust ask for a refund.\nNo questions." },
  { question: "I've read other dating books. Why is this one different?", answer: "Most books give advice.\nThis gives you understanding.\nInstead of telling you what to do,\n\nit shows you why things happen, so you don't have to rely on guesswork again." },
  { question: "I have a question about my order.", answer: "You can contact support anytime, and you'll get a response quickly.\nWe make sure you're taken care of." },
];

// --- CHECKOUT FORM COMPONENT ---
const CheckoutForm = ({ onEmailChange, email, name, onNameChange, checkoutState, setCheckoutState }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMessage(null);
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 1. HIGH INTENT PINTEREST EVENT (User clicks pay, card processing begins)
    trackPinterest("custom", { event_name: "initiate_checkout", event_id: eventId });
    setCheckoutState("processing");

    try {
      const intentRes = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const contentType = intentRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unable to connect to the secure payment server. Please contact support.");
      }

      const intentData = await intentRes.json();

      if (!intentRes.ok) throw new Error(intentData.error || "Failed to initialize secure checkout.");
      if (!intentData.clientSecret) throw new Error("Invalid response from payment server.");

      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name, email },
        },
      });

      if (error) throw new Error(error.message);

      if (paymentIntent.status === "succeeded") {
        const completeRes = await fetch("/api/complete-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id, email, name, eventId }),
        });

        const completeData = await completeRes.json();
        
        if (!completeRes.ok) {
          throw new Error(completeData.error || "Payment succeeded, but email delivery failed.");
        }

        // 2. ACTUAL SALE PINTEREST EVENT (Official 'checkout' event sent after Stripe and Email succeed)
        trackPinterest("checkout", { 
          value: 47.77, 
          currency: "USD",
          order_id: paymentIntent.id,
          event_id: eventId 
        });

        setCheckoutState("success");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setCheckoutState("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <input 
          type="text" 
          required
          placeholder="Full Name" 
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl bg-[#FFF5F7] border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-200 transition-all text-lg font-medium text-[#1D1D1F] placeholder-gray-400"
        />
        <input 
          type="email" 
          required
          placeholder="Email Address" 
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl bg-[#FFF5F7] border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-200 transition-all text-lg font-medium text-[#1D1D1F] placeholder-gray-400"
        />
      </div>

      <div className="p-5 rounded-2xl bg-[#FFF5F7] border border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-pink-300 focus-within:border-pink-200 transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 text-sm font-bold text-pink-400 uppercase tracking-widest">
          <span>Secure Payment</span>
          <ShieldCheck className="w-5 h-5 text-green-400" />
        </div>
        <div className="py-2">
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#1D1D1F', '::placeholder': { color: '#9ca3af' }, fontFamily: 'system-ui, sans-serif', fontWeight: "500" },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true
          }}/>
        </div>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 mt-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MICRO TRUST SIGNALS */}
      <div className="flex flex-col gap-2 mt-6 mb-2 p-5 rounded-2xl bg-pink-50/50 border border-pink-100/50">
        <span className="flex items-center gap-3 text-sm font-bold text-gray-500"><Check className="w-4 h-4 text-green-500"/> Used by 50,000+ women</span>
        <span className="flex items-center gap-3 text-sm font-bold text-gray-500"><Lock className="w-4 h-4 text-green-500"/> Secure encrypted payment</span>
        <span className="flex items-center gap-3 text-sm font-bold text-gray-500"><Mail className="w-4 h-4 text-green-500"/> Instant access</span>
      </div>

      <button 
        type="submit" 
        disabled={!stripe || checkoutState === "processing"}
        className="w-full py-5 bg-gradient-to-b from-pink-400 to-rose-500 text-white rounded-2xl font-bold text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_10px_25px_rgba(244,63,94,0.3)] hover:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_15px_35px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 duration-300 backdrop-blur-md"
      >
        {checkoutState === "processing" ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Securely...
          </>
        ) : "Unlock What He Actually Responds To"}
      </button>

      <div className="text-center mt-4 text-sm font-semibold text-rose-500/80">
        Most people read this in one night... <br/>and wish they had it months earlier.
      </div>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EbookSalesPage() {
  const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "success">("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Sticky CTA Logic State
  const [visibleCtaCount, setVisibleCtaCount] = useState(0);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

  // Legal Modal State
  const [activeModal, setActiveModal] = useState<"none" | "privacy" | "terms">("none");

  useEffect(() => {
    if (typeof window !== "undefined") {
      (function(e: any) {
        if (!(window as any).pintrk) {
          (window as any).pintrk = function() {
            (window as any).pintrk.queue.push(Array.prototype.slice.call(arguments));
          };
          var n = (window as any).pintrk;
          n.queue = [];
          n.version = "3.0";
          var t = document.createElement("script");
          t.async = true;
          t.src = e;
          var r = document.getElementsByTagName("script")[0];
          r?.parentNode?.insertBefore(t, r);
        }
      })("https://s.pinimg.com/ct/core.js");

      TAG_IDS.forEach((id) => {
        (window as any).pintrk("load", id);
        (window as any).pintrk("page");
      });
    }

    const ctaElements = document.querySelectorAll(".page-cta-button");
    const observer = new IntersectionObserver(
      (entries) => {
        let intersectingDelta = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingDelta += 1;
          } else {
            intersectingDelta -= 1;
          }
        });
        setVisibleCtaCount((prev) => Math.max(0, prev + intersectingDelta));
      },
      { threshold: 0, rootMargin: "-10px 0px -10px 0px" } 
    );

    ctaElements.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section");
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        setHasScrolledPastHero(rect.bottom < 100); 
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    if (activeModal !== "none") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      document.body.style.overflow = "auto";
    };
  }, [activeModal]);

  const handleCTA = () => {
    // PRE-INTENT PINTEREST EVENT (Fires when they click the CTA button to scroll to payment)
    trackPinterest("addtocart", { 
      value: 47.77, 
      currency: "USD", 
      line_items: [{ product_name: "The Pattern You Never Saw", product_price: 47.77 }]
    });
    document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const showStickyCta = hasScrolledPastHero && visibleCtaCount === 0;

  return (
    <div className="min-h-screen bg-[#FDF8F9] text-[#1D1D1F] font-sans selection:bg-pink-200 selection:text-pink-900 pb-32 overflow-x-hidden antialiased">
      
      {/* --- MAC-OS STYLE HERO SECTION --- */}
      <section id="hero-section" className="relative pt-16 pb-14 md:pt-24 md:pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] opacity-40 pointer-events-none -z-10 hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 via-rose-50 to-transparent blur-[80px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="absolute inset-0 -z-10 lg:hidden bg-gradient-to-b from-[#FDF8F9] via-pink-50/40 to-[#FDF8F9]"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:col-span-7"
          >
            <div className="mb-2">
              <h1 className="text-[2.5rem] md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-balance">
                He Didn't <span className="text-pink-500">“Lose Interest.”</span><br/>
                <span className="text-gray-400 font-bold block mt-1">Something shifted.</span>
                <span className="text-[#1D1D1F]">You just didn't see it yet.</span>
              </h1>
            </div>

            <p className="mb-8 text-[15px] md:text-lg text-gray-500 font-semibold tracking-tight">
              And that's exactly why it keeps happening.
            </p>

            <div className="relative w-full max-w-[320px] mx-auto rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-10px_rgba(244,63,94,0.15)] bg-white border border-white/60 lg:hidden">
               <Image 
                  src="/ebook1.jpg" 
                  alt="Understand Men Ebook" 
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                  priority
               />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none mix-blend-overlay"></div>
            </div>

            <div className="mt-8 mb-8 text-center sm:text-left max-w-sm sm:max-w-md mx-auto sm:mx-0">
              <p className="text-base md:text-lg font-bold text-[#1D1D1F] leading-snug">
                There's a moment where his behavior shifts.
              </p>
              <p className="text-sm md:text-base text-gray-500 mt-2 font-medium leading-relaxed">
                Not randomly. Not emotionally. <br className="hidden sm:block" />
                It follows a pattern most women never notice until it's too late.
              </p>
            </div>

            <ul className="space-y-3 md:space-y-4 text-[15px] md:text-lg font-semibold mb-8">
              <li className="flex items-start gap-3 md:gap-4 text-[#1D1D1F]">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
                </div>
                <span className="leading-snug">Why he was consistent... then suddenly distant</span>
              </li>
              <li className="flex items-start gap-3 md:gap-4 text-[#1D1D1F]">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
                </div>
                <span className="leading-snug">What actually makes him pull away (it's not what you think)</span>
              </li>
              <li className="flex items-start gap-3 md:gap-4 text-[#1D1D1F]">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-pink-500" />
                </div>
                <span className="leading-snug">The small mistake that slowly turns attraction off</span>
              </li>
            </ul>

            <div className="pt-2 relative">
              <div className="absolute inset-0 bg-pink-200 blur-2xl opacity-40 rounded-full hidden sm:block"></div>
              <button 
                onClick={handleCTA}
                className="page-cta-button relative z-10 w-full sm:w-auto px-8 md:px-10 py-5 bg-gradient-to-b from-pink-400 to-rose-500 text-white rounded-full font-bold text-lg md:text-xl shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_15px_40px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3"
              >
                Understand What Actually Happened
              </button>
              <p className="text-xs md:text-sm text-gray-400 mt-3 text-center sm:text-left font-medium">
                Instant access • No guessing anymore
              </p>
              
              <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3 text-[11px] md:text-xs text-gray-400 font-semibold">
                <span>50,000+ women</span>
                <span>•</span>
                <span>4.8★ rating</span>
                <span>•</span>
                <span>365-day guarantee</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex relative lg:col-span-5 w-full justify-center"
          >
            <div className="relative w-full max-w-[500px] rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(244,63,94,0.2)] bg-white border border-white/60">
               <Image 
                  src="/ebook1.jpg" 
                  alt="Understand Men Ebook" 
                  width={800}
                  height={1000}
                  className="w-full h-auto"
                  priority
               />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none mix-blend-overlay"></div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- PAIN / IDENTIFICATION --- */}
      <section className="py-24 px-6 bg-white relative z-10 rounded-[3rem] shadow-sm max-w-[96%] mx-auto my-12 border border-pink-50">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F]">This is how it usually goes...</h2>
          
          <div className="text-2xl md:text-3xl leading-snug text-[#1D1D1F] space-y-6 font-semibold tracking-tight">
            <p className="text-gray-400">He starts off consistent.</p>
            <p>Messages feel easy. Natural.</p>
            <p>Then something shifts.</p>
            <p>He replies slower. Cancels. Feels distant.</p>
            <p className="text-3xl md:text-4xl font-extrabold pt-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">And suddenly... you're the one trying to “figure it out.”</p>
          </div>

          <div className="pt-12 mt-12 border-t border-pink-50">
            <p className="text-2xl md:text-3xl font-bold text-balance leading-snug">
              <span className="relative inline-block z-10">
                Not knowing where you stand
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-pink-200/60 -z-10 rounded-full"></span>
              </span> is what keeps you stuck.<br/>
              <span className="text-pink-500 mt-3 inline-block">Not him.</span>
            </p>
          </div>
        </div>
      </section>

      {/* --- REVIEWS SECTION --- */}
      <section className="py-28 bg-[#FFF0F3]/40 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center px-6 mb-16">
          <span className="px-5 py-2 bg-white text-pink-500 text-sm font-extrabold tracking-widest uppercase rounded-full mb-6 inline-block shadow-sm border border-pink-100">Real Results</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-4">50,000+ Women Can't Be Wrong</h2>
          <p className="text-xl text-gray-500 font-medium tracking-tight">Here's what readers are saying</p>
        </div>

        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F9] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F9] to-transparent z-10 pointer-events-none"></div>

        <div className="flex flex-col gap-6">
          <div className="flex whitespace-nowrap">
            <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 40 }} className="flex gap-6 px-4">
              {[...REVIEWS_TOP, ...REVIEWS_TOP].map((review, i) => (
                <div key={`top-${i}`} className="w-[400px] shrink-0 bg-white rounded-[2rem] p-8 shadow-[0_8px_20px_rgba(244,63,94,0.05)] border border-pink-50 flex flex-col gap-4 whitespace-normal transition-transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center gap-4 mb-1">
                    <div className={`w-12 h-12 rounded-full ${review.color} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-inner`}>
                      {review.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1D1D1F] text-lg">{review.name}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{review.location}</div>
                    </div>
                  </div>
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                  </div>
                  <h4 className="font-bold text-xl text-[#1D1D1F]">{review.title}</h4>
                  <p className="text-gray-600 text-base font-medium leading-relaxed">{review.text}</p>
                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center gap-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
                    <Check className="w-4 h-4 text-green-400" /> Verified Purchase
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex whitespace-nowrap">
            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 45 }} className="flex gap-6 px-4">
              {[...REVIEWS_BOTTOM, ...REVIEWS_BOTTOM].map((review, i) => (
                <div key={`bottom-${i}`} className="w-[400px] shrink-0 bg-white rounded-[2rem] p-8 shadow-[0_8px_20px_rgba(244,63,94,0.05)] border border-pink-50 flex flex-col gap-4 whitespace-normal transition-transform hover:-translate-y-1 duration-300">
                  <div className="flex items-center gap-4 mb-1">
                    <div className={`w-12 h-12 rounded-full ${review.color} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-inner`}>
                      {review.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1D1D1F] text-lg">{review.name}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{review.location}</div>
                    </div>
                  </div>
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                  </div>
                  <h4 className="font-bold text-xl text-[#1D1D1F]">{review.title}</h4>
                  <p className="text-gray-600 text-base font-medium leading-relaxed">{review.text}</p>
                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center gap-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
                    <Check className="w-4 h-4 text-green-400" /> Verified Purchase
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- REFRAME SECTION --- */}
      <section className="py-24 px-6 bg-[#FDF8F9]">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#1D1D1F]">
            Men aren't confusing.<br/>
            <span className="text-pink-400 mt-3 block">They're just predictable in ways no one explained to you.</span>
          </h2>
          <p className="text-xl md:text-2xl font-semibold leading-relaxed max-w-2xl mx-auto text-gray-600">
            Once you see the pattern, everything changes: <br/><br/>
            how you respond, what you tolerate, and who you give your attention to.
          </p>
        </div>
      </section>

      {/* --- WHAT'S INSIDE --- */}
      <section className="py-24 px-6 bg-[#FDF8F9]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <p className="text-pink-500 font-extrabold tracking-widest uppercase text-sm">
              You don't need more effort. You need clarity.
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
              What You'll Finally Understand
            </h2>
            <p className="text-xl text-gray-500 font-medium">
              Not advice. Not guesses. <br className="hidden md:block"/>Patterns you'll start seeing immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { num: "01", title: "Why He Changed And What You Didn't See", desc: "The exact moment attraction shifts... and why most women only realize it when it's already too late." },
              { num: "02", title: "What To Say When He Pulls Away", desc: "The difference between pushing him further away... and making him come back without chasing." },
              { num: "03", title: "How To Know If He's Serious (Early)", desc: "The small signals that reveal everything within days, before you invest months." },
              { num: "04", title: "How To Stay In Control (Without Overthinking)", desc: "A simple way to respond calmly in any situation... without losing your position." }
            ].map((card, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                key={i}
                className="group relative bg-white/60 backdrop-blur-3xl border border-white p-10 rounded-[2.5rem] shadow-[0_10px_30px_rgba(244,63,94,0.05)] hover:-translate-y-[6px] hover:shadow-[0_20px_50px_rgba(244,63,94,0.15)] hover:border-pink-300/50 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-sm font-extrabold text-pink-300 tracking-widest mb-4">{card.num}</div>
                  <h3 className="text-2xl font-extrabold mb-4 text-[#1D1D1F] leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1D1D1F] group-hover:to-pink-600 transition-all">{card.title}</h3>
                  <p className="text-gray-500 text-lg font-medium leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- THE FINAL PUSH (REPLACES "WHAT YOU ACTUALLY UNLOCK") --- */}
      <section className="py-24 px-6 bg-white relative z-10 border-t border-pink-50">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
            This is where everything changes.
          </h2>
          <p className="text-2xl md:text-3xl font-semibold text-gray-500 leading-snug">
            Not because you try harder.<br/>
            <span className="text-pink-500">But because you finally see what's been happening the entire time.</span>
          </p>

          <div className="py-8 space-y-6 text-xl md:text-2xl font-medium text-[#1D1D1F] tracking-tight">
            <p>You've felt it before.</p>
            <p>The shift.<br/>The distance.<br/>The silence that didn't make sense.</p>
            
            <div className="bg-[#FDF8F9] p-8 md:p-10 rounded-[2.5rem] border border-pink-100 my-10 shadow-[0_10px_30px_rgba(244,63,94,0.05)] max-w-xl mx-auto">
              <p className="text-gray-400 text-sm font-extrabold uppercase tracking-widest mb-4">You thought:</p>
              <p className="font-extrabold text-rose-500 mb-2">"Maybe I said too much."</p>
              <p className="font-extrabold text-rose-500">"Maybe I pushed him away."</p>
            </div>

            <p className="font-extrabold text-4xl text-[#1D1D1F]">You didn't.</p>
            <p className="text-gray-500">You just didn't see the pattern.</p>

            <div className="space-y-4 pt-10 text-left max-w-md mx-auto">
              <p className="flex items-center gap-4 text-lg md:text-xl font-bold"><Check className="text-green-500 w-6 h-6 shrink-0"/> And once you see it... you stop reacting.</p>
              <p className="flex items-center gap-4 text-lg md:text-xl font-bold"><Check className="text-green-500 w-6 h-6 shrink-0"/> You stop chasing.</p>
              <p className="flex items-center gap-4 text-lg md:text-xl font-bold"><Check className="text-green-500 w-6 h-6 shrink-0"/> You stop overthinking every message.</p>
            </div>

            <div className="pt-12">
               <p className="text-3xl md:text-4xl font-extrabold text-[#1D1D1F]">You start knowing.</p>
               <p className="text-xl text-gray-500 mt-4 font-semibold">Knowing what he's doing. Knowing what it means.<br/>Knowing exactly how to respond.</p>
               <p className="text-xl font-bold text-pink-500 mt-6">That's the difference.</p>
            </div>
          </div>

          <div className="pt-16 border-t border-gray-100">
            <p className="text-2xl md:text-3xl font-extrabold text-[#1D1D1F]">
              Most women stay stuck in confusion for months.
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-pink-500 mt-2 mb-12">
              You won't. You'll see it in one night.
            </p>

            <button 
              onClick={handleCTA}
              className="page-cta-button px-10 py-5 bg-gradient-to-b from-pink-400 to-rose-500 text-white rounded-full font-bold text-xl shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_15px_40px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Access The System He Can't Ignore
            </button>
          </div>
        </div>
      </section>

      {/* --- OFFER & CHECKOUT SECTION --- */}
      <section id="checkout-section" className="py-28 px-6 bg-[#FDF8F9]">
        <div className="max-w-xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-5 mb-4">
              <span className="text-3xl text-gray-400 line-through font-bold">$67</span>
              <span className="text-6xl font-extrabold tracking-tighter text-pink-500">$47.77</span>
            </div>
            
            <div className="text-lg text-[#1D1D1F] font-semibold bg-pink-100/50 py-4 px-8 rounded-3xl inline-block text-left border border-pink-100">
              <span className="block text-center text-pink-500 font-bold mb-2">This isn't $47.77 for a book.</span>
              It's the difference between:<br/>
              <span className="text-gray-500 line-through decoration-gray-300">Overthinking every message</span><br/>
              Or knowing exactly what to say.
            </div>
          </div>

          <div className="bg-white border border-pink-100 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(244,63,94,0.08)] relative z-10">
            <AnimatePresence mode="wait">
              {checkoutState === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-20 h-20 bg-green-50 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">Payment Successful</h3>
                  <p className="text-gray-500 text-lg font-medium">Your access has been instantly emailed to <br/><span className="font-bold text-[#1D1D1F] mt-1 block">{email}</span></p>
                </motion.div>
              ) : (
                <motion.div exit={{ opacity: 0 }}>
                  <Elements stripe={stripePromise}>
                    <div className="page-cta-button">
                      <CheckoutForm 
                        email={email} 
                        onEmailChange={setEmail} 
                        name={name} 
                        onNameChange={setName}
                        checkoutState={checkoutState}
                        setCheckoutState={setCheckoutState} 
                      />
                    </div>
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-28 px-6 bg-white border-t border-pink-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1D1D1F] mb-4">Questions?</h2>
            <p className="text-xl text-gray-500 font-semibold">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#FDF8F9] rounded-2xl border border-pink-50 overflow-hidden transition-all hover:border-pink-100 hover:shadow-sm">
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-lg text-[#1D1D1F] pr-6">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm shrink-0 transition-transform duration-300 ${openFaqIndex === i ? "rotate-180 bg-pink-50" : ""}`}>
                    <ChevronDown className={`w-4 h-4 ${openFaqIndex === i ? "text-pink-500" : "text-[#1D1D1F]"}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-8 pb-6 text-gray-600 text-base font-medium leading-relaxed whitespace-pre-line"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
               </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL MICRO-PUSH --- */}
      <section className="pt-16 pb-28 px-6 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F] mb-4">
            If you've made it this far, you're not just curious.
          </h3>
          <p className="text-xl text-pink-500 font-bold mb-10">
            You're tired of not knowing.
          </p>
          <button 
            onClick={handleCTA}
            className="page-cta-button px-10 py-5 bg-gradient-to-b from-pink-400 to-rose-500 text-white rounded-full font-bold text-lg shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_10px_25px_rgba(244,63,94,0.3)] hover:shadow-[inset_0px_1px_1px_rgba(255,255,255,0.4),0_15px_35px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Instant Access Now
          </button>
          <div className="mt-6 text-sm font-semibold text-rose-500/80">
            Most people read this in one night... <br/>and wish they had it months earlier.
          </div>
        </div>
      </section>

      {/* --- GUARANTEE --- */}
      <section className="py-20 px-6 bg-[#FFF0F3]/50 text-center border-y border-pink-100">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-pink-50">
            <ShieldCheck className="w-8 h-8 text-pink-500" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">Try it for 365 days.</p>
          <p className="text-xl text-gray-600 font-medium leading-relaxed">
            If it doesn't change how you understand men <br/>
            you get a full refund.<br/>
            <span className="font-bold text-[#1D1D1F]">No questions.</span>
          </p>
        </div>
      </section>

      {/* --- AUTHOR --- */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-6 text-xl md:text-2xl leading-relaxed font-semibold tracking-tight">
          <p className="text-gray-400">I used to be the type of man women couldn't read.</p>
          <p>Interested... then distant.</p>
          <p className="text-[#1D1D1F]">Until I met someone who didn't react the way I expected.</p>
          <p>That's when I started paying attention.</p>
          <p className="font-bold pt-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">This book is what I learned.</p>
        </div>
      </section>

      {/* --- FOOTER & LEGAL MODALS --- */}
      <footer className="pt-8 pb-10 border-t border-[#1F0E13] bg-[#0A0406] text-center text-[11px] font-bold tracking-widest uppercase text-white/80">
        <div className="flex justify-center items-center gap-6 mb-4">
          <button 
            onClick={() => setActiveModal("privacy")} 
            className="hover:text-pink-400 hover:drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] active:text-pink-400 active:drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] active:scale-95 transition-all duration-300 uppercase tracking-widest"
          >
            Privacy Policy
          </button>
          <span className="opacity-40">·</span>
          <button 
            onClick={() => setActiveModal("terms")} 
            className="hover:text-pink-400 hover:drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] active:text-pink-400 active:drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] active:scale-95 transition-all duration-300 uppercase tracking-widest"
          >
            Terms of Service
          </button>
        </div>
        <p className="opacity-60 text-[10px]">© 2026 Attract Best Man. All rights reserved.</p>
      </footer>

      {/* LEGAL MODALS (APPLE GLASSMORPHISM) */}
      <AnimatePresence>
        {activeModal !== "none" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setActiveModal("none")}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white/90 backdrop-blur-3xl border border-white/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveModal("none")}
                className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-500 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {activeModal === "privacy" && (
                <div className="space-y-6 text-gray-600 font-medium leading-relaxed">
                  <h3 className="text-3xl font-extrabold text-[#1D1D1F] mb-8">Privacy Policy</h3>
                  <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Last updated: April 30, 2026</p>
                  <p>At AttractBestMan.com, your privacy matters.</p>
                  <p>We collect only the information necessary to provide you with a smooth and secure experience.</p>
                  
                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Information We Collect:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Name and email address (for order delivery)</li>
                    <li>Payment information (processed securely via Stripe, we do not store card details)</li>
                    <li>Basic usage data to improve our website</li>
                  </ul>

                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">How We Use Your Information:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>To deliver your purchase instantly</li>
                    <li>To communicate important updates</li>
                    <li>To improve your experience</li>
                  </ul>
                  
                  <p>We do not sell, rent, or share your personal information with third parties.</p>
                  <p>Payments are processed securely through trusted providers, and all data is encrypted.</p>
                  <p>You can request deletion of your data at any time by contacting support.</p>
                  <p>By using this site, you agree to this policy.</p>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <p className="font-bold text-[#1D1D1F]">Contact:</p>
                    <p className="text-pink-500">support@attractbestman.com</p>
                  </div>
                </div>
              )}

              {activeModal === "terms" && (
                <div className="space-y-6 text-gray-600 font-medium leading-relaxed">
                  <h3 className="text-3xl font-extrabold text-[#1D1D1F] mb-8">Terms of Service</h3>
                  <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Last updated: April 30, 2026</p>
                  <p>By accessing AttractBestMan.com, you agree to the following terms:</p>
                  
                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Product</h4>
                  <p>This is a digital product. Access is delivered instantly after purchase.</p>

                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Payments</h4>
                  <p>All payments are securely processed through Stripe and other providers.</p>

                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Refund Policy</h4>
                  <p>We offer a 365-day money-back guarantee.</p>
                  <p>If you are not satisfied, you may request a refund.</p>

                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Usage</h4>
                  <p>This product is for personal use only. Redistribution or resale is not allowed.</p>

                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Disclaimer</h4>
                  <p>This product provides educational content. Results may vary depending on individual circumstances.</p>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <p className="font-bold text-[#1D1D1F]">Contact:</p>
                    <p className="text-pink-500">support@attractbestman.com</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- STICKY BOTTOM CTA (SMART LOGIC & GLOWY GLASS) --- */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none"
          >
            <button 
              onClick={handleCTA}
              className="pointer-events-auto w-full sm:w-auto px-10 py-5 bg-white/70 backdrop-blur-3xl border border-white/60 text-[#1D1D1F] rounded-full font-bold text-lg shadow-[0_15px_40px_rgba(244,63,94,0.15)] hover:bg-white/95 hover:shadow-[0_0_30px_rgba(244,63,94,0.4),0_10px_40px_rgba(244,63,94,0.2)] hover:border-pink-300 hover:text-pink-600 hover:scale-[1.02] transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-100/0 via-pink-100/50 to-pink-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              <span className="relative z-10 flex items-center gap-2">Unlock It Now <span className="text-pink-500 ml-1">- $47.77</span></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Analytics />
    </div>
  );
}