"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Star, Lock, ShieldCheck, ChevronDown, Mail, X, MessageCircle, Clock, MoreHorizontal, FileText, Eye, Scale, Search } from "lucide-react";
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
const REVIEWS = [
  { name: "Miroslava Feria", location: "Mexico 🇲🇽", initials: "MF", color: "bg-gray-900", title: "I Needed This Book", text: "I was dating a guy who didn't want a relationship with me, now I understand it wasn't my fault. Now, I am able to see all the signs." },
  { name: "Catalina", location: "Bulgaria 🇧🇬", initials: "C", color: "bg-pink-600", title: "I Loved the Book", text: "I loved the book, particularly the case studies and the message examples. Really nice addition to everything else!" },
  { name: "Adora Riestra", location: "Mexico 🇲🇽", initials: "A", color: "bg-rose-500", title: "Game Changing Book", text: "It changes your perspective on how you approach men and how you approach yourself. A game changer." },
  { name: "Sarah Jenkins", location: "USA 🇺🇸", initials: "SJ", color: "bg-gray-800", title: "Finally Makes Sense", text: "I stopped overanalyzing his late replies. This book gave me the exact framework to stay calm and grounded." },
  { name: "Noor Afiza", location: "UK 🇬🇧", initials: "NA", color: "bg-pink-500", title: "\"Really helpful\"", text: "Great book. Really helpful for my relationship. It works for some technique like scarcity the most." },
  { name: "Iordan Camelia", location: "Italy 🇮🇹", initials: "IC", color: "bg-rose-600", title: "Nice One!", text: "The book is cool! I'm really happy I purchased it. Totally recommend! Thank you" },
  { name: "Jessica T.", location: "UK 🇬🇧", initials: "JT", color: "bg-gray-900", title: "Saved my sanity", text: "Before this, I would panic double-text. Now I know exactly why he pulls back and how to handle it effortlessly." },
  { name: "Elena R.", location: "Spain 🇪🇸", initials: "ER", color: "bg-pink-600", title: "Pure Gold", text: "The psychology part is mind-blowing. It's like having a cheat code to understand what they are actually thinking." },
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

// --- CHECKOUT FORM COMPONENT (SAFARI & POINTER-EVENTS FIX APPLIED) ---
const CheckoutForm = ({ onEmailChange, email, name, onNameChange, checkoutState, setCheckoutState }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setErrorMessage(null);
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
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
    // Isolate forces a new stacking context so invisible layers cannot bleed over the form
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 relative z-[9999] w-full pointer-events-auto isolate">
      <div className="space-y-4">
        <input 
          type="text" 
          required
          placeholder="Full Name" 
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-5 py-4 min-h-[56px] rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-lg font-medium text-[#1D1D1F] placeholder-gray-400"
        />
        <input 
          type="email" 
          required
          placeholder="Email Address" 
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-5 py-4 min-h-[56px] rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-lg font-medium text-[#1D1D1F] placeholder-gray-400"
        />
      </div>

      {/* --- START OF CARD SECTION (BULLETPROOF FIX) --- */}
      <div className="p-4 md:p-5 min-h-[56px] rounded-xl md:rounded-2xl bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-pink-500 focus-within:border-transparent transition-all relative z-[10000] pointer-events-auto isolate w-full shadow-sm">
        <div className="flex items-center justify-between mb-3 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest relative z-[10001]">
          <span>Card Details</span>
          <ShieldCheck className="w-4 h-4 text-green-500" />
        </div>
        <div className="py-2 relative z-[10001] pointer-events-auto">
          <CardElement options={{
            style: {
              base: { 
                fontSize: '16px', 
                color: '#1D1D1F', 
                '::placeholder': { color: '#9ca3af' }, 
                fontFamily: 'system-ui, sans-serif', 
                fontWeight: "500" 
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true
          }}/>
        </div>
      </div>
      {/* --- END OF CARD SECTION --- */}

      <AnimatePresence>
        {errorMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="text-red-600 text-sm font-bold text-center bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-center gap-2 mt-2">
               <X className="h-5 w-5 shrink-0" />
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        type="submit" 
        disabled={!stripe || checkoutState === "processing"}
        className="w-full py-4 min-h-[56px] mt-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl md:rounded-2xl font-extrabold text-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(244,63,94,0.2)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.3)] active:scale-[0.98] duration-300 relative z-[10000]"
      >
        {checkoutState === "processing" ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : "Get Instant Access — $47.77"}
      </button>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function EbookSalesPage() {
  const [checkoutState, setCheckoutState] = useState<"idle" | "processing" | "success">("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Visibility States
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  
  const [activeModal, setActiveModal] = useState<"none" | "privacy" | "terms">("none");

  // 3D iPad Pro Effect variables
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { damping: 30, stiffness: 200 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

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

    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section");
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        setHasScrolledPastHero(rect.bottom < 100); 
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Intersection Observer for Checkout Section (Hides Sticky CTA when in view)
    const checkoutElement = document.getElementById("checkout-section");
    const checkoutObserver = new IntersectionObserver(
      ([entry]) => {
        setIsCheckoutVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (checkoutElement) checkoutObserver.observe(checkoutElement);

    if (activeModal !== "none") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (checkoutElement) checkoutObserver.unobserve(checkoutElement);
      document.body.style.overflow = "auto";
    };
  }, [activeModal]);

  const handleCTA = () => {
    trackPinterest("addtocart", { 
      value: 47.77, 
      currency: "USD", 
      line_items: [{ product_name: "The Pattern You Never Saw", product_price: 47.77 }]
    });
    document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Sticky CTA Logic
  const showStickyCta = hasScrolledPastHero && !isCheckoutVisible;

  return (
    <div className="min-h-screen bg-[#FDF8F9] text-[#1D1D1F] font-sans selection:bg-pink-200 selection:text-pink-900 pb-20 overflow-x-hidden antialiased">
      
      {/* --- 1. HERO SECTION (APPLE TIER DESKTOP & MOBILE SPLIT) --- */}
      <section id="hero-section" className="relative pt-24 pb-16 md:pt-32 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col justify-center">
        
        {/* Apple-style background depth */}
        <div className="absolute inset-0 z-0 flex items-center justify-end pointer-events-none">
          <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-[radial-gradient(circle_at_right,_var(--tw-gradient-stops))] from-pink-300/30 via-rose-100/10 to-transparent blur-[80px] rounded-full translate-x-1/4"></div>
        </div>
        
        {/* DESKTOP LAYOUT (Strict, Controlled, Powerful) */}
        <div className="hidden lg:grid max-w-[1100px] mx-auto grid-cols-2 gap-12 items-center relative z-20">
          
          {/* Left Column: Text & Persuasion */}
          <div className="flex flex-col items-start text-left max-w-[480px]">
            <h1 className="font-extrabold leading-[1.05] tracking-tighter">
              <span className="block text-4xl text-[#1D1D1F] mb-1">He Didn't</span>
              <span className="block text-6xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 pb-2">“Lose Interest.”</span>
              <span className="block text-3xl text-gray-400 tracking-tight mt-1">Something shifted.</span>
            </h1>
            
            <div className="mt-8 space-y-1">
              <p className="text-2xl text-gray-700 font-semibold tracking-tight">You felt it.</p>
              <p className="text-xl text-gray-500 font-medium">This shows you what actually happened.</p>
            </div>

            <button 
              onClick={handleCTA}
              className="mt-10 page-cta-button relative group px-10 py-5 bg-gradient-to-b from-pink-500 to-rose-600 text-white rounded-[1.5rem] font-extrabold text-xl shadow-[0_10px_20px_rgba(244,63,94,0.25)] hover:shadow-[0_15px_30px_rgba(244,63,94,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              See What You Missed
            </button>

            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-500 opacity-90">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              “I wish I knew this 3 months ago.”
            </div>
          </div>

          {/* Right Column: 3D iPad Pro Display */}
          <div className="flex justify-end relative perspective-[1200px]">
            <motion.div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative w-full max-w-[400px] aspect-[3/4] rounded-[2rem] border-[12px] border-[#1c1c1e] bg-[#000000] shadow-[0_30px_60px_-15px_rgba(244,63,94,0.4)] cursor-pointer group transform-gpu rotate-y-[-4deg] rotate-x-[2deg]"
            >
              {/* Fake iPad Power Button */}
              <div className="absolute top-8 -right-[16px] w-[4px] h-12 bg-gray-800 rounded-r-md"></div>
              {/* Fake iPad Volume Buttons */}
              <div className="absolute top-24 -right-[16px] w-[4px] h-16 bg-gray-800 rounded-r-md"></div>
              
              <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden">
                <Image src="/ebook1.jpg" alt="Book Cover" fill priority className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              </div>
            </motion.div>
          </div>

        </div>

        {/* MOBILE LAYOUT (Fast, Emotional, Direct) */}
        <div className="flex lg:hidden flex-col items-center text-center relative z-20 w-full">
          
          <h1 className="font-extrabold leading-[1.05] tracking-tighter w-full">
            <span className="block text-3xl text-[#1D1D1F] mb-1">He Didn't</span>
            <span className="block text-[3.25rem] text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 pb-1">“Lose Interest.”</span>
            <span className="block text-[1.75rem] text-gray-400 tracking-tight mt-1">Something shifted.</span>
          </h1>

          <div className="w-full max-w-[320px] aspect-[3/4] relative rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(244,63,94,0.3)] my-10 border-[6px] border-[#1c1c1e]">
            <Image src="/ebook1.jpg" alt="Book Cover" fill priority className="object-cover" />
          </div>

          <div className="space-y-1 mb-8">
            <p className="text-2xl text-[#1D1D1F] font-bold tracking-tight">You felt it.</p>
            <p className="text-lg text-gray-500 font-medium">This shows you what actually happened.</p>
          </div>

          <button 
            onClick={handleCTA}
            className="w-[90%] mx-auto page-cta-button py-4 bg-gradient-to-b from-pink-500 to-rose-600 text-white rounded-2xl font-extrabold text-[22px] shadow-[0_15px_30px_rgba(244,63,94,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center"
          >
            See What You Missed
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 opacity-90">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            “I wish I knew this 3 months ago.”
          </div>

        </div>
      </section>

      {/* --- 2. INTERACTIVE "THE SHIFT" SECTION --- */}
      <section className="py-24 px-6 relative z-10 bg-white border-y border-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
              The Invisible Shift.
            </h2>
            <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto text-balance">
              It doesn't happen randomly. It follows a specific psychological timeline.
            </p>
          </div>

          <div className="flex lg:grid lg:grid-cols-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6 pb-8 px-4 lg:px-0">
            {[
              { icon: MessageCircle, title: "He was consistent", desc: "Fast replies, constant attention.", ui: "Hey! Can't wait to see you tonight 😊" },
              { icon: Clock, title: "Then it changed", desc: "Shorter texts. Unexplained delays.", ui: "Yeah maybe later, super busy rn." },
              { icon: MoreHorizontal, title: "You felt it", desc: "You knew something was off immediately.", ui: "Typing..." },
              { icon: FileText, title: "The Overthinking", desc: "Drafting texts trying to 'fix' it.", ui: "[Draft]: Did I do something wrong?" }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="snap-center shrink-0 w-[85vw] sm:w-[320px] lg:w-auto bg-[#FDF8F9] p-8 rounded-[2.5rem] border border-pink-100/50 shadow-sm flex flex-col gap-6"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-pink-50">
                  <card.icon className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1D1D1F] mb-2">{card.title}</h3>
                  <p className="text-gray-500 font-medium">{card.desc}</p>
                </div>
                <div className="mt-auto pt-6 border-t border-gray-100">
                  <div className={`text-sm font-medium p-4 rounded-2xl shadow-sm ${i === 0 ? "bg-[#0A84FF] text-white" : i === 1 ? "bg-gray-200 text-gray-700" : i === 2 ? "bg-gray-100 text-gray-400 animate-pulse" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                    {card.ui}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 3. "THIS IS NOT A BOOK" (DARK SECTION) --- */}
      <section className="py-32 px-6 bg-[#0A0406] relative overflow-hidden flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-4xl max-h-4xl bg-pink-600/15 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-12">
          <p className="text-rose-400 font-bold tracking-widest uppercase text-sm">
            This is not a dating book.
          </p>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white leading-tight">
            This is the moment everything clicks.
          </h2>
          <div className="text-2xl md:text-4xl text-white/60 font-medium leading-relaxed space-y-4">
            <p>The moment you stop chasing.</p>
            <p>Stop wondering where you stand.</p>
            <p className="text-white relative inline-block group cursor-default">
              And <span className="relative z-10">stop guessing.</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-pink-500/80 -z-10 group-hover:h-full transition-all duration-300"></span>
            </p>
          </div>
          <p className="text-xl text-white/50 pt-8 font-medium">
            And start seeing exactly what's happening.
          </p>
        </div>
      </section>

      {/* --- 4. VALUE STACK --- */}
      <section className="py-32 px-6 relative bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Eye, title: "The Shift Decoder", desc: "See the exact moment attraction changes before he even realizes it." },
              { icon: MessageCircle, title: "The Response System", desc: "Know exactly what to say without pushing him away or looking desperate." },
              { icon: Search, title: "The Early Signals", desc: "Read his true intentions within days, before you invest months of your life." },
              { icon: Scale, title: "The Control Frame", desc: "Stay calm, grounded, and impossible to ignore in any situation." }
            ].map((card, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                key={i}
                className="group relative bg-[#FDF8F9] border border-pink-50 p-10 rounded-[3rem] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#1D1D1F] flex items-center justify-center shadow-md">
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">{card.title}</h3>
                  <p className="text-gray-500 text-lg font-medium leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. "SCENE FROM HER LIFE" (THE ANXIETY TRIGGER) --- */}
      <section className="py-32 px-6 bg-[#FDF8F9] border-y border-pink-50 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-rose-200/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.4 } }
            }}
            className="space-y-8 max-w-md mx-auto lg:mx-0 relative z-10"
          >
            <motion.h2 variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#1D1D1F]">
              It’s 2:14 AM.
            </motion.h2>
            
            <div className="space-y-6 text-2xl md:text-3xl text-gray-400 font-medium tracking-tight">
              <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>You check your phone again.</motion.p>
              <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>He was online.</motion.p>
              <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}>He saw your message.</motion.p>
              
              <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="text-[#1D1D1F] font-extrabold text-3xl md:text-4xl pt-2">
                No reply.
              </motion.p>
              
              <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="text-rose-500 font-bold text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                Now your mind starts racing...
              </motion.p>
            </div>
            
            <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 2.5, duration: 1 } } }} className="text-base text-gray-400 font-bold pt-8 uppercase tracking-widest">
              This cycle stops the moment you unlock the blueprint.
            </motion.p>
          </motion.div>

          <div className="relative w-full max-w-[380px] mx-auto flex justify-center lg:justify-end perspective-[1000px] mt-10 lg:mt-0">
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full h-[500px] rounded-t-[3rem] border-x-[12px] border-t-[12px] border-b-0 border-[#1c1c1e] bg-[#000000] shadow-[0_30px_60px_-15px_rgba(244,63,94,0.2)] overflow-hidden flex flex-col transform rotate-y-[-5deg] rotate-x-[2deg]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-[#1c1c1e] rounded-b-3xl z-20"></div>
              
              <div className="w-full bg-[#1c1c1e]/90 backdrop-blur-md pt-10 pb-3 px-4 flex items-center gap-3 border-b border-white/10 z-10">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-tr from-gray-600 to-gray-400 opacity-50"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-base tracking-wide">Daniel</span>
                  <motion.span 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-gray-400 text-[11px] font-medium"
                  >
                    Active 2m ago
                  </motion.span>
                </div>
              </div>

              <div className="flex-1 p-4 flex flex-col pt-8 relative">
                <div className="text-center text-gray-500 text-xs font-medium mb-6">1:58 AM</div>
                
                <div className="self-end bg-[#0A84FF] text-white p-3 px-4 rounded-[1.2rem] rounded-br-sm max-w-[85%] shadow-sm text-[15px] leading-snug">
                  Hey, are we still on for tomorrow?
                </div>
                
                <div className="self-end mt-1 flex items-center gap-1 text-blue-400/80 mr-1 text-[11px] font-bold tracking-wider">
                  Read 2:01 AM
                </div>

                <div className="flex-1 min-h-[120px]"></div>
              </div>

              <div className="w-full bg-[#1c1c1e] p-3 pb-8 border-t border-white/10 relative z-10">
                <div className="w-full bg-[#2c2c2e] rounded-full py-2.5 px-4 flex items-center shadow-inner">
                  <span className="text-white text-[15px] font-medium opacity-90 flex items-center">
                    Did I say something wrong?
                    {/* Fixed Framer Motion parsing bug with strict array steps */}
                    <motion.div 
                      animate={{ opacity: [1, 1, 0, 0] }}
                      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1], ease: "linear" }}
                      className="w-0.5 h-5 bg-[#0A84FF] ml-0.5"
                    ></motion.div>
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"></div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* --- 6. REVIEWS (AUTO-SCROLL) --- */}
      <section className="py-32 bg-[#1D1D1F] overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center px-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">Real Results.</h2>
          <p className="text-xl text-white/60 font-medium tracking-tight">From women who stopped overthinking.</p>
        </div>

        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#1D1D1F] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#1D1D1F] to-transparent z-10 pointer-events-none"></div>

        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }} 
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }} 
            className="flex gap-6 px-4"
          >
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={`top-${i}`} 
                className="w-[400px] shrink-0 bg-[#2D2D2F] rounded-[2.5rem] p-8 border border-white/10 flex flex-col gap-5 whitespace-normal cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${review.color} text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-inner`}>
                    {review.initials}
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">{review.name}</div>
                    <div className="text-sm font-bold text-white/40 uppercase tracking-wider">{review.location}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, idx) => <Star key={idx} className="w-5 h-5 fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />)}
                </div>
                <h4 className="font-bold text-xl text-white">{review.title}</h4>
                <p className="text-white/70 text-base font-medium leading-relaxed">{review.text}</p>
                <div className="mt-auto pt-5 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-green-400 tracking-widest uppercase">
                  <Check className="w-4 h-4" /> Verified Purchase
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- 8. BEFORE / AFTER --- */}
      <section className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-rose-50/50 p-10 md:p-14 rounded-[3rem] border border-rose-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-400"></div>
            <h3 className="text-sm font-extrabold text-rose-500 uppercase tracking-widest mb-8">Before</h3>
            <ul className="space-y-6 text-xl font-bold text-gray-700">
              <li className="flex items-start gap-4 opacity-50"><X className="w-6 h-6 text-rose-500 shrink-0"/> Overthinking every message</li>
              <li className="flex items-start gap-4 opacity-50"><X className="w-6 h-6 text-rose-500 shrink-0"/> Feeling anxious</li>
              <li className="flex items-start gap-4 opacity-50"><X className="w-6 h-6 text-rose-500 shrink-0"/> Waiting for replies</li>
              <li className="flex items-start gap-4 opacity-50"><X className="w-6 h-6 text-rose-500 shrink-0"/> Trying to "fix" things</li>
            </ul>
          </div>

          <div className="bg-green-50/50 p-10 md:p-14 rounded-[3rem] border border-green-100 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
            <h3 className="text-sm font-extrabold text-green-600 uppercase tracking-widest mb-8">After</h3>
            <ul className="space-y-6 text-xl font-bold text-[#1D1D1F]">
              <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0"/> Knowing exactly what to say</li>
              <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0"/> Feeling calm and in control</li>
              <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0"/> Letting him come to you</li>
              <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0"/> Understanding everything</li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- 9. CHECKOUT SECTION (THE PERSUASION ENGINE) --- */}
      <section id="checkout-section" className="py-24 md:py-32 px-6 relative bg-[#FDF8F9] overflow-hidden">
        
        {/* Soft Background Globs */}
        <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-pink-200/30 blur-[100px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] bg-rose-200/30 blur-[80px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-start relative z-20">
          
          {/* LEFT SIDE (Desktop Persuasion / Mobile Top Info) */}
          <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-10 order-1">
            
            <div className="text-center lg:text-left space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1F]">Secure Access</h2>
              <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
                <span className="text-3xl lg:text-4xl text-gray-400 line-through font-bold">$67</span>
                <span className="text-6xl lg:text-7xl font-extrabold tracking-tighter text-pink-500">$47.77</span>
              </div>
              <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-md mx-auto lg:mx-0 mt-4 leading-snug">
                This isn't $47.77 for a book.<br/>
                It's the difference between <span className="line-through decoration-gray-300">confusion</span> and clarity.
              </p>
            </div>

            {/* Mobile Trust Strip */}
            <div className="flex lg:hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-extrabold text-[#1D1D1F] uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-green-500"/> Secure</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500"/> Instant</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-500"/> 50k+ Women</span>
            </div>

            <div className="hidden lg:flex flex-col gap-8 mt-4">
              <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-white/80 shadow-sm">
                <h3 className="text-xl font-extrabold text-[#1D1D1F] mb-4">What happens next?</h3>
                <ul className="space-y-4 text-lg font-medium text-gray-600">
                  <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0 mt-0.5"/> <span>You stop reacting emotionally and regain your frame.</span></li>
                  <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0 mt-0.5"/> <span>You understand exactly why he pulled away.</span></li>
                  <li className="flex items-start gap-4"><Check className="w-6 h-6 text-green-500 shrink-0 mt-0.5"/> <span>You know precisely what message to send (and what not to).</span></li>
                </ul>
              </div>
              
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-[#1D1D1F]">365-Day Guarantee</p>
                  <p className="text-gray-500 font-medium mt-1">If this doesn't fundamentally change how you understand men, get a full refund. No questions asked.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Payment Card - Apple Style Solid Container) */}
          <div className="lg:col-span-5 w-full max-w-[420px] mx-auto order-2 relative z-[9900] mt-4 lg:mt-0 isolate pointer-events-auto">
            {/* SOLID WHITE BACKGROUND - ZERO BACKDROP-BLUR TO PREVENT WEBKIT BUG */}
            <div className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.08)] relative z-[9950] isolate pointer-events-auto">
              
              <AnimatePresence mode="wait">
                {checkoutState === "success" ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-6 relative z-10"
                  >
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">Access Granted</h3>
                    <p className="text-gray-500 text-lg font-medium">Your private link has been emailed to <br/><span className="font-bold text-[#1D1D1F] mt-2 block">{email}</span></p>
                  </motion.div>
                ) : (
                  <motion.div exit={{ opacity: 0 }} className="relative z-10">
                    <Elements stripe={stripePromise}>
                      <CheckoutForm 
                        email={email} 
                        onEmailChange={setEmail} 
                        name={name} 
                        onNameChange={setName}
                        checkoutState={checkoutState}
                        setCheckoutState={setCheckoutState} 
                      />
                    </Elements>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* MOBILE ONLY Guarantee & Micro Trust (Order 3) */}
          <div className="lg:hidden order-3 text-center space-y-8 mt-4 px-4 w-full">
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8 space-y-4">
              <ShieldCheck className="w-8 h-8 text-green-500 mx-auto" />
              <h3 className="font-extrabold text-xl text-[#1D1D1F]">Try it for 365 days.</h3>
              <p className="text-gray-600 font-medium leading-relaxed text-sm">
                If it doesn't change how you understand men, you get a full refund.<br/><br/>
                <span className="font-extrabold text-[#1D1D1F]">No questions.</span>
              </p>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Most readers finish this in one night.
            </p>
          </div>

        </div>
      </section>

      {/* --- 11. FAQ (PREMIUM ACCORDION) --- */}
      <section className="py-32 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F] mb-6">FAQ</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md hover:border-pink-100">
              <button 
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                className="w-full px-8 py-8 text-left flex justify-between items-center focus:outline-none"
              >
                <span className="font-extrabold text-lg md:text-xl text-[#1D1D1F] pr-6">{faq.question}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 shrink-0 transition-transform duration-500 ${openFaqIndex === i ? "rotate-180 bg-[#1D1D1F] text-white" : "text-[#1D1D1F]"}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <AnimatePresence>
                {openFaqIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-8 pb-8 text-gray-500 text-base md:text-lg font-medium leading-relaxed whitespace-pre-line"
                  >
                    {faq.answer}
                  </motion.div>
                )}
             </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER & LEGAL MODALS --- */}
      <footer className="pt-16 pb-32 border-t border-gray-200 text-center text-sm font-bold tracking-widest uppercase text-gray-400">
        <div className="flex justify-center items-center gap-8 mb-6">
          <button onClick={() => setActiveModal("privacy")} className="hover:text-[#1D1D1F] transition-colors">Privacy</button>
          <button onClick={() => setActiveModal("terms")} className="hover:text-[#1D1D1F] transition-colors">Terms</button>
        </div>
        <p className="opacity-50">© 2026 Attract Best Man. All rights reserved.</p>
      </footer>

      {/* LEGAL MODALS (APPLE GLASSMORPHISM) */}
      <AnimatePresence>
        {activeModal !== "none" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xl"
              onClick={() => setActiveModal("none")}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white/90 backdrop-blur-3xl border border-white/50 p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <button 
                onClick={() => setActiveModal("none")}
                className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full flex items-center justify-center transition-colors"
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
                  <h4 className="text-xl font-bold text-[#1D1D1F] pt-4">Refund Policy</h4>
                  <p>We offer a 365-day money-back guarantee. If you are not satisfied, you may request a refund.</p>
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

      {/* --- STICKY BOTTOM CTA (MACOS DOCK STYLE - Hides during checkout) --- */}
      <AnimatePresence>
        {showStickyCta && (
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="fixed bottom-6 left-0 right-0 px-4 md:px-6 z-50 flex justify-center pointer-events-none"
          >
            <button 
              onClick={handleCTA}
              className="pointer-events-auto w-[90%] sm:w-auto px-8 py-4 bg-white/70 backdrop-blur-3xl border border-white/60 text-[#1D1D1F] rounded-2xl md:rounded-[2rem] font-bold text-lg shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:bg-white/90 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-400 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100/0 via-gray-100/50 to-gray-100/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              <Lock className="w-5 h-5 text-gray-400" />
              <span className="relative z-10 flex items-center gap-2">
                Unlock Now <span className="text-pink-500 ml-1 font-extrabold">— $47.77</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}