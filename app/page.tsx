"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Star, Lock, ShieldCheck, ArrowRight, ChevronDown, Mail } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// --- STRIPE SETUP ---
// Using your provided live publishable key
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
  { name: "Miroslava Feria", location: "Mexico", initials: "MF", color: "bg-emerald-500", title: "I Needed This Book", text: "I was dating a guy who didn't want a relationship with me, now I understand it wasn't my fault. Now, I am able to see all the signs." },
  { name: "Catalina", location: "Bulgaria", initials: "C", color: "bg-amber-500", title: "I Loved the Book", text: "I loved the book, particularly the case studies and the message examples. Really nice addition to everything else!" },
  { name: "Adora Riestra", location: "Mexico", initials: "A", color: "bg-pink-500", title: "Game Changing Book", text: "It changes your perspective on how you approach men and how you approach yourself. A game changer." },
  { name: "Sarah Jenkins", location: "USA", initials: "SJ", color: "bg-blue-500", title: "Finally Makes Sense", text: "I stopped overanalyzing his late replies. This book gave me the exact framework to stay calm and grounded." },
];

const REVIEWS_BOTTOM = [
  { name: "Noor Afiza", location: "Email to Joao", initials: "NA", color: "bg-purple-400", title: "\"Really helpful\"", text: "Great book. Really helpful for my relationship. It works for some technique like scarcity the most." },
  { name: "Iordan Camelia", location: "Italy", initials: "IC", color: "bg-rose-400", title: "Nice One!", text: "The book is cool! I'm really happy I purchased it. Totally recommend! Thank you 🌻" },
  { name: "Jessica T.", location: "UK", initials: "JT", color: "bg-indigo-400", title: "Saved my sanity", text: "Before this, I would panic double-text. Now I know exactly why he pulls back and how to handle it effortlessly." },
  { name: "Elena R.", location: "Spain", initials: "ER", color: "bg-teal-400", title: "Pure Gold", text: "The psychology part is mind-blowing. It's like having a cheat code to understand what they are actually thinking." },
];

// --- DATA: FAQS ---
const FAQS = [
  { question: "Is this a physical book or a digital download?", answer: "This is a digital ebook. You will receive instant access to download it immediately after your secure checkout, allowing you to start reading right away on your phone, tablet, or computer." },
  { question: "What if the strategies don't work for my specific situation?", answer: "The psychology detailed in this book applies universally to male behavior patterns. However, if you apply the frameworks and feel it hasn't changed your understanding, you are covered by our 365-day no-questions-asked guarantee." },
  { question: "Will this work if we are already in a long-term relationship?", answer: "Yes. The core principles of maintaining attraction, handling emotional distance, and communicating effectively apply whether you've been dating for two weeks or married for five years." },
  { question: "How does the checkout process work?", answer: "Your checkout is completely secure and encrypted via Stripe. We do not store your card details. Once payment is confirmed, our automated system instantly emails your access link." },
];

// --- CHECKOUT FORM COMPONENT ---
const CheckoutForm = ({ onEmailChange, email, name, onNameChange, setCheckoutState }: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    trackPinterest("checkout");
    setCheckoutState("processing");

    // NOTE: In production, you will fetch a clientSecret from your Next.js API here
    // For now, we simulate the flawless loading state and success
    setTimeout(() => {
      trackPinterest("purchase", { value: 47.77, currency: "USD" });
      setCheckoutState("success");
      // Here is where the Resend email trigger will fire from your backend
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <input 
          type="text" 
          required
          placeholder="Full Name" 
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-lg"
        />
        <input 
          type="email" 
          required
          placeholder="Email Address" 
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all text-lg"
        />
      </div>

      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm relative overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/50 transition-all">
        <div className="flex items-center justify-between mb-4 text-sm font-medium text-[#86868B]">
          <span>Card details</span>
          <div className="flex gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="py-2">
          <CardElement options={{
            style: {
              base: { fontSize: '16px', color: '#1D1D1F', '::placeholder': { color: '#A1A1AA' }, fontFamily: 'system-ui, sans-serif' },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true
          }}/>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={!stripe}
        className="w-full py-5 bg-[#1D1D1F] text-white rounded-2xl font-semibold text-lg hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Get Instant Access
      </button>

      <div className="flex flex-col items-center gap-2 text-sm font-medium text-[#86868B]">
        <span className="flex items-center gap-1.5"><Lock className="w-4 h-4"/> Secure encrypted checkout via Stripe</span>
        <span className="flex items-center gap-1.5"><Mail className="w-4 h-4"/> Instant automated email delivery</span>
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

  useEffect(() => {
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
  }, []);

  const handleCTA = () => {
    trackPinterest("addtocart");
    document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-rose-200 selection:text-rose-900 pb-32 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-24 pb-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-white border border-gray-100 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-gray-100 flex items-center justify-center text-gray-300">
            [ ebook1.jpg ]
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col space-y-8"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-balance leading-[1.1]">
              He Didn’t <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">“Lose Interest.”</span><br/>
              You Just Didn’t See The Pattern Yet.
            </h1>
            <p className="mt-6 text-xl text-[#86868B] leading-relaxed max-w-md font-medium">
              Understand exactly how men think, pull away, and choose so you stop guessing, stop overgiving, and finally feel in control.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              "Know what to say when he goes distant (without sounding desperate)",
              "Recognize the signs early before you get emotionally attached",
              "Stop replaying conversations in your head"
            ].map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-[#1D1D1F] font-medium text-lg">
                <Check className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <button 
              onClick={handleCTA}
              className="w-full md:w-auto px-10 py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold text-lg shadow-[0_8px_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Access The System Now <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-4 flex items-center justify-center md:justify-start gap-2 text-sm text-[#86868B] font-medium">
              <Lock className="w-4 h-4" /> Instant access • Secure checkout • Risk-free
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-sm font-medium text-[#1D1D1F]">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <span>Trusted by 50,000+ women · 4.8★ average rating · 365-day guarantee</span>
          </div>
        </motion.div>
      </section>

      {/* --- PAIN / IDENTIFICATION --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">This is how it usually goes...</h2>
          
          <div className="text-xl md:text-2xl leading-relaxed text-[#1D1D1F] space-y-8 font-medium">
            <p className="text-[#86868B]">He starts off consistent.</p>
            <p>Messages feel easy. Natural.</p>
            <p>Then something shifts.</p>
            <p>He replies slower. Cancels. Feels distant.</p>
            <p className="text-2xl md:text-3xl font-semibold">And suddenly... you’re the one trying to “figure it out.”</p>
          </div>

          <div className="pt-8 border-t border-gray-100">
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-pink-500 to-rose-500 text-transparent bg-clip-text">
              Not knowing where you stand is what keeps you stuck.<br/>Not him.
            </p>
          </div>
        </div>
      </section>

      {/* --- REVIEWS SECTION (DUAL MARQUEE) --- */}
      <section className="py-24 bg-[#FCF8FA] overflow-hidden relative border-y border-pink-50/50">
        <div className="max-w-4xl mx-auto text-center px-6 mb-16">
          <span className="px-4 py-1.5 bg-rose-400 text-white text-sm font-bold tracking-widest uppercase rounded mb-6 inline-block">Real Results</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-4">50,000+ Women Can't Be Wrong</h2>
          <p className="text-xl text-[#86868B] font-medium">Here's what readers are saying</p>
        </div>

        {/* Faded edges for smooth scroll illusion */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#FCF8FA] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#FCF8FA] to-transparent z-10 pointer-events-none"></div>

        <div className="flex flex-col gap-6">
          {/* Top Marquee - Scrolls Left */}
          <div className="flex whitespace-nowrap">
            <motion.div 
              animate={{ x: ["0%", "-50%"] }} 
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex gap-6 px-3"
            >
              {[...REVIEWS_TOP, ...REVIEWS_TOP].map((review, i) => (
                <div key={`top-${i}`} className="w-[400px] shrink-0 bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 whitespace-normal">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`w-12 h-12 rounded-full ${review.color} text-white flex items-center justify-center font-bold text-lg shrink-0`}>
                      {review.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1D1D1F] text-lg">{review.name}</div>
                      <div className="text-sm text-[#86868B]">{review.location}</div>
                    </div>
                  </div>
                  <div className="flex text-emerald-500 gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                  </div>
                  <h4 className="font-bold text-xl text-[#1D1D1F]">{review.title}</h4>
                  <p className="text-[#4b4b4d] leading-relaxed line-clamp-4">{review.text}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-[#86868B] tracking-wider">
                    <Check className="w-4 h-4 text-gray-400" /> VERIFIED ON TRUSTPILOT
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Marquee - Scrolls Right */}
          <div className="flex whitespace-nowrap">
            <motion.div 
              animate={{ x: ["-50%", "0%"] }} 
              transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
              className="flex gap-6 px-3"
            >
              {[...REVIEWS_BOTTOM, ...REVIEWS_BOTTOM].map((review, i) => (
                <div key={`bottom-${i}`} className="w-[400px] shrink-0 bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 flex flex-col gap-4 whitespace-normal">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`w-12 h-12 rounded-full ${review.color} text-white flex items-center justify-center font-bold text-lg shrink-0`}>
                      {review.initials}
                    </div>
                    <div>
                      <div className="font-bold text-[#1D1D1F] text-lg">{review.name}</div>
                      <div className="text-sm text-[#86868B]">{review.location}</div>
                    </div>
                  </div>
                  <div className="flex text-emerald-500 gap-1">
                    {[...Array(5)].map((_, idx) => <Star key={idx} className="w-4 h-4 fill-current" />)}
                  </div>
                  <h4 className="font-bold text-xl text-[#1D1D1F]">{review.title}</h4>
                  <p className="text-[#4b4b4d] leading-relaxed line-clamp-4">{review.text}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-[#86868B] tracking-wider">
                    <Check className="w-4 h-4 text-gray-400" /> VERIFIED PURCHASE
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- REFRAME SECTION --- */}
      <section className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
          Men aren’t confusing.<br/>
          <span className="text-[#86868B]">They’re just predictable in ways no one explained to you.</span>
        </h2>
        <p className="text-xl md:text-2xl text-[#1D1D1F] font-medium leading-relaxed max-w-2xl mx-auto">
          Once you see the pattern, everything changes <br/><br/>
          how you respond, what you tolerate, and who you give your attention to.
        </p>
      </section>

      {/* --- WHAT'S INSIDE (GLASSMORPHISM CARDS) --- */}
      <section className="py-24 px-6 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: "1", title: "The Psychology", desc: "Why men pull away and why chasing makes it worse" },
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
                className="bg-white/70 backdrop-blur-xl border border-white/40 p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="text-sm font-bold text-rose-500 tracking-wider uppercase mb-4">Module {card.num}</div>
                <h3 className="text-2xl font-semibold mb-3">{card.title}</h3>
                <p className="text-[#86868B] text-lg">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- VALUE BUILD --- */}
      <section className="py-32 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
          This isn’t about “getting him.”<br/>
          <span className="text-rose-500">It’s about never feeling unsure again.</span>
        </h2>
        <div className="text-xl md:text-2xl text-[#1D1D1F] font-medium leading-relaxed space-y-4">
          <p>When you understand what’s happening,</p>
          <p>you stop reacting emotionally...</p>
          <p>and start moving with clarity.</p>
        </div>
      </section>

      {/* --- OFFER & CHECKOUT SECTION --- */}
      <section id="checkout-section" className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-xl mx-auto">
          
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-3xl text-[#86868B] line-through font-medium">$67</span>
              <span className="text-6xl font-semibold tracking-tight text-rose-500">$47.77</span>
            </div>
            <p className="text-lg text-[#86868B] font-medium">
              a small decision compared to months of emotional confusion
            </p>
            <p className="mt-4 text-[#1D1D1F] font-medium">
              Less than what most people spend trying to “fix” confusion that could’ve been avoided.
            </p>
          </div>

          <div className="bg-[#FBFBFD] border border-gray-200 rounded-[2rem] p-8 shadow-sm">
            <AnimatePresence mode="wait">
              {checkoutState === "success" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight">Payment Successful</h3>
                  <p className="text-[#86868B] text-lg">Your access has been instantly emailed to <br/><span className="font-semibold text-[#1D1D1F]">{email}</span></p>
                </motion.div>
              ) : (
                <motion.div exit={{ opacity: 0 }}>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm 
                      email={email} 
                      onEmailChange={setEmail} 
                      name={name} 
                      onNameChange={setName}
                      setCheckoutState={setCheckoutState} 
                    />
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 px-6 bg-[#F5F5F7]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold tracking-tight text-[#1D1D1F] mb-4">Questions?</h2>
            <p className="text-xl text-[#86868B] font-medium">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button 
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-semibold text-lg text-[#1D1D1F]">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-[#86868B] transition-transform duration-300 ${openFaqIndex === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-5 text-[#86868B] leading-relaxed"
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

      {/* --- GUARANTEE --- */}
      <section className="py-24 px-6 bg-white text-center border-b border-gray-100">
        <div className="max-w-2xl mx-auto space-y-6">
          <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-8" />
          <p className="text-2xl md:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Try it for 365 days.</p>
          <p className="text-xl text-[#86868B] font-medium leading-relaxed">
            If it doesn’t change how you understand men <br/>
            you get a full refund.<br/>
            No questions.
          </p>
        </div>
      </section>

      {/* --- AUTHOR --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-6 text-xl md:text-2xl leading-relaxed font-medium">
          <p className="text-[#86868B]">I used to be the type of man women couldn’t read.</p>
          <p>Interested... then distant.</p>
          <p className="text-[#1D1D1F]">Until I met someone who didn’t react the way I expected.</p>
          <p>That’s when I started paying attention.</p>
          <p className="font-semibold pt-4">This book is what I learned.</p>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="pt-24 pb-32 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-12">
          You can keep guessing...<br/>
          <span className="text-rose-500">or finally understand what’s happening.</span>
        </h2>
        <button 
          onClick={handleCTA}
          className="px-12 py-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold text-xl shadow-[0_10px_30px_rgba(244,63,94,0.3)] hover:shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:scale-[1.03] transition-all duration-300"
        >
          Access It Now
        </button>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-8 pb-32 border-t border-gray-200 text-center text-sm font-medium text-[#86868B]">
        <div className="flex justify-center items-center gap-4 mb-4">
          <a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms of Service</a>
        </div>
        <p>© 2026 Attract Best Man. All rights reserved.</p>
      </footer>

      {/* --- STICKY BOTTOM CTA --- */}
      <div className="fixed bottom-6 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
        <button 
          onClick={handleCTA}
          className="pointer-events-auto w-full md:w-auto px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-semibold text-lg shadow-[0_8px_25px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.7)] hover:scale-[1.03] transition-all duration-300 backdrop-blur-md"
        >
          Access The System Now - $47.77
        </button>
      </div>

    </div>
  );
}