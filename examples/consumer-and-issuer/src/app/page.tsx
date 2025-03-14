"use client";

import { GetStartedButton } from "@/components/get-started-button";
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
import { useAccount } from "wagmi";

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
    <div className="min-h-screen w-full bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-neutral-50 dark:from-gray-950 dark:via-neutral-900 dark:to-black" />
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
              initial={{ color: "#000000" }}
              animate={{ color: "#1f2937" }}
              transition={{ duration: 1, delay: 0.3 }}
              className="dark:text-gray-400"
            >
              <CommandIcon className="h-24 w-24" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
          <h1 className="mb-8 font-bold text-5xl text-black md:text-7xl dark:text-gray-100">
            Join NeoBank
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-gray-800 text-xl md:text-2xl dark:text-gray-400">
            Experience the future of banking with our revolutionary digital credit card and
            exclusive benefits worth over{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent dark:from-amber-200 dark:to-yellow-400">
              $1,000,000
            </span>
          </p>
          <GetStartedButton title="Get started now" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-32 dark:bg-neutral-950">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <motion.div className="text-center" {...fadeInUp}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-gray-100 bg-white dark:border-white/5 dark:bg-gray-800">
                <CreditCardIcon
                  className="h-12 w-12 text-black dark:text-gray-300"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-black dark:text-gray-100">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent dark:from-amber-200 dark:to-yellow-400">
                  $1M
                </span>{" "}
                Credit Limit
              </h3>
              <p className="text-gray-800 text-lg dark:text-gray-400">
                Enjoy unprecedented spending power with our exclusive high-limit credit card.
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-white/5 dark:bg-gray-800">
                <ShieldCheckIcon
                  className="h-12 w-12 text-gray-600 dark:text-gray-300"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-gray-900 dark:text-gray-100">
                Secure & Private
              </h3>
              <p className="text-gray-600 text-lg dark:text-gray-400">
                State-of-the-art security with blockchain technology and privacy-first design.
              </p>
            </motion.div>

            <motion.div className="text-center" {...fadeInUp} transition={{ delay: 0.4 }}>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-white/5 dark:bg-gray-800">
                <ZapIcon className="h-12 w-12 text-gray-600 dark:text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 font-semibold text-2xl text-gray-900 dark:text-gray-100">
                Instant Approval
              </h3>
              <p className="text-gray-600 text-lg dark:text-gray-400">
                Get approved in seconds with our advanced blockchain verification system.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-white py-32 dark:bg-neutral-950">
        <div className="container mx-auto px-6">
          <motion.div
            className="mb-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 font-bold text-5xl text-black dark:text-gray-100">
              Exclusive Benefits
            </h2>
            <p className="text-2xl text-gray-800 dark:text-gray-400">
              Unlock a world of premium privileges
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <motion.div
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-neutral-900"
              {...fadeInUp}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-white dark:border-white/5 dark:bg-gray-800">
                <PlaneIcon className="h-12 w-12 text-black dark:text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-black dark:text-gray-100">
                Premium Travel
              </h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-800 text-lg dark:text-gray-400">
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Private jet access
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Luxury hotel upgrades
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    VIP airport lounges
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-neutral-900"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-white dark:border-white/5 dark:bg-gray-800">
                <SparklesIcon
                  className="h-12 w-12 text-black dark:text-gray-300"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-black dark:text-gray-100">
                Concierge Services
              </h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-800 text-lg dark:text-gray-400">
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    24/7 personal assistant
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Event planning
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Priority bookings
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-neutral-900"
              {...fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-100 bg-white dark:border-white/5 dark:bg-gray-800">
                <GemIcon className="h-12 w-12 text-black dark:text-gray-300" strokeWidth={1.5} />
              </div>
              <h3 className="mb-6 font-semibold text-2xl text-black dark:text-gray-100">
                Lifestyle Access
              </h3>
              <div className="flex justify-center">
                <ul className="space-y-4 text-gray-800 text-lg dark:text-gray-400">
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Private chef services
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Personal styling
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon
                      className="mr-3 h-5 w-5 text-yellow-500 dark:text-yellow-400"
                      strokeWidth={1.5}
                    />
                    Luxury shopping
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Limited Time Offer Section */}
      <section className="bg-neutral-100 py-32 dark:bg-neutral-950">
        <div className="container mx-auto px-6">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 font-bold text-5xl text-black dark:text-gray-100">
              Limited Time Offer
            </h2>
            <p className="text-2xl text-gray-800 dark:text-gray-400">
              Act now to secure your exclusive benefits
            </p>
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
                    className="fill-white stroke-gray-200 dark:fill-neutral-900 dark:stroke-white/10"
                    strokeWidth="2"
                  />

                  {/* Holographic Effect */}
                  <path
                    d="M20 20 L380 20 L380 230 L20 230 Z"
                    fill="url(#holographicGradient)"
                    opacity="0.1"
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
                    <circle
                      cx="10"
                      cy="10"
                      r="0.5"
                      fill="black"
                      fillOpacity="0.03"
                      className="dark:fill-white"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="1"
                      fill="black"
                      fillOpacity="0.01"
                      className="dark:fill-white"
                    />
                  </pattern>
                  <rect x="20" y="20" width="360" height="210" rx="20" fill="url(#cardPattern)" />

                  {/* Chip */}
                  <rect x="40" y="40" width="40" height="30" rx="4" fill="url(#chipGradient)" />
                  <rect x="45" y="45" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="55" y="45" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="45" y="55" width="5" height="5" rx="1" fill="#FFD700" />
                  <rect x="55" y="55" width="5" height="5" rx="1" fill="#FFD700" />

                  {/* Card Number */}
                  <text
                    x="40"
                    y="140"
                    // biome-ignore lint/nursery/useSortedClasses: <explanation>
                    className="fill-black dark:fill-white font-mono"
                    fontSize="24"
                    letterSpacing="2"
                  >
                    •••• •••• •••• 8888
                  </text>

                  {/* Card Holder */}
                  <text
                    x="40"
                    y="180"
                    className="fill-black font-medium dark:fill-white"
                    fontSize="16"
                    letterSpacing="1"
                  >
                    CARD HOLDER NAME
                  </text>

                  {/* Expiry */}
                  <text
                    x="300"
                    y="180"
                    // biome-ignore lint/nursery/useSortedClasses: <explanation>
                    className="fill-black dark:fill-white font-medium"
                    fontSize="16"
                    letterSpacing="1"
                  >
                    MM/YY
                  </text>

                  {/* Gradients */}
                  <defs>
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
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                      <stop offset="50%" stopColor="currentColor" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
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
                <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-lg dark:border-white/10 dark:bg-neutral-900">
                  <div className="font-bold text-4xl text-black dark:text-gray-100">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent dark:from-amber-200 dark:to-yellow-400">
                      50K
                    </span>
                  </div>
                  <p className="mt-2 text-gray-800 dark:text-gray-400">Bonus Points</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-lg dark:border-white/10 dark:bg-neutral-900">
                  <div className="font-bold text-4xl text-black dark:text-gray-100">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent dark:from-amber-200 dark:to-yellow-400">
                      $500
                    </span>
                  </div>
                  <p className="mt-2 text-gray-800 dark:text-gray-400">Welcome Bonus</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-black text-xl dark:text-gray-100">
                      Annual Fee
                    </h3>
                    <p className="text-gray-800 dark:text-gray-400">First year waived</p>
                  </div>
                  <div className="rounded-full bg-green-100 px-4 py-2 dark:bg-green-500/20">
                    <span className="text-green-600 dark:text-green-400">100% OFF</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-black text-xl dark:text-gray-100">
                      Priority Access
                    </h3>
                    <p className="text-gray-800 dark:text-gray-400">Lounge & concierge</p>
                  </div>
                  <div className="rounded-full bg-yellow-100 px-4 py-2 dark:bg-yellow-500/20">
                    <span className="text-yellow-600 dark:text-yellow-400">VIP</span>
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
            <p className="mb-6 text-gray-800 text-xl dark:text-gray-400">Offer ends in</p>
            <div className="flex justify-center space-x-8">
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-black dark:text-gray-100">
                  {timeLeft.days}
                </span>
                <p className="text-gray-800 text-sm dark:text-gray-400">Days</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-black dark:text-gray-100">
                  {timeLeft.hours.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-800 text-sm dark:text-gray-400">Hours</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-black dark:text-gray-100">
                  {timeLeft.minutes.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-800 text-sm dark:text-gray-400">Minutes</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-4xl text-black dark:text-gray-100">
                  {timeLeft.seconds.toString().padStart(2, "0")}
                </span>
                <p className="text-gray-800 text-sm dark:text-gray-400">Seconds</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-32 dark:bg-neutral-950">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-8 font-bold text-5xl text-black dark:text-gray-100">
              Ready to Elevate Your Financial Journey?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-2xl text-gray-800 dark:text-gray-400">
              Join NeoBank today and unlock a world of possibilities with our premium
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text font-bold text-transparent dark:from-amber-200 dark:to-yellow-400">
                {" "}
                $1,000,000
              </span>{" "}
              credit card.
            </p>
            <GetStartedButton title="Apply now" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
