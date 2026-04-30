"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Lock, ShieldCheck, ArrowRight, ChevronDown, Mail } from "lucide-react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// --- STRIPE SETUP ---
const stripePromise = loadStripe("pk_live_51OVFnPA96PPqJRyui3iXLK5bLOm9pCmvddRgIHY1UTiEDprJ5PYRfT3NlB5fNLqaEavooguwV94Yoxo9bTEgiSy800U2NXnXUe");

// --- PINTEREST TRACKING SETUP ---
const TAG_IDS = [
  "TAG_ID_1", "TAG_ID_2", "TAG_ID_3", "TAG_ID_4", "TAG_ID_5",
  "TAG_ID_6", "TAG_ID_7", "TAG_ID_8", "TAG_ID_9", "TAG_ID_10"
];

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
  { question: "Is this book about manipulating men?", answer: "No.\n\nThis isn’t about tricks or games.\nIt’s about understanding behavior, so you stop reacting emotionally and start responding with clarity.\nNothing here forces someone to like you.\n\nIt simply helps you stop pushing the right people away and stop investing in the wrong ones." },
  { question: "Won’t the texts feel weird to send?", answer: "No, and that’s the point.\nEverything is designed to feel natural, calm, and grounded.\n\nNot scripted. Not forced.\nYou’ll recognize the difference immediately:\n\nless pressure, less overthinking... more control." },
  { question: "What if my situation isn’t in the book?", answer: "It doesn’t need to be.\nBecause this isn’t a collection of random scenarios, it’s a pattern.\nOnce you understand the underlying behavior,\n\nyou’ll know how to handle situations even if they look different on the surface." },
  { question: "I’m already in a relationship. Is this still for me?", answer: "Yes.\nIn fact, this is where it becomes even more powerful.\nYou’ll start seeing dynamics you didn’t notice before,\n\nand understand why certain patterns keep repeating." },
  { question: "Why should I take dating advice from a man?", answer: "Because you’re trying to understand men.\nThis isn’t theory.\n\nIt’s perspective from the other side, translated into something you can actually use.\nNot opinions. Patterns." },
  { question: "When do I get access?", answer: "Immediately after purchase.\nNo waiting, no shipping, you’ll receive everything instantly." },
  { question: "How long until I see a difference?", answer: "Most women notice it almost immediately.\nNot because something magical happens,\n\nbut because you stop second-guessing yourself.\nAnd that changes everything." },
  { question: "Is my payment secure?", answer: "Yes.\nAll payments are encrypted and processed through secure providers.\n\nYour information is protected at every step." },
  { question: "What if I don’t like it?", answer: "You’re covered by a 365-day money-back guarantee.\nIf it doesn’t change how you understand men,\n\njust ask for a refund.\nNo questions." },
  { question: "I’ve read other dating books. Why is this one different?", answer: "Most books give advice.\nThis gives you understanding.\nInstead of telling you what to do,\n\nit shows you why things happen, so you don’t have to rely on guesswork again." },
  { question: "I have a question about my order.", answer: "You can contact support anytime, and you’ll get a response quickly.\nWe make sure you’re taken care of." },
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
    trackPinterest("checkout", { event_id: eventId });
    setCheckoutState("processing");

    try {
      // 1. Fetch Payment Intent securely
      const intentRes = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      // Catch HTML error pages (404/500) before they crash the JSON parser
      const contentType = intentRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unable to connect to the secure payment server. Please contact support.");
      }

      const intentData = await intentRes.json();

      if (!intentRes.ok) {
        throw new Error(intentData.error || "Failed to initialize secure checkout.");
      }

      if (!intentData.clientSecret) {
        throw new Error("Invalid response from payment server.");
      }

      // 2. Confirm Card Payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name, email },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // 3. Complete Order
      if (paymentIntent.status === "succeeded") {
        const completeRes = await fetch("/api/complete-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            email,
            name,
            eventId
          }),
        });

        // Graceful error handling for the complete order route
        const completeContentType = completeRes.headers.get("content-type");
        if (completeContentType && completeContentType.includes("application/json")) {
           const completeData = await completeRes.json();
           if (!completeRes.ok) {
             console.error("Order completion warning:", completeData.error);
           }
        }

        trackPinterest("purchase", { value: 47.77, currency: "USD", event_id: eventId });
        setCheckoutState("success");
      }
    } catch (err: any) {
      console.error("Checkout Error:", err);
      // Clean, user-friendly error message format
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

      {/* Flawless, organized error message container */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }} 
            animate={{ opacity: 1, height: "auto", y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="text-red-500 text-sm font-bold text-center bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        type="submit" 
        disabled={!stripe || checkoutState === "processing"}
        className="w-full py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-bold text-xl hover:from-pink-500 hover:to-rose-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(244,63,94,0.3)] hover:shadow-[0_15px_35px_rgba(244,63,94,0.4)] hover:-translate-y-0.5 duration-300"
      >
        {checkoutState === "processing" ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Securely...
          </>
        ) : "Get Instant Access"}
      </button>

      <div className="flex flex-col items-center gap-2 text-sm font-semibold text-gray-400">
        <span className="flex items-center gap-1.5"><Lock className="w-4 h-4"/> 256-Bit Encrypted Checkout</span>
        <span className="flex items-center gap-1.5"><Mail className="w-4 h-4"/> Instant Automated Delivery</span>
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

  useEffect(() => {
    // Pinterest initialization
    if (typeof window !== "undefined") {
      !function(e:any){if(!window.pintrk){window.pintrk=function(){
      window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
      var n=window.pintrk;n.queue=[],n.version="3.0";
      var t=document.createElement("script");
      t.async=!0,t.src=e;
      var r=document.getElementsByTagName("script")[0];
      r.parentNode?.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");

      TAG_IDS.forEach((id) => {
        (window as any).pintrk("load", id);
        (window as any).pintrk("page");
      });
    }

    // Intersection Observer for CTAs
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
        
        setVisibleCtaCount((prev) => {
          const newCount = Math.max(0, prev + intersectingDelta);
          return newCount;
        });
      },
      { threshold: 0, rootMargin: "-10px 0px -10px 0px" } 
    );

    ctaElements.forEach((el) => observer.observe(el));

    // Scroll listener for top of page logic
    const handleScroll = () => {
      const heroSection = document.getElementById("hero-section");
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        setHasScrolledPastHero(rect.bottom < 100); 
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCTA = () => {
    trackPinterest("addtocart");
    document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // The sticky button should only show if we have passed the hero AND no other CTA is visible
  const showStickyCta = hasScrolledPastHero && visibleCtaCount === 0;

  return (
    <div className="min-h-screen bg-[#FDF8F9] text-[#1D1D1F] font-sans selection:bg-pink-200 selection:text-pink-900 pb-32 overflow-x-hidden antialiased">
      
      {/* --- MAC-OS STYLE HERO SECTION (SOFT & FEMININE) --- */}
      <section id="hero-section" className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Soft elegant background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] opacity-40 pointer-events-none -z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 via-rose-50 to-transparent blur-[80px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col space-y-8 order-2 lg:order-1 lg:col-span-7"
          >
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance leading-[1.1]">
                He Didn’t <span className="text-transparent bg-clip-text bg-gradient-to-br from-pink-400 to-rose-500">“Lose Interest.”</span><br/>
                You Just Didn’t See The Pattern Yet.
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-gray-500 leading-relaxed max-w-lg font-medium text-balance">
                Understand exactly how men think, pull away, and choose, so you stop guessing, <span className="text-[#1D1D1F] font-bold border-b-2 border-pink-200 pb-0.5">stop overgiving</span>, and finally feel in control.
              </p>
            </div>

            <ul className="space-y-4">
              {[
                "Know what to say when he goes distant (without sounding desperate)",
                "Recognize the signs early, before you get emotionally attached",
                "Stop replaying conversations in your head"
              ].map((bullet, i) => (
                <li key={i} className="flex items-start gap-4 text-[#1D1D1F] font-semibold text-base lg:text-lg">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Check className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              {/* Added .page-cta-button class for intersection observer */}
              <button 
                onClick={handleCTA}
                className="page-cta-button w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-bold text-xl shadow-[0_15px_30px_rgba(244,63,94,0.25)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.4)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
              >
                Access The System Now <ArrowRight className="w-5 h-5" />
              </button>
              <div className="mt-5 flex flex-col sm:flex-row items-center gap-4 text-sm font-semibold text-gray-400">
                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Secure checkout</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">Instant access</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-2">Risk-free</span>
              </div>
            </div>
          </motion.div>

          {/* Rendered Local Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-1 lg:order-2 lg:col-span-5 w-full flex justify-center"
          >
            <div className="relative aspect-[4/5] w-full max-w-[420px] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(244,63,94,0.15)] bg-white border border-white/60">
               <Image 
                  src="/ebook1.jpg" 
                  alt="Understand Men Ebook" 
                  fill 
                  className="object-cover"
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
            <p className="text-3xl md:text-4xl font-extrabold pt-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">And suddenly... you’re the one trying to “figure it out.”</p>
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

      {/* --- REVIEWS SECTION (DUAL MARQUEE) --- */}
      <section className="py-28 bg-[#FFF0F3]/40 overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center px-6 mb-16">
          <span className="px-5 py-2 bg-white text-pink-500 text-sm font-extrabold tracking-widest uppercase rounded-full mb-6 inline-block shadow-sm border border-pink-100">Real Results</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-4">50,000+ Women Can't Be Wrong</h2>
          <p className="text-xl text-gray-500 font-medium tracking-tight">Here's what readers are saying</p>
        </div>

        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FDF8F9] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FDF8F9] to-transparent z-10 pointer-events-none"></div>

        <div className="flex flex-col gap-6">
          {/* Top Marquee */}
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

          {/* Bottom Marquee */}
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

      {/* --- REFRAME SECTION (SOFT & LIGHT) --- */}
      <section className="py-24 px-6 bg-[#FDF8F9]">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-[#1D1D1F]">
            Men aren’t confusing.<br/>
            <span className="text-pink-400 mt-3 block">They’re just predictable in ways no one explained to you.</span>
          </h2>
          <p className="text-xl md:text-2xl font-semibold leading-relaxed max-w-2xl mx-auto text-gray-600">
            Once you see the pattern, everything changes: <br/><br/>
            how you respond, what you tolerate, and who you give your attention to.
          </p>
        </div>
      </section>

      {/* --- WHAT'S INSIDE (SOFT GLASSMORPHISM CARDS) --- */}
      <section className="py-20 px-6 bg-[#FDF8F9]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { num: "1", title: "The Psychology", desc: "Why men pull away, and why chasing makes it worse" },
              { num: "2", title: "Exact Words", desc: "What to say in moments that usually push him away" },
              { num: "3", title: "Early Signals", desc: "How to know within days if he’s serious" },
              { num: "4", title: "The Structure", desc: "A calm, grounded way to handle any situation" }
            ].map((card, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                key={i} 
                className="bg-white/80 backdrop-blur-xl border border-pink-50 p-10 rounded-[2.5rem] shadow-[0_10px_40px_rgba(244,63,94,0.06)] hover:shadow-[0_15px_50px_rgba(244,63,94,0.1)] transition-all duration-500"
              >
                <div className="text-sm font-extrabold text-pink-400 tracking-widest uppercase mb-4">Module {card.num}</div>
                <h3 className="text-2xl font-bold mb-3 text-[#1D1D1F]">{card.title}</h3>
                <p className="text-gray-500 text-lg font-medium leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- VALUE BUILD --- */}
      <section className="py-28 px-6 bg-white border-y border-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-10">
            This isn’t about “getting him.”<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">It’s about never feeling unsure again.</span>
          </h2>
          <div className="text-xl md:text-2xl text-[#1D1D1F] font-semibold tracking-tight leading-relaxed space-y-4">
            <p>When you understand what’s happening,</p>
            <p>you stop reacting emotionally...</p>
            <p className="text-pink-500">and start moving with clarity.</p>
          </div>
          
          <div className="pt-12">
            <button 
              onClick={handleCTA}
              className="page-cta-button px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-bold text-xl shadow-[0_10px_30px_rgba(244,63,94,0.25)] hover:shadow-[0_15px_40px_rgba(244,63,94,0.4)] hover:scale-[1.02] transition-all duration-300"
            >
              Get Instant Access
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
            <p className="text-lg text-gray-500 font-semibold mb-6">
              A small decision compared to months of emotional confusion.
            </p>
            <p className="text-base text-[#1D1D1F] font-semibold bg-pink-100/50 py-3 px-6 rounded-full inline-block">
              Less than what most people spend trying to “fix” confusion that could’ve been avoided.
            </p>
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
                    {/* The form acts as a CTA area, so we tag it for the observer */}
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
            If you’ve made it this far, you’re not just curious.
          </h3>
          <p className="text-xl text-pink-500 font-bold mb-10">
            You’re tired of not knowing.
          </p>
          <button 
            onClick={handleCTA}
            className="page-cta-button px-10 py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full font-bold text-lg shadow-[0_10px_25px_rgba(244,63,94,0.25)] hover:shadow-[0_15px_35px_rgba(244,63,94,0.4)] hover:scale-[1.02] transition-all duration-300"
          >
            Get Instant Access Now
          </button>
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
            If it doesn’t change how you understand men <br/>
            you get a full refund.<br/>
            <span className="font-bold text-[#1D1D1F]">No questions.</span>
          </p>
        </div>
      </section>

      {/* --- AUTHOR --- */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-6 text-xl md:text-2xl leading-relaxed font-semibold tracking-tight">
          <p className="text-gray-400">I used to be the type of man women couldn’t read.</p>
          <p>Interested... then distant.</p>
          <p className="text-[#1D1D1F]">Until I met someone who didn’t react the way I expected.</p>
          <p>That’s when I started paying attention.</p>
          <p className="font-bold pt-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">This book is what I learned.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-10 pb-32 border-t border-pink-50 bg-[#FDF8F9] text-center text-xs font-bold tracking-widest uppercase text-gray-400">
        <div className="flex justify-center items-center gap-6 mb-5">
          <a href="#" className="hover:text-pink-400 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-pink-400 transition-colors">Terms of Service</a>
        </div>
        <p>© 2026 Attract Best Man. All rights reserved.</p>
      </footer>

      {/* --- STICKY BOTTOM CTA (SMART LOGIC) --- */}
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
              className="pointer-events-auto w-full sm:w-auto px-10 py-5 bg-white/90 backdrop-blur-xl border border-pink-100 text-[#1D1D1F] rounded-full font-bold text-lg shadow-[0_15px_40px_rgba(244,63,94,0.15)] hover:bg-pink-50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Access The System Now <span className="text-pink-500 ml-1">- $47.77</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}