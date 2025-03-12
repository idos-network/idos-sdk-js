"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  CommandIcon,
  CreditCardIcon,
  GemIcon,
  PlaneIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 12,
    minutes: 45,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Hero Section */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-gray-950 via-neutral-900 to-black"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="container relative z-10 mx-auto px-6 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ color: "#ffffff" }}
              animate={{ color: "#9ca3af" }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <CommandIcon className="h-24 w-24" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
          <h1 className="mb-8 font-bold text-5xl text-gray-100 md:text-7xl">
            Welcome to ACME Bank
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-gray-400 text-xl md:text-2xl">
            Experience the future of banking with our revolutionary digital credit card and
            exclusive benefits worth over{" "}
            <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text font-bold text-transparent">
              $1,000,000
            </span>
          </p>
          <Button color="primary" size="lg">
            Get started now
          </Button>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-neutral-950 py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <motion.div className="text-center" {...fadeInUp}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <CreditCardIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-gray-100">
                <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text">
                  $1M
                </span>{" "}
                Credit Limit
              </h3>
              <p className="text-gray-400 text-lg">
                Enjoy unprecedented spending power with our exclusive high-limit credit card.
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <ShieldCheckIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-gray-100">Secure & Private</h3>
              <p className="text-gray-400 text-lg">
                State-of-the-art security with blockchain technology and privacy-first design.
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.4 }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <ZapIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-gray-100">Instant Approval</h3>
              <p className="text-gray-400 text-lg">
                Get approved in seconds with our advanced blockchain verification system.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-neutral-950 py-32">
        <div className="container mx-auto px-6">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 font-bold text-5xl text-gray-100">Exclusive Benefits</h2>
            <p className="text-2xl text-gray-400">Unlock a world of premium privileges</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div
              className="rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-lg"
              {...fadeInUp}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <PlaneIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-gray-100">Premium Travel</h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-400 text-lg">
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Private jet access
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Luxury hotel upgrades
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    VIP airport lounges
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-lg"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <SparklesIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-gray-100">Concierge Services</h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-400 text-lg">
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    24/7 personal assistant
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Event planning
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Priority bookings
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-lg"
              {...fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/5 bg-gray-800">
                <GemIcon className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-gray-100">Lifestyle Access</h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-400 text-lg">
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Private chef services
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Personal styling
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="mr-3 h-5 w-5 text-gray-500" strokeWidth={1.5} />
                    Luxury shopping
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Limited Time Offer Section */}
      <section className="bg-gradient-to-br from-gray-950 to-black py-32">
        <div className="container mx-auto px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 font-bold text-5xl text-gray-100">Limited Time Offer</h2>
            <p className="text-2xl text-gray-400">Act now to secure your exclusive benefits</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-[400px] w-full">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 400 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Premium credit card illustration"
                >
                  <title>Premium credit card illustration</title>
                  {/* Card Background */}
                  <rect
                    x="20"
                    y="20"
                    width="360"
                    height="210"
                    rx="20"
                    fill="url(#cardGradient)"
                    stroke="url(#borderGradient)"
                    strokeWidth="2"
                  />

                  {/* Holographic Effect */}
                  <path
                    d="M20 20 L380 20 L380 230 L20 230 Z"
                    fill="url(#holographicGradient)"
                    opacity="0.2"
                  />

                  {/* Subtle Pattern */}
                  <pattern
                    id="cardPattern"
                    x="0"
                    y="0"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="10" cy="10" r="0.5" fill="white" fillOpacity="0.03" />
                    <circle cx="10" cy="10" r="1" fill="white" fillOpacity="0.01" />
                  </pattern>
                  <rect x="20" y="20" width="360" height="210" rx="20" fill="url(#cardPattern)" />

                  {/* Decorative Lines */}
                  <path
                    d="M40 60 L360 60"
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    opacity="0.2"
                  />
                  <path
                    d="M40 70 L360 70"
                    stroke="url(#lineGradient)"
                    strokeWidth="1"
                    opacity="0.1"
                  />

                  {/* Chip */}
                  <rect x="40" y="40" width="40" height="30" rx="4" fill="url(#chipGradient)" />
                  <rect x="45" y="45" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="55" y="45" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="45" y="55" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="55" y="55" width="5" height="5" rx="1" fill="#FFD700" />

                  {/* Magnetic Stripe */}
                  <rect x="40" y="90" width="320" height="20" rx="4" fill="#222" />
                  <rect x="45" y="95" width="310" height="10" rx="2" fill="#333" />
                  <rect x="50" y="98" width="300" height="4" rx="1" fill="#444" />

                  {/* Card Number */}
                  <text
                    x="40"
                    y="140"
                    fill="#fff"
                    fontSize="24"
                    fontFamily="monospace"
                    className="font-mono"
                    letterSpacing="2"
                  >
                    •••• •••• •••• 8888
                  </text>

                  {/* Card Holder */}
                  <text
                    x="40"
                    y="180"
                    fill="#fff"
                    fontSize="16"
                    className="font-medium"
                    letterSpacing="1"
                  >
                    CARD HOLDER NAME
                  </text>

                  {/* Expiry */}
                  <text
                    x="300"
                    y="180"
                    fill="#fff"
                    fontSize="16"
                    className="font-medium"
                    letterSpacing="1"
                  >
                    MM/YY
                  </text>

                  {/* Gradients */}
                  <defs>
                    <linearGradient
                      id="cardGradient"
                      x1="0"
                      y1="0"
                      x2="400"
                      y2="250"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#111111" />
                      <stop offset="50%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#111111" />
                    </linearGradient>
                    <linearGradient
                      id="borderGradient"
                      x1="0"
                      y1="0"
                      x2="400"
                      y2="250"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#B8860B" />
                      <stop offset="50%" stopColor="#DAA520" />
                      <stop offset="100%" stopColor="#B8860B" />
                    </linearGradient>
                    <linearGradient
                      id="chipGradient"
                      x1="0"
                      y1="0"
                      x2="40"
                      y2="30"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#FFA500" />
                    </linearGradient>
                    <linearGradient
                      id="holographicGradient"
                      x1="0"
                      y1="0"
                      x2="400"
                      y2="250"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                      <stop offset="50%" stopColor="#fff" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="360"
                      y2="0"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#FFD700" stopOpacity="0" />
                      <stop offset="50%" stopColor="#FFD700" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col justify-center space-y-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-xl bg-neutral-900 p-6 text-center">
                  <div className="font-bold text-4xl text-gray-100">
                    <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                      50K
                    </span>
                  </div>
                  <p className="mt-2 text-gray-400">Bonus Points</p>
                </div>
                <div className="rounded-xl bg-neutral-900 p-6 text-center">
                  <div className="font-bold text-4xl text-gray-100">
                    <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                      $500
                    </span>
                  </div>
                  <p className="mt-2 text-gray-400">Welcome Bonus</p>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-100 text-xl">Annual Fee</h3>
                    <p className="text-gray-400">First year waived</p>
                  </div>
                  <div className="rounded-full bg-green-500/20 px-4 py-2">
                    <span className="text-green-400">100% OFF</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-100 text-xl">Priority Access</h3>
                    <p className="text-gray-400">Lounge & concierge</p>
                  </div>
                  <div className="rounded-full bg-blue-500/20 px-4 py-2">
                    <span className="text-blue-400">VIP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-6 text-gray-400 text-xl">Offer ends in</p>
            <div className="flex justify-center space-x-8">
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-gray-100">{timeLeft.days}</span>
                <p className="text-gray-400 text-sm">Days</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-gray-100">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-400 text-sm">Hours</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-gray-100">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-400 text-sm">Minutes</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-gray-100">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-400 text-sm">Seconds</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-950 py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-8 font-bold text-5xl text-gray-100">
              Ready to Elevate Your Financial Journey?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-2xl text-gray-400">
              Join ACME Bank today and unlock a world of possibilities with our premium
              <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text font-bold text-transparent">
                {" "}
                $1,000,000
              </span>{" "}
              credit card.
            </p>
            <Button color="primary" size="lg">
              Apply now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
