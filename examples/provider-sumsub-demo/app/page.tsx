"use client";

import { Suspense } from "react";
import Loader from "./components/loader";
import InitScreen from "./steps/init";

export default function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <InitScreen />
    </Suspense>
  );
}
