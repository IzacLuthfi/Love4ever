// src/components/dashboard/DashboardClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import DailyRatingTracker from "@/components/dashboard/DailyRatingTracker";

import {
  type ElementType,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Heart,
  Images,
  MapPin,
  NotebookPen,
  Plus,
  Sparkles,
} from "lucide-react";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type DashboardUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type DashboardCouple = {
  name: string;

  anniversaryDate: string;
};

type DashboardStats = {
  totalPlans: number;

  plannedPlans: number;

  donePlans: number;

  totalMemories: number;

  totalPhotos: number;
};

type NextPlan = {
  id: string;

  title: string;

  planDate: string;

  planTime:
    | string
    | null;

  locationName:
    | string
    | null;

  coverUrl:
    | string
    | null;
};

type LatestMemory = {
  id: string;

  title: string;

  story:
    | string
    | null;

  memoryDate: string;

  memoryTime:
    | string
    | null;

  locationName:
    | string
    | null;

  coverUrl:
    | string
    | null;

  photoCount: number;
};

type DashboardClientProps = {
  user: DashboardUser;

  couple: DashboardCouple;

  stats: DashboardStats;

  nextPlan:
    | NextPlan
    | null;

  latestMemory:
    | LatestMemory
    | null;
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function DashboardClient({
  user,
  couple,
  stats,
  nextPlan,
  latestMemory,
}: DashboardClientProps) {
  const [
    greeting,
    setGreeting,
  ] =
    useState("Hello");

  /*
   * =========================================================
   * GREETING
   * =========================================================
   */

  useEffect(() => {
    const hour =
      new Date().getHours();

    if (hour < 11) {
      setGreeting(
        "Good morning"
      );

      return;
    }

    if (hour < 15) {
      setGreeting(
        "Good afternoon"
      );

      return;
    }

    if (hour < 19) {
      setGreeting(
        "Good evening"
      );

      return;
    }

    setGreeting(
      "Good night"
    );
  }, []);

  /*
   * =========================================================
   * DAYS TOGETHER
   * =========================================================
   */

  const daysTogether =
    useMemo(
      () =>
        calculateDaysTogether(
          couple.anniversaryDate
        ),
      [
        couple.anniversaryDate,
      ]
    );

  /*
   * =========================================================
   * PLAN PROGRESS
   * =========================================================
   */

  const completionRate =
    stats.totalPlans > 0
      ? Math.round(
          (
            stats.donePlans /
            stats.totalPlans
          ) *
            100
        )
      : 0;

  return (
    <div
      className="
        min-h-[100svh]
        bg-[radial-gradient(circle_at_10%_0%,rgba(103,197,226,0.22),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(244,219,184,0.32),transparent_28%),linear-gradient(145deg,#f5fbfe_0%,#fffdf8_48%,#f7efe5_100%)]
      "
    >
      <AppSidebar
        user={user}
      />

      <MobileBottomNav />

      <main
        className="
          min-h-[100svh]
          px-4
          pb-28
          pt-5
          sm:px-6
          lg:ml-[290px]
          lg:px-7
          lg:pb-8
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
          "
        >
          {/* =====================================
              HEADER
          ====================================== */}

          <header
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.22em]
                  text-ocean-500
                "
              >
                Love4ever
              </p>

              <h1
                className="
                  mt-1
                  font-display
                  text-3xl
                  font-semibold
                  text-ocean-950
                  sm:text-4xl
                "
              >
                {greeting},{" "}
                {user.nickname}
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  text-ink-soft
                "
              >
                Here&apos;s what&apos;s
                happening in{" "}
                {couple.name}.
              </p>
            </div>

            <div
              className="
                flex
                gap-2
              "
            >
              <Link
                href="/planner"
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  border
                  border-ocean-100
                  bg-white/70
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  text-ocean-700
                  backdrop-blur-xl
                  transition
                  hover:bg-white
                "
              >
                <CalendarDays
                  size={16}
                />

                Planner
              </Link>

              <Link
                href="/memories"
                className="
                  love-button
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  px-4
                  py-3
                  text-xs
                  font-semibold
                "
              >
                <Heart
                  size={16}
                />

                Memories
              </Link>
            </div>
          </header>

          {/* =====================================
              HERO
          ====================================== */}

          <section
            className="
              relative
              mt-7
              overflow-hidden
              rounded-[32px]
              bg-gradient-to-br
              from-ocean-950
              via-ocean-800
              to-ocean-500
              p-6
              text-white
              shadow-love-lg
              sm:p-8
              lg:p-10
            "
          >
            <div
              className="
                absolute
                -right-24
                -top-28
                h-80
                w-80
                rounded-full
                bg-white/[0.08]
                blur-3xl
              "
            />

            <div
              className="
                absolute
                -bottom-32
                left-[30%]
                h-72
                w-72
                rounded-full
                bg-ocean-200/10
                blur-3xl
              "
            />

            <div
              className="
                relative
                z-10
                grid
                gap-8
                lg:grid-cols-[1fr_auto]
                lg:items-center
              "
            >
              <div>
                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-[17px]
                    border
                    border-white/15
                    bg-white/10
                    backdrop-blur-xl
                  "
                >
                  <Heart
                    size={21}
                  />
                </div>

                <p
                  className="
                    mt-6
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.25em]
                    text-white/55
                  "
                >
                  Since{" "}
                  {formatDate(
                    couple.anniversaryDate
                  )}
                </p>

                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    items-end
                    gap-x-3
                    gap-y-1
                  "
                >
                  <p
                    className="
                      font-display
                      text-6xl
                      font-semibold
                      leading-none
                      sm:text-7xl
                    "
                  >
                    {daysTogether}
                  </p>

                  <p
                    className="
                      pb-1
                      font-display
                      text-2xl
                      text-white/70
                    "
                  >
                    days together
                  </p>
                </div>

                <p
                  className="
                    mt-5
                    max-w-xl
                    text-sm
                    leading-7
                    text-white/60
                  "
                >
                  Plans, places,
                  photos, and memories
                  stored in one shared
                  space.
                </p>
              </div>

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2
                  sm:grid-cols-4
                  lg:grid-cols-2
                "
              >
                <HeroStat
                  value={
                    stats.totalPlans
                  }
                  label="Plans"
                />

                <HeroStat
                  value={
                    stats.donePlans
                  }
                  label="Done"
                />

                <HeroStat
                  value={
                    stats.totalMemories
                  }
                  label="Memories"
                />

                <HeroStat
                  value={
                    stats.totalPhotos
                  }
                  label="Photos"
                />
              </div>
            </div>
          </section>
          
          <div className="mt-6">
    <DailyRatingTracker />
  </div>

          {/* =====================================
              MAIN GRID
          ====================================== */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1.15fr_0.85fr]
            "
          >
            {/* =====================================
                NEXT PLAN
            ====================================== */}

            <article
              className="
                glass-card
                overflow-hidden
                rounded-[30px]
              "
            >
              {nextPlan ? (
                <div
                  className="
                    grid
                    h-full
                    md:grid-cols-[0.95fr_1.05fr]
                  "
                >
                  {/* PLAN COVER */}

                  <div
                    className="
                      relative
                      min-h-[280px]
                      overflow-hidden
                      bg-gradient-to-br
                      from-ocean-900
                      via-ocean-700
                      to-ocean-400
                    "
                  >
                    {nextPlan.coverUrl ? (
                      <>
                        <Image
                          src={
                            nextPlan.coverUrl
                          }
                          alt={
                            nextPlan.title
                          }
                          fill
                          unoptimized
                          className="
                            object-cover
                          "
                        />

                        <div
                          className="
                            absolute
                            inset-0
                            bg-gradient-to-t
                            from-ocean-950/80
                            via-transparent
                            to-transparent
                          "
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="
                            absolute
                            inset-0
                            bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,.14),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(158,223,240,.25),transparent_36%)]
                          "
                        />

                        <CalendarDays
                          size={140}
                          className="
                            absolute
                            -right-6
                            -top-5
                            text-white/[0.05]
                          "
                        />
                      </>
                    )}

                    <div
                      className="
                        absolute
                        bottom-5
                        left-5
                        z-10
                      "
                    >
                      <span
                        className="
                          rounded-full
                          border
                          border-white/20
                          bg-black/20
                          px-3
                          py-1.5
                          text-[9px]
                          font-bold
                          uppercase
                          tracking-[0.15em]
                          text-white
                          backdrop-blur-xl
                        "
                      >
                        Next Plan
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div
                    className="
                      flex
                      flex-col
                      p-6
                      sm:p-7
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.2em]
                          text-ocean-500
                        "
                      >
                        Upcoming
                      </p>

                      <h2
                        className="
                          mt-2
                          font-display
                          text-3xl
                          font-semibold
                          text-ocean-950
                        "
                      >
                        {nextPlan.title}
                      </h2>

                      <div
                        className="
                          mt-5
                          space-y-3
                        "
                      >
                        <InfoRow
                          icon={
                            CalendarDays
                          }
                        >
                          {formatDate(
                            nextPlan.planDate
                          )}
                        </InfoRow>

                        {nextPlan.planTime && (
                          <InfoRow
                            icon={
                              Clock3
                            }
                          >
                            {formatTime(
                              nextPlan.planTime
                            )}
                          </InfoRow>
                        )}

                        {nextPlan.locationName && (
                          <InfoRow
                            icon={
                              MapPin
                            }
                          >
                            {
                              nextPlan.locationName
                            }
                          </InfoRow>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/planner/${nextPlan.id}`}
                      className="
                        mt-auto
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-[15px]
                        bg-ocean-700
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-ocean-800
                      "
                    >
                      Open Plan

                      <ArrowRight
                        size={15}
                      />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyNextPlan />
              )}
            </article>

            {/* =====================================
                PLAN PROGRESS
            ====================================== */}

            <article
              className="
                glass-card
                rounded-[30px]
                p-6
                sm:p-7
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >
                <div>
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.2em]
                      text-ocean-500
                    "
                  >
                    Planner
                  </p>

                  <h2
                    className="
                      mt-1
                      font-display
                      text-2xl
                      font-semibold
                      text-ocean-950
                    "
                  >
                    Plan Progress
                  </h2>
                </div>

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-[15px]
                    bg-ocean-100
                    text-ocean-700
                  "
                >
                  <CheckCircle2
                    size={20}
                  />
                </div>
              </div>

              <div
                className="
                  mt-8
                  flex
                  items-end
                  gap-2
                "
              >
                <p
                  className="
                    font-display
                    text-5xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  {completionRate}%
                </p>

                <p
                  className="
                    pb-1
                    text-xs
                    text-ink-soft
                  "
                >
                  completed
                </p>
              </div>

              <div
                className="
                  mt-5
                  h-2.5
                  overflow-hidden
                  rounded-full
                  bg-ocean-50
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-gradient-to-r
                    from-ocean-800
                    via-ocean-500
                    to-ocean-300
                    transition-all
                    duration-500
                  "
                  style={{
                    width:
                      `${completionRate}%`,
                  }}
                />
              </div>

              <div
                className="
                  mt-6
                  grid
                  grid-cols-3
                  gap-2
                "
              >
                <MiniStat
                  value={
                    stats.totalPlans
                  }
                  label="Total"
                />

                <MiniStat
                  value={
                    stats.plannedPlans
                  }
                  label="Planned"
                />

                <MiniStat
                  value={
                    stats.donePlans
                  }
                  label="Done"
                />
              </div>

              <Link
                href="/planner"
                className="
                  mt-6
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  border
                  border-ocean-100
                  bg-white/70
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-ocean-700
                  transition
                  hover:bg-white
                "
              >
                View Planner

                <ArrowRight
                  size={15}
                />
              </Link>
            </article>
          </section>

          {/* =====================================
              SECOND GRID
          ====================================== */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1.25fr_0.75fr]
            "
          >
            {/* =====================================
                LATEST MEMORY
            ====================================== */}

            <article
              className="
                glass-card
                overflow-hidden
                rounded-[30px]
              "
            >
              {latestMemory ? (
                <div
                  className="
                    grid
                    h-full
                    md:grid-cols-[300px_1fr]
                  "
                >
                  <div
                    className="
                      relative
                      min-h-[280px]
                      overflow-hidden
                      bg-gradient-to-br
                      from-ocean-800
                      via-ocean-600
                      to-ocean-300
                    "
                  >
                    {latestMemory.coverUrl ? (
                      <>
                        <Image
                          src={
                            latestMemory.coverUrl
                          }
                          alt={
                            latestMemory.title
                          }
                          fill
                          unoptimized
                          className="
                            object-cover
                          "
                        />

                        <div
                          className="
                            absolute
                            inset-0
                            bg-gradient-to-t
                            from-ocean-950/85
                            via-transparent
                            to-transparent
                          "
                        />
                      </>
                    ) : (
                      <>
                        <Heart
                          size={150}
                          fill="currentColor"
                          className="
                            absolute
                            -right-5
                            -top-6
                            text-white/[0.05]
                          "
                        />
                      </>
                    )}

                    {latestMemory.photoCount >
                      0 && (
                      <div
                        className="
                          absolute
                          left-4
                          top-4
                          z-10
                          flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-white/20
                          bg-black/20
                          px-3
                          py-1.5
                          text-[10px]
                          font-semibold
                          text-white
                          backdrop-blur-xl
                        "
                      >
                        <Camera
                          size={12}
                        />

                        {
                          latestMemory.photoCount
                        }{" "}
                        {latestMemory.photoCount ===
                        1
                          ? "photo"
                          : "photos"}
                      </div>
                    )}
                  </div>

                  <div
                    className="
                      flex
                      flex-col
                      p-6
                      sm:p-7
                    "
                  >
                    <div>
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-[0.2em]
                          text-ocean-500
                        "
                      >
                        <Sparkles
                          size={13}
                        />

                        Latest Memory
                      </div>

                      <h2
                        className="
                          mt-3
                          font-display
                          text-3xl
                          font-semibold
                          text-ocean-950
                        "
                      >
                        {
                          latestMemory.title
                        }
                      </h2>

                      <div
                        className="
                          mt-3
                          flex
                          flex-wrap
                          gap-3
                          text-xs
                          text-ink-soft
                        "
                      >
                        <span>
                          {formatDate(
                            latestMemory.memoryDate
                          )}
                        </span>

                        {latestMemory.locationName && (
                          <span
                            className="
                              flex
                              items-center
                              gap-1
                            "
                          >
                            <MapPin
                              size={12}
                            />

                            {
                              latestMemory.locationName
                            }
                          </span>
                        )}
                      </div>

                      <p
                        className="
                          mt-5
                          line-clamp-4
                          whitespace-pre-line
                          text-sm
                          leading-7
                          text-ink-soft
                        "
                      >
                        {latestMemory.story ||
                          "Belum ada cerita untuk memory ini."}
                      </p>
                    </div>

                    <Link
                      href={`/memories/${latestMemory.id}`}
                      className="
                        mt-auto
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-[15px]
                        bg-ocean-700
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-ocean-800
                      "
                    >
                      View Memory

                      <ArrowRight
                        size={15}
                      />
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyLatestMemory />
              )}
            </article>

            {/* =====================================
                COLLECTION
            ====================================== */}

            <article
              className="
                glass-card
                rounded-[30px]
                p-6
                sm:p-7
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-[15px]
                  bg-ocean-100
                  text-ocean-700
                "
              >
                <Images
                  size={20}
                />
              </div>

              <p
                className="
                  mt-6
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-ocean-500
                "
              >
                Collection
              </p>

              <h2
                className="
                  mt-1
                  font-display
                  text-2xl
                  font-semibold
                  text-ocean-950
                "
              >
                Memory Library
              </h2>

              <div
                className="
                  mt-6
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <CollectionStat
                  icon={
                    Heart
                  }
                  value={
                    stats.totalMemories
                  }
                  label="Memories"
                />

                <CollectionStat
                  icon={
                    Camera
                  }
                  value={
                    stats.totalPhotos
                  }
                  label="Photos"
                />
              </div>

              <Link
                href="/memories"
                className="
                  mt-6
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-[15px]
                  border
                  border-ocean-100
                  bg-white/70
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-ocean-700
                  transition
                  hover:bg-white
                "
              >
                Open Memories

                <ArrowRight
                  size={15}
                />
              </Link>
            </article>
          </section>

          {/* =====================================
              QUICK ACTIONS
          ====================================== */}

          <section
            className="
              mt-5
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <QuickAction
              href="/planner"
              icon={
                CalendarDays
              }
              title="Create a Plan"
              description="Add a new date, trip, or activity."
            />

            <QuickAction
              href="/memories"
              icon={
                NotebookPen
              }
              title="Add a Memory"
              description="Save a story, place, and photos."
            />
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * HERO STAT
 * =========================================================
 */

function HeroStat({
  value,
  label,
}: {
  value: number;

  label: string;
}) {
  return (
    <div
      className="
        min-w-[105px]
        rounded-[20px]
        border
        border-white/15
        bg-white/[0.08]
        p-4
        backdrop-blur-xl
      "
    >
      <p
        className="
          font-display
          text-3xl
          font-semibold
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-[9px]
          font-bold
          uppercase
          tracking-[0.14em]
          text-white/50
        "
      >
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * INFO ROW
 * =========================================================
 */

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
        text-sm
        text-ink-soft
      "
    >
      <Icon
        size={16}
        className="
          mt-0.5
          shrink-0
          text-ocean-500
        "
      />

      <span>
        {children}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * MINI STAT
 * =========================================================
 */

function MiniStat({
  value,
  label,
}: {
  value: number;

  label: string;
}) {
  return (
    <div
      className="
        rounded-[17px]
        bg-ocean-50/75
        px-3
        py-4
        text-center
      "
    >
      <p
        className="
          font-display
          text-2xl
          font-semibold
          text-ocean-950
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-[9px]
          font-bold
          uppercase
          tracking-[0.1em]
          text-ink-soft
        "
      >
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * COLLECTION STAT
 * =========================================================
 */

function CollectionStat({
  icon: Icon,
  value,
  label,
}: {
  icon: ElementType;

  value: number;

  label: string;
}) {
  return (
    <div
      className="
        rounded-[20px]
        border
        border-ocean-100
        bg-ocean-50/60
        p-4
      "
    >
      <Icon
        size={17}
        className="
          text-ocean-600
        "
      />

      <p
        className="
          mt-4
          font-display
          text-3xl
          font-semibold
          text-ocean-950
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          text-[10px]
          font-semibold
          text-ink-soft
        "
      >
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * QUICK ACTION
 * =========================================================
 */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;

  icon: ElementType;

  title: string;

  description: string;
}) {
  return (
    <Link
      href={href}
      className="
        glass-card
        group
        flex
        items-center
        gap-4
        rounded-[24px]
        p-5
        transition
        hover:-translate-y-0.5
        hover:shadow-love
      "
    >
      <div
        className="
          flex
          h-12
          w-12
          shrink-0
          items-center
          justify-center
          rounded-[16px]
          bg-ocean-100
          text-ocean-700
          transition
          group-hover:bg-ocean-700
          group-hover:text-white
        "
      >
        <Icon
          size={20}
        />
      </div>

      <div
        className="
          min-w-0
          flex-1
        "
      >
        <p
          className="
            font-semibold
            text-ocean-950
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-xs
            text-ink-soft
          "
        >
          {description}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="
          shrink-0
          text-ocean-400
          transition
          group-hover:translate-x-1
          group-hover:text-ocean-700
        "
      />
    </Link>
  );
}

/*
 * =========================================================
 * EMPTY NEXT PLAN
 * =========================================================
 */

function EmptyNextPlan() {
  return (
    <div
      className="
        flex
        min-h-[320px]
        flex-col
        items-center
        justify-center
        px-6
        py-12
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-[19px]
          bg-ocean-100
          text-ocean-600
        "
      >
        <CalendarDays
          size={24}
        />
      </div>

      <h2
        className="
          mt-5
          font-display
          text-2xl
          font-semibold
          text-ocean-950
        "
      >
        No upcoming plan
      </h2>

      <p
        className="
          mt-2
          max-w-sm
          text-sm
          leading-6
          text-ink-soft
        "
      >
        Belum ada plan mendatang
        yang berstatus Planned.
      </p>

      <Link
        href="/planner"
        className="
          love-button
          mt-6
          flex
          items-center
          gap-2
          rounded-[15px]
          px-4
          py-3
          text-sm
          font-semibold
        "
      >
        <Plus
          size={16}
        />

        Add Plan
      </Link>
    </div>
  );
}

/*
 * =========================================================
 * EMPTY MEMORY
 * =========================================================
 */

function EmptyLatestMemory() {
  return (
    <div
      className="
        flex
        min-h-[320px]
        flex-col
        items-center
        justify-center
        px-6
        py-12
        text-center
      "
    >
      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-[19px]
          bg-ocean-100
          text-ocean-600
        "
      >
        <Heart
          size={24}
        />
      </div>

      <h2
        className="
          mt-5
          font-display
          text-2xl
          font-semibold
          text-ocean-950
        "
      >
        No memories yet
      </h2>

      <p
        className="
          mt-2
          max-w-sm
          text-sm
          leading-6
          text-ink-soft
        "
      >
        Memory terbaru akan
        muncul di sini setelah
        ditambahkan.
      </p>

      <Link
        href="/memories"
        className="
          mt-6
          flex
          items-center
          gap-2
          rounded-[15px]
          bg-ocean-700
          px-4
          py-3
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-ocean-800
        "
      >
        Open Memories

        <ArrowRight
          size={15}
        />
      </Link>
    </div>
  );
}

/*
 * =========================================================
 * DAYS TOGETHER
 * =========================================================
 */

function calculateDaysTogether(
  anniversaryDate: string
) {
  const [
    year,
    month,
    day,
  ] =
    anniversaryDate
      .split("-")
      .map(Number);

  const anniversary =
    Date.UTC(
      year,
      month - 1,
      day
    );

  const now =
    new Date();

  const today =
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  const difference =
    today -
    anniversary;

  return Math.max(
    0,
    Math.floor(
      difference /
        (
          1000 *
          60 *
          60 *
          24
        )
    )
  );
}

/*
 * =========================================================
 * FORMAT DATE
 * =========================================================
 */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

/*
 * =========================================================
 * FORMAT TIME
 * =========================================================
 */

function formatTime(
  value: string
) {
  return value.slice(
    0,
    5
  );
}