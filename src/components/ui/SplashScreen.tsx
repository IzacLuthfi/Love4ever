// src/components/ui/SplashScreen.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import styles from "./SplashScreen.module.css";

type SnowFlake = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
};

const snowFlakes: SnowFlake[] = Array.from(
  { length: 85 },
  (_, index) => ({
    id: index,
    left: (index * 37) % 100,
    delay: -((index * 13) % 40) / 10,
    duration: 5 + ((index * 11) % 40) / 10,
    size: 3 + ((index * 17) % 8),
    opacity: 0.35 + ((index * 7) % 45) / 100,
    drift: -35 + ((index * 19) % 70),
  })
);

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace("/login");
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className={styles.splash}>
      <div className={styles.background} />

      <div className={styles.overlay} />

      <div
        className={styles.snow}
        aria-hidden="true"
      >
        {snowFlakes.map((flake) => (
          <span
            key={flake.id}
            className={styles.snowFlake}
            style={
              {
                left: `${flake.left}%`,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                opacity: flake.opacity,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
                "--drift": `${flake.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>
          Love4ever
        </h1>

        <div
          className={styles.loadingTrack}
          aria-hidden="true"
        >
          <div className={styles.loadingBar} />
        </div>
      </div>
    </main>
  );
}