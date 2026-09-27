// src/components/dashboard/DashboardClient.tsx



"use client";



import Image from "next/image";

import Link from "next/link";



import {

  type ReactNode,

  useEffect,

  useMemo,

  useState,

} from "react";



import {

  ArrowRight,

} from "lucide-react";



import DailyRatingTracker from "@/components/dashboard/DailyRatingTracker";

import AppSidebar from "@/components/layout/AppSidebar";

import MobileBottomNav from "@/components/layout/MobileBottomNav";



import {

  differenceInDays,

  formatDateID,

  formatTime,

  getCurrentTimeInJakarta,

  getTodayInJakarta,

} from "@/utils/date";



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

  avatarUrl: string | null;

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

  planTime: string | null;

  locationName: string | null;

  coverUrl: string | null;

};



type LatestMemory = {

  id: string;

  title: string;

  story: string | null;

  memoryDate: string;

  memoryTime: string | null;

  locationName: string | null;

  coverUrl: string | null;

  photoCount: number;

};



type DashboardClientProps = {

  user: DashboardUser;

  couple: DashboardCouple;

  stats: DashboardStats;

  nextPlan: NextPlan | null;

  latestMemory: LatestMemory | null;

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

  ] = useState("");



  /*

   * =========================================================

   * GREETING

   * =========================================================

   */



  useEffect(() => {

    const time =

      getCurrentTimeInJakarta();



    const hour =

      Number(

        time.slice(

          0,

          2

        )

      );



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

   * DATA

   * =========================================================

   */



  const today =

    getTodayInJakarta();



  const displayName =

    user.nickname?.trim() ||

    user.fullName?.trim() ||

    "You";



  const greetingMessages =

    useMemo(

      () =>

        greeting

          ? [

              `${greeting}, ${displayName}`,

              "Still my favorite person.",

              "Home feels better with you.",

              "Always you. Always us.",

            ]

          : [],

      [

        greeting,

        displayName,

      ]

    );



  const daysTogether =

    Math.max(

      0,

      differenceInDays(

        couple.anniversaryDate,

        today

      )

    );



  const completionRate =

    stats.totalPlans > 0

      ? Math.round(

          (

            stats.donePlans /

            stats.totalPlans

          ) * 100

        )

      : 0;



  const anniversary =

    useMemo(

      () =>

        getAnniversaryMeta(

          couple.anniversaryDate,

          today

        ),

      [

        couple.anniversaryDate,

        today,

      ]

    );



  /*

   * =========================================================

   * UI

   * =========================================================

   */



  return (

    <div

      className="

        min-h-[100svh]

        bg-[linear-gradient(145deg,#f5fbfd_0%,#fffdf9_50%,#f8f2e9_100%)]

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

          pt-6

          sm:px-6

          lg:ml-[290px]

          lg:px-8

          lg:pb-14

          lg:pt-9

          xl:px-10

        "

      >

        <div

          className="

            mx-auto

            w-full

            max-w-[1440px]

          "

        >

          {/* =================================================

              HEADER

          ================================================= */}



          <header

            className="

              flex

              items-end

              justify-between

              gap-6

            "

          >

            <h1

              className="

                min-h-[40px]

                font-display

                text-[32px]

                font-semibold

                leading-none

                tracking-[-0.035em]

                text-ocean-950

                sm:min-h-[48px]

                sm:text-[40px]

              "

            >

              <RotatingTypewriter

                messages={

                  greetingMessages

                }

              />

            </h1>



            <p

              className="

                hidden

                pb-0.5

                text-xs

                text-ink-soft

                sm:block

              "

            >

              {formatDateID(

                today

              )}

            </p>

          </header>



          {/* =================================================

              RELATIONSHIP HERO

          ================================================= */}



          <section

            className="

              relative

              mt-8

              overflow-hidden

              rounded-[32px]

              bg-ocean-950

              text-white

              shadow-[0_24px_65px_rgba(6,42,63,0.12)]

            "

          >

            {/* subtle light */}



            <div

              className="

                pointer-events-none

                absolute

                -right-32

                -top-40

                h-[420px]

                w-[420px]

                rounded-full

                bg-ocean-400/[0.12]

                blur-[100px]

              "

            />



            <div

              className="

                pointer-events-none

                absolute

                -bottom-40

                left-[22%]

                h-[340px]

                w-[340px]

                rounded-full

                bg-white/[0.05]

                blur-[100px]

              "

            />



            <div

              className="

                relative

                z-10

                grid

                lg:grid-cols-[1fr_500px]

              "

            >

              {/* HERO MAIN */}



              <div

                className="

                  px-6

                  py-8

                  sm:px-9

                  sm:py-10

                  lg:px-11

                  lg:py-12

                "

              >

                <p

                  className="

                    text-xs

                    font-medium

                    tracking-wide

                    text-white/42

                  "

                >

                  {couple.name}

                </p>



                <div

                  className="

                    mt-5

                    flex

                    items-end

                    gap-3

                  "

                >

                  <p

                    className="

                      font-display

                      text-[64px]

                      font-semibold

                      leading-[0.85]

                      tracking-[-0.055em]

                      sm:text-[82px]

                    "

                  >

                    {daysTogether}

                  </p>



                  <p

                    className="

                      pb-1

                      text-lg

                      font-medium

                      text-white/50

                    "

                  >

                    days

                  </p>

                </div>



                <p

                  className="

                    mt-5

                    text-sm

                    text-white/42

                  "

                >

                  Since{" "}

                  {formatDateID(

                    couple.anniversaryDate

                  )}

                </p>



                {/* ANNIVERSARY */}



                <div

                  className="

                    mt-9

                    flex

                    max-w-md

                    items-end

                    justify-between

                    gap-6

                    border-t

                    border-white/10

                    pt-5

                  "

                >

                  <div>

                    <p

                      className="

                        text-[10px]

                        uppercase

                        tracking-[0.16em]

                        text-white/30

                      "

                    >

                      Anniversary

                    </p>



                    <p

                      className="

                        mt-1.5

                        text-sm

                        font-medium

                        text-white/75

                      "

                    >

                      {formatDateID(

                        anniversary.nextDate

                      )}

                    </p>

                  </div>



                  <div className="text-right">

                    <p

                      className="

                        font-display

                        text-2xl

                        font-semibold

                        tracking-tight

                      "

                    >

                      {

                        anniversary.daysUntil

                      }

                    </p>



                    <p

                      className="

                        mt-0.5

                        text-[10px]

                        text-white/35

                      "

                    >

                      {anniversary.daysUntil ===

                      1

                        ? "day"

                        : "days"}

                    </p>

                  </div>

                </div>

              </div>



              {/* HERO STATS */}



              <div

                className="

                  grid

                  grid-cols-2

                  border-t

                  border-white/10

                  sm:grid-cols-4

                  lg:grid-cols-2

                  lg:border-l

                  lg:border-t-0

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



          {/* =================================================

              RATING

          ================================================= */}



          <section className="mt-5">

            <DailyRatingTracker />

          </section>



          {/* =================================================

              PLANNER

          ================================================= */}



          <section

            className="

              mt-5

              grid

              gap-5

              xl:grid-cols-[1.28fr_0.72fr]

            "

          >

            <NextPlanCard

              plan={nextPlan}

              today={today}

            />



            <PlanProgress

              total={

                stats.totalPlans

              }

              planned={

                stats.plannedPlans

              }

              done={

                stats.donePlans

              }

              percentage={

                completionRate

              }

            />

          </section>



          {/* =================================================

              MEMORY

          ================================================= */}



          <section className="mt-5">

            <LatestMemoryCard

              memory={

                latestMemory

              }

            />

          </section>

        </div>

      </main>

    </div>

  );

}



/*

 * =========================================================

 * ROTATING TYPEWRITER

 * =========================================================

 */



function RotatingTypewriter({

  messages,

  typingSpeed = 62,

  deletingSpeed = 34,

  holdDuration = 2200,

}: {

  messages: string[];

  typingSpeed?: number;

  deletingSpeed?: number;

  holdDuration?: number;

}) {

  const [

    messageIndex,

    setMessageIndex,

  ] = useState(0);



  const [

    visibleText,

    setVisibleText,

  ] = useState("");



  const [

    phase,

    setPhase,

  ] = useState<

    "typing" |

    "holding" |

    "deleting"

  >("typing");



  useEffect(() => {

    if (

      messages.length === 0

    ) {

      setVisibleText(

        ""

      );



      setMessageIndex(

        0

      );



      setPhase(

        "typing"

      );



      return;

    }



    const currentMessage =

      messages[

        messageIndex %

          messages.length

      ];



    let timeoutId:

      number | undefined;



    if (

      phase ===

      "typing"

    ) {

      if (

        visibleText.length <

        currentMessage.length

      ) {

        timeoutId =

          window.setTimeout(

            () => {

              setVisibleText(

                currentMessage.slice(

                  0,

                  visibleText.length +

                    1

                )

              );

            },

            typingSpeed

          );

      } else {

        timeoutId =

          window.setTimeout(

            () => {

              setPhase(

                "holding"

              );

            },

            160

          );

      }

    }



    if (

      phase ===

      "holding"

    ) {

      timeoutId =

        window.setTimeout(

          () => {

            setPhase(

              "deleting"

            );

          },

          holdDuration

        );

    }



    if (

      phase ===

      "deleting"

    ) {

      if (

        visibleText.length >

        0

      ) {

        timeoutId =

          window.setTimeout(

            () => {

              setVisibleText(

                (current) =>

                  current.slice(

                    0,

                    -1

                  )

              );

            },

            deletingSpeed

          );

      } else {

        setMessageIndex(

          (current) =>

            (current + 1) %

            messages.length

        );



        setPhase(

          "typing"

        );

      }

    }



    return () => {

      if (

        timeoutId !==

        undefined

      ) {

        window.clearTimeout(

          timeoutId

        );

      }

    };

  }, [

    deletingSpeed,

    holdDuration,

    messageIndex,

    messages,

    phase,

    typingSpeed,

    visibleText,

  ]);



  return (

    <span

      className="

        inline-flex

        items-center

      "

    >

      <span>

        {visibleText}

      </span>



      <span

        aria-hidden="true"

        className="

          ml-1

          inline-block

          h-[0.82em]

          w-[2px]

          animate-pulse

          rounded-full

          bg-ocean-700

        "

      />

    </span>

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

        flex

        min-h-[118px]

        flex-col

        justify-center

        border-b

        border-r

        border-white/10

        px-5

        py-6

        even:border-r-0

        sm:border-b-0

        sm:even:border-r

        sm:last:border-r-0

        lg:min-h-[50%]

        lg:border-b

        lg:even:border-r-0

        lg:[&:nth-child(3)]:border-b-0

        lg:[&:nth-child(4)]:border-b-0

      "

    >

      <p

        className="

          font-display

          text-[32px]

          font-semibold

          leading-none

          tracking-[-0.04em]

        "

      >

        {value}

      </p>



      <p

        className="

          mt-2.5

          text-[11px]

          font-medium

          text-white/38

        "

      >

        {label}

      </p>

    </div>

  );

}



/*

 * =========================================================

 * NEXT PLAN

 * =========================================================

 */



function NextPlanCard({

  plan,

  today,

}: {

  plan:

    | NextPlan

    | null;



  today: string;

}) {

  if (!plan) {

    return (

      <Surface>

        <div

          className="

            flex

            min-h-[360px]

            flex-col

            p-7

            sm:p-8

          "

        >

          <SectionTitle>

            Next Plan

          </SectionTitle>



          <p

            className="

              mt-4

              text-sm

              text-ink-soft

            "

          >

            Nothing planned yet.

          </p>



          <div

            className="

              mt-auto

              pt-8

            "

          >

            <PrimaryLink

              href="/planner"

            >

              Planner

            </PrimaryLink>

          </div>

        </div>

      </Surface>

    );

  }



  const daysUntil =

    differenceInDays(

      today,

      plan.planDate

    );



  return (

    <Surface>

      <div

        className="

          grid

          min-h-[360px]

          md:grid-cols-[0.94fr_1.06fr]

        "

      >

        {/* COVER */}



        <Link

          href={`/planner/${plan.id}`}

          className="

            group

            relative

            min-h-[260px]

            overflow-hidden

            bg-ocean-100

            md:min-h-full

          "

        >

          {plan.coverUrl ? (

            <Image

              src={

                plan.coverUrl

              }

              alt={

                plan.title

              }

              fill

              unoptimized

              className="

                object-cover

                transition

                duration-700

                ease-out

                group-hover:scale-[1.025]

              "

            />

          ) : (

            <div

              className="

                absolute

                inset-0

                bg-[linear-gradient(145deg,#0b4f71_0%,#1688b5_100%)]

              "

            />

          )}



          <div

            className="

              absolute

              inset-0

              bg-[linear-gradient(to_top,rgba(6,42,63,0.26),transparent_55%)]

            "

          />

        </Link>



        {/* CONTENT */}



        <div

          className="

            flex

            flex-col

            p-7

            sm:p-8

            lg:p-9

          "

        >

          <div

            className="

              flex

              items-start

              justify-between

              gap-5

            "

          >

            <p

              className="

                text-xs

                font-medium

                text-ink-soft

              "

            >

              Next Plan

            </p>



            {daysUntil >= 0 && (

              <p

                className="

                  shrink-0

                  text-[11px]

                  font-medium

                  text-ocean-600

                "

              >

                {getPlanDistanceLabel(

                  daysUntil

                )}

              </p>

            )}

          </div>



          <h2

            className="

              mt-3

              max-w-xl

              font-display

              text-[30px]

              font-semibold

              leading-[1.1]

              tracking-[-0.03em]

              text-ocean-950

              sm:text-[36px]

            "

          >

            {plan.title}

          </h2>



          <div

            className="

              mt-6

              space-y-1

              text-sm

              leading-6

              text-ink-soft

            "

          >

            <p>

              {formatDateID(

                plan.planDate

              )}

            </p>



            {plan.planTime && (

              <p>

                {formatTime(

                  plan.planTime

                )}

              </p>

            )}



            {plan.locationName && (

              <p>

                {

                  plan.locationName

                }

              </p>

            )}

          </div>



          <div

            className="

              mt-auto

              pt-9

            "

          >

            <PrimaryLink

              href={`/planner/${plan.id}`}

            >

              Open

            </PrimaryLink>

          </div>

        </div>

      </div>

    </Surface>

  );

}



/*

 * =========================================================

 * PLAN PROGRESS

 * =========================================================

 */



function PlanProgress({

  total,

  planned,

  done,

  percentage,

}: {

  total: number;

  planned: number;

  done: number;

  percentage: number;

}) {

  return (

    <Surface>

      <div

        className="

          flex

          min-h-[360px]

          flex-col

          p-7

          sm:p-8

          lg:p-9

        "

      >

        <SectionTitle>

          Plan Progress

        </SectionTitle>



        <div

          className="

            mt-10

            flex

            items-end

            justify-between

            gap-5

          "

        >

          <p

            className="

              font-display

              text-[58px]

              font-semibold

              leading-none

              tracking-[-0.055em]

              text-ocean-950

            "

          >

            {percentage}

            <span

              className="

                ml-1

                text-2xl

                text-ocean-400

              "

            >

              %

            </span>

          </p>



          <p

            className="

              pb-1

              text-xs

              text-ink-soft

            "

          >

            {done}/{total}

          </p>

        </div>



        {/* PROGRESS */}



        <div

          className="

            mt-6

            h-[6px]

            overflow-hidden

            rounded-full

            bg-ocean-50

          "

        >

          <div

            className="

              h-full

              rounded-full

              bg-ocean-700

              transition-[width]

              duration-700

              ease-out

            "

            style={{

              width:

                `${Math.min(

                  100,

                  Math.max(

                    0,

                    percentage

                  )

                )}%`,

            }}

          />

        </div>



        {/* STATS */}



        <div

          className="

            mt-9

            grid

            grid-cols-3

            divide-x

            divide-ocean-100

          "

        >

          <ProgressStat

            value={total}

            label="Total"

          />



          <ProgressStat

            value={planned}

            label="Planned"

          />



          <ProgressStat

            value={done}

            label="Done"

          />

        </div>



        <div

          className="

            mt-auto

            pt-9

          "

        >

          <PrimaryLink

            href="/planner"

          >

            Planner

          </PrimaryLink>

        </div>

      </div>

    </Surface>

  );

}



/*

 * =========================================================

 * LATEST MEMORY

 * =========================================================

 */



function LatestMemoryCard({

  memory,

}: {

  memory:

    | LatestMemory

    | null;

}) {

  if (!memory) {

    return (

      <Surface>

        <div

          className="

            flex

            min-h-[270px]

            flex-col

            p-7

            sm:p-8

          "

        >

          <SectionTitle>

            Latest Memory

          </SectionTitle>



          <p

            className="

              mt-4

              text-sm

              text-ink-soft

            "

          >

            No memories yet.

          </p>



          <div

            className="

              mt-auto

              pt-9

            "

          >

            <PrimaryLink

              href="/memories"

            >

              Memories

            </PrimaryLink>

          </div>

        </div>

      </Surface>

    );

  }



  return (

    <Surface>

      <div

        className="

          grid

          md:grid-cols-[380px_1fr]

          xl:grid-cols-[440px_1fr]

        "

      >

        {/* IMAGE */}



        <Link

          href={`/memories/${memory.id}`}

          className="

            group

            relative

            min-h-[320px]

            overflow-hidden

            bg-ocean-100

          "

        >

          {memory.coverUrl ? (

            <Image

              src={

                memory.coverUrl

              }

              alt={

                memory.title

              }

              fill

              unoptimized

              className="

                object-cover

                transition

                duration-700

                ease-out

                group-hover:scale-[1.025]

              "

            />

          ) : (

            <div

              className="

                absolute

                inset-0

                bg-[linear-gradient(145deg,#0b4f71_0%,#67c5e2_100%)]

              "

            />

          )}



          <div

            className="

              absolute

              inset-0

              bg-[linear-gradient(to_top,rgba(6,42,63,0.22),transparent_55%)]

            "

          />



          {memory.photoCount > 0 && (

            <p

              className="

                absolute

                bottom-5

                left-5

                rounded-full

                bg-black/25

                px-3

                py-1.5

                text-[10px]

                font-medium

                text-white

                backdrop-blur-lg

              "

            >

              {memory.photoCount}{" "}

              {memory.photoCount ===

              1

                ? "photo"

                : "photos"}

            </p>

          )}

        </Link>



        {/* CONTENT */}



        <div

          className="

            flex

            min-h-[320px]

            flex-col

            p-7

            sm:p-8

            lg:p-10

          "

        >

          <p

            className="

              text-xs

              font-medium

              text-ink-soft

            "

          >

            Latest Memory

          </p>



          <h2

            className="

              mt-3

              max-w-3xl

              font-display

              text-[30px]

              font-semibold

              leading-[1.1]

              tracking-[-0.03em]

              text-ocean-950

              sm:text-[38px]

            "

          >

            {memory.title}

          </h2>



          <div

            className="

              mt-4

              flex

              flex-wrap

              items-center

              gap-x-2

              gap-y-1

              text-xs

              text-ink-soft

            "

          >

            <span>

              {formatDateID(

                memory.memoryDate

              )}

            </span>



            {memory.memoryTime && (

              <>

                <MetaDot />



                <span>

                  {formatTime(

                    memory.memoryTime

                  )}

                </span>

              </>

            )}



            {memory.locationName && (

              <>

                <MetaDot />



                <span>

                  {

                    memory.locationName

                  }

                </span>

              </>

            )}

          </div>



          {memory.story && (

            <p

              className="

                mt-7

                max-w-3xl

                line-clamp-3

                whitespace-pre-line

                text-sm

                leading-7

                text-ink-soft

              "

            >

              {memory.story}

            </p>

          )}



          <div

            className="

              mt-auto

              pt-9

            "

          >

            <PrimaryLink

              href={`/memories/${memory.id}`}

            >

              Open

            </PrimaryLink>

          </div>

        </div>

      </div>

    </Surface>

  );

}



/*

 * =========================================================

 * SECTION TITLE

 * =========================================================

 */



function SectionTitle({

  children,

}: {

  children: ReactNode;

}) {

  return (

    <h2

      className="

        font-display

        text-[25px]

        font-semibold

        leading-tight

        tracking-[-0.025em]

        text-ocean-950

      "

    >

      {children}

    </h2>

  );

}



/*

 * =========================================================

 * PROGRESS STAT

 * =========================================================

 */



function ProgressStat({

  value,

  label,

}: {

  value: number;

  label: string;

}) {

  return (

    <div

      className="

        px-4

        first:pl-0

        last:pr-0

      "

    >

      <p

        className="

          font-display

          text-2xl

          font-semibold

          leading-none

          tracking-[-0.025em]

          text-ocean-950

        "

      >

        {value}

      </p>



      <p

        className="

          mt-2

          text-[11px]

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

 * META DOT

 * =========================================================

 */



function MetaDot() {

  return (

    <span

      className="

        h-[3px]

        w-[3px]

        rounded-full

        bg-ocean-300

      "

    />

  );

}



/*

 * =========================================================

 * SURFACE

 * =========================================================

 */



function Surface({

  children,

}: {

  children: ReactNode;

}) {

  return (

    <article

      className="

        overflow-hidden

        rounded-[30px]

        border

        border-ocean-100/70

        bg-white/80

        shadow-[0_16px_50px_rgba(8,59,89,0.045)]

        backdrop-blur-xl

      "

    >

      {children}

    </article>

  );

}



/*

 * =========================================================

 * PRIMARY BUTTON

 * =========================================================

 */



function PrimaryLink({

  href,

  children,

}: {

  href: string;

  children: ReactNode;

}) {

  return (

    <Link

      href={href}

      style={{

        color: "#ffffff",

      }}

      className="

        group

        inline-flex

        items-center

        gap-2.5

        rounded-[13px]

        bg-ocean-800

        px-5

        py-2.5

        text-sm

        font-semibold

        shadow-[0_8px_20px_rgba(8,59,89,0.13)]

        transition

        duration-200

        hover:bg-ocean-900

        active:scale-[0.98]

      "

    >

      <span>

        {children}

      </span>



      <ArrowRight

        size={15}

        strokeWidth={1.8}

        className="

          transition-transform

          duration-200

          group-hover:translate-x-0.5

        "

      />

    </Link>

  );

}



/*

 * =========================================================

 * PLAN DISTANCE

 * =========================================================

 */



function getPlanDistanceLabel(

  days: number

) {

  if (days === 0) {

    return "Today";

  }



  if (days === 1) {

    return "Tomorrow";

  }



  return `In ${days} days`;

}



/*

 * =========================================================

 * ANNIVERSARY

 * =========================================================

 */



function getAnniversaryMeta(

  anniversaryDate: string,

  today: string

) {

  const [

    anniversaryYear,

    month,

    day,

  ] =

    anniversaryDate

      .split("-")

      .map(Number);



  const [

    currentYear,

  ] =

    today

      .split("-")

      .map(Number);



  const monthKey =

    String(

      month

    ).padStart(

      2,

      "0"

    );



  const dayKey =

    String(

      day

    ).padStart(

      2,

      "0"

    );



  const anniversaryThisYear =

    `${currentYear}-${monthKey}-${dayKey}`;



  const nextDate =

    anniversaryThisYear >=

    today

      ? anniversaryThisYear

      : `${currentYear + 1}-${monthKey}-${dayKey}`;



  const nextYear =

    Number(

      nextDate.slice(

        0,

        4

      )

    );



  return {

    nextDate,



    years:

      nextYear -

      anniversaryYear,



    daysUntil:

      Math.max(

        0,

        differenceInDays(

          today,

          nextDate

        )

      ),

  };

}