"use client";

import { Suspense } from "react";
import Loader from "./components/Loader";
import InitScreen from "./steps/init";

export default function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <InitScreen />
    </Suspense>
  );
}
