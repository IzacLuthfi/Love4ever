// src/components/timeline/TimelineClient.tsx

"use client";

import Image from "next/image";

import Link from "next/link";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {

  ArrowUpRight,

  MapPin,

} from "lucide-react";



import AppSidebar from "@/components/layout/AppSidebar";

import MobileBottomNav from "@/components/layout/MobileBottomNav";



type TimelineUser = {

  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl: string | null;

};



type TimelineCouple = {

  id: string;

  name: string;

  anniversaryDate:

    | string

    | null;

};



type TimelineMemory = {

  id: string;

  couple_id: string;

  title: string;

  story: string | null;

  memory_date: string;

  memory_time: string | null;

  location_name: string | null;

  created_at: string;

  cover_url: string | null;

};



type TimelineClientProps = {

  user: TimelineUser;

  couple: TimelineCouple;

  memories: TimelineMemory[];

};



type TimelineItem =

  | {

      type:

        "milestone";

      key:

        string;

      date:

        string;

      title:

        string;

      subtitle:

        string | null;

    }

  | {

      type:

        "memory";

      key:

        string;

      date:

        string;

      memory:

        TimelineMemory;

    }

  | {

      type:

        "today";

      key:

        string;

      date:

        string;

    };



export default function TimelineClient({

  user,

  couple,

  memories,

}: TimelineClientProps) {

  const today =

    getJakartaDateKey();



  const timelineItems =

    buildTimelineItems({

      anniversaryDate:

        couple.anniversaryDate,

      memories,

      today,

    });



  const grouped =

    groupByYear(

      timelineItems

    );



  const revealOrder =

    new Map(

      timelineItems.map(

        (

          item,

          index

        ) => [

          item.key,

          index,

        ]

      )

    );



  return (

    <div

      className="

        min-h-[100svh]

        bg-[#f7f7f4]

      "

    >

      <AppSidebar

        user={

          user

        }

      />



      <MobileBottomNav />



      <main

        className="

          min-h-[100svh]

          px-4

          pb-28

          pt-7

          sm:px-6

          lg:ml-[290px]

          lg:px-8

          lg:pb-14

          lg:pt-10

          xl:px-10

        "

      >

        <div

          className="

            mx-auto

            w-full

            max-w-[1180px]

          "

        >

          {/* HEADER */}



          <header

            className="

              flex

              items-end

              justify-between

              gap-6

              border-b

              border-ocean-100/80

              pb-7

            "

          >

            <div>

              <p

                className="

                  text-[10px]

                  font-semibold

                  uppercase

                  tracking-[0.22em]

                  text-ink-soft/55

                "

              >

                {couple.name}

              </p>



              <h1

                className="

                  mt-3

                  font-display

                  text-[38px]

                  font-semibold

                  leading-none

                  tracking-[-0.045em]

                  text-ocean-950

                  sm:text-[48px]

                "

              >

                Our Timeline

              </h1>

            </div>



            {couple.anniversaryDate && (

              <p

                className="

                  hidden

                  text-right

                  text-xs

                  leading-5

                  text-ink-soft

                  sm:block

                "

              >

                Since

                <br />

                <span

                  className="

                    font-medium

                    text-ocean-900

                  "

                >

                  {formatLongDate(

                    couple.anniversaryDate

                  )}

                </span>

              </p>

            )}

          </header>



          {/* TIMELINE */}



          {timelineItems.length >

          0 ? (

            <div

              className="

                mt-9

                pb-6

                sm:mt-12

              "

            >

              {grouped.map(

                (

                  group

                ) => (

                  <section

                    key={

                      group.year

                    }

                    className="

                      grid

                      grid-cols-[54px_minmax(0,1fr)]

                      gap-3

                      sm:grid-cols-[100px_minmax(0,1fr)]

                      sm:gap-7

                    "

                  >

                    {/* YEAR */}



                    <div

                      className="

                        relative

                        pt-1

                      "

                    >

                      <p

                        className="

                          sticky

                          top-6

                          font-display

                          text-[18px]

                          font-semibold

                          tracking-[-0.02em]

                          text-ocean-950

                          sm:text-[22px]

                        "

                      >

                        {

                          group.year

                        }

                      </p>

                    </div>



                    {/* ITEMS */}



                    <div

                      className="

                        relative

                        border-l

                        border-ocean-100

                        pb-12

                        pl-5

                        sm:pl-8

                      "

                    >

                      {group.items.map(

                        (

                          item,

                          index

                        ) => (

                          <TimelineReveal

                            key={

                              item.key

                            }

                            revealIndex={

                              revealOrder.get(

                                item.key

                              ) ??

                              index

                            }

                          >

                            <TimelineRow

                              item={

                                item

                              }

                              first={

                                index ===

                                0

                              }

                            />

                          </TimelineReveal>

                        )

                      )}

                    </div>

                  </section>

                )

              )}

            </div>

          ) : (

            <EmptyTimeline />

          )}

        </div>

      </main>

    </div>

  );

}



/* =========================================================

   TIMELINE REVEAL

========================================================= */



function TimelineReveal({

  children,

  revealIndex,

}: {

  children:

    ReactNode;

  revealIndex:

    number;

}) {

  const elementRef =

    useRef<HTMLDivElement>(

      null

    );



  const [

    visible,

    setVisible,

  ] = useState(

    false

  );



  useEffect(() => {

    const element =

      elementRef.current;



    if (!element) {

      return;

    }



    const reducedMotion =

      window.matchMedia(

        "(prefers-reduced-motion: reduce)"

      );



    if (

      reducedMotion.matches

    ) {

      setVisible(

        true

      );



      return;

    }



    const observer =

      new IntersectionObserver(

        (

          entries

        ) => {

          const entry =

            entries[0];



          if (

            !entry ||

            !entry.isIntersecting

          ) {

            return;

          }



          setVisible(

            true

          );



          observer.disconnect();

        },

        {

          threshold:

            0.12,

          rootMargin:

            "0px 0px -6% 0px",

        }

      );



    observer.observe(

      element

    );



    return () => {

      observer.disconnect();

    };

  }, []);



  const delay =

    (

      revealIndex %

      6

    ) * 85;



  return (

    <div

      ref={

        elementRef

      }

      style={{

        opacity:

          visible

            ? 1

            : 0,

        transform:

          visible

            ? "translateY(0)"

            : "translateY(14px)",

        transitionProperty:

          "opacity, transform",

        transitionDuration:

          "520ms",

        transitionTimingFunction:

          "cubic-bezier(0.22, 1, 0.36, 1)",

        transitionDelay:

          visible

            ? `${delay}ms`

            : "0ms",

        willChange:

          "opacity, transform",

      }}

    >

      {children}

    </div>

  );

}



/* =========================================================

   ROW

========================================================= */



function TimelineRow({

  item,

  first,

}: {

  item:

    TimelineItem;



  first:

    boolean;

}) {

  if (

    item.type ===

    "today"

  ) {

    return (

      <div

        className={`

          relative

          ${first

            ? ""

            : "mt-7"}

        `}

      >

        <TimelineDot

          active

        />



        <div

          className="

            flex

            items-center

            gap-3

            py-1

          "

        >

          <span

            className="

              text-[10px]

              font-semibold

              uppercase

              tracking-[0.18em]

              text-ocean-700

            "

          >

            Today

          </span>



          <div

            className="

              h-px

              flex-1

              bg-ocean-100

            "

          />

        </div>

      </div>

    );

  }



  if (

    item.type ===

    "milestone"

  ) {

    return (

      <article

        className={`

          relative

          ${first

            ? ""

            : "mt-8"}

        `}

      >

        <TimelineDot />



        <div

          className="

            grid

            gap-2

            sm:grid-cols-[86px_minmax(0,1fr)]

            sm:gap-5

          "

        >

          <TimelineDate

            value={

              item.date

            }

          />



          <div

            className="

              min-w-0

              pb-1

            "

          >

            <h2

              className="

                font-display

                text-[22px]

                font-semibold

                tracking-[-0.025em]

                text-ocean-950

                sm:text-[25px]

              "

            >

              {

                item.title

              }

            </h2>



            {item.subtitle && (

              <p

                className="

                  mt-1

                  text-xs

                  text-ink-soft

                "

              >

                {

                  item.subtitle

                }

              </p>

            )}

          </div>

        </div>

      </article>

    );

  }



  return (

    <article

      className={`

        relative

        ${first

          ? ""

          : "mt-8"}

      `}

    >

      <TimelineDot />



      <div

        className="

          grid

          gap-3

          sm:grid-cols-[86px_minmax(0,1fr)]

          sm:gap-5

        "

      >

        <TimelineDate

          value={

            item.date

          }

        />



        <Link

          href={

            `/memories/${item.memory.id}`

          }

          className="

            group

            block

            min-w-0

          "

        >

          <div

            className="

              overflow-hidden

              rounded-[18px]

              border

              border-ocean-100/75

              bg-white

              transition

              duration-200

              hover:border-ocean-200

              hover:shadow-[0_12px_34px_rgba(8,59,89,0.055)]

            "

          >

            <div

              className={`

                grid

                min-w-0



                ${

                  item.memory

                    .cover_url

                    ? "sm:grid-cols-[190px_minmax(0,1fr)]"

                    : ""

                }

              `}

            >

              {item.memory

                .cover_url && (

                <div

                  className="

                    relative

                    aspect-[16/10]

                    min-h-[150px]

                    overflow-hidden

                    bg-ocean-50

                    sm:aspect-auto

                  "

                >

                  <Image

                    src={

                      item.memory

                        .cover_url

                    }

                    alt={

                      item.memory

                        .title

                    }

                    fill

                    unoptimized

                    className="

                      object-cover

                      transition

                      duration-500

                      group-hover:scale-[1.02]

                    "

                  />

                </div>

              )}



              <div

                className="

                  min-w-0

                  p-4

                  sm:p-5

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

                  <h2

                    className="

                      min-w-0

                      font-display

                      text-[21px]

                      font-semibold

                      leading-tight

                      tracking-[-0.025em]

                      text-ocean-950

                    "

                  >

                    {

                      item.memory

                        .title

                    }

                  </h2>



                  <ArrowUpRight

                    size={

                      15

                    }

                    className="

                      mt-1

                      shrink-0

                      text-ink-soft/35

                      transition

                      group-hover:text-ocean-800

                    "

                  />

                </div>



                {item.memory

                  .story && (

                  <p

                    className="

                      mt-2

                      line-clamp-2

                      text-xs

                      leading-5

                      text-ink-soft

                    "

                  >

                    {

                      item.memory

                        .story

                    }

                  </p>

                )}



                {item.memory

                  .location_name && (

                  <div

                    className="

                      mt-4

                      flex

                      items-center

                      gap-1.5

                      text-[10px]

                      text-ink-soft/70

                    "

                  >

                    <MapPin

                      size={

                        11

                      }

                    />



                    <span

                      className="

                        truncate

                      "

                    >

                      {

                        item.memory

                          .location_name

                      }

                    </span>

                  </div>

                )}

              </div>

            </div>

          </div>

        </Link>

      </div>

    </article>

  );

}



/* =========================================================

   SMALL PARTS

========================================================= */



function TimelineDate({

  value,

}: {

  value:

    string;

}) {

  const date =

    parseDateOnly(

      value

    );



  const day =

    new Intl.DateTimeFormat(

      "en-US",

      {

        day:

          "2-digit",

      }

    ).format(

      date

    );



  const month =

    new Intl.DateTimeFormat(

      "en-US",

      {

        month:

          "short",

      }

    )

      .format(

        date

      )

      .toUpperCase();



  return (

    <div

      className="

        flex

        items-baseline

        gap-1.5

        sm:block

      "

    >

      <p

        className="

          font-display

          text-[19px]

          font-semibold

          leading-none

          text-ocean-950

          sm:text-[22px]

        "

      >

        {day}

      </p>



      <p

        className="

          text-[9px]

          font-semibold

          tracking-[0.14em]

          text-ink-soft/55

          sm:mt-1

        "

      >

        {month}

      </p>

    </div>

  );

}



function TimelineDot({

  active = false,

}: {

  active?:

    boolean;

}) {

  return (

    <span

      className={`

        absolute

        -left-[24px]

        top-[5px]

        h-[7px]

        w-[7px]

        rounded-full

        ring-[5px]

        ring-[#f7f7f4]

        sm:-left-[36px]



        ${

          active

            ? "bg-ocean-700"

            : "bg-ocean-300"

        }

      `}

    />

  );

}



function EmptyTimeline() {

  return (

    <div

      className="

        py-28

        text-center

      "

    >

      <h2

        className="

          font-display

          text-[28px]

          font-semibold

          tracking-[-0.03em]

          text-ocean-950

        "

      >

        Timeline is empty.

      </h2>



      <p

        className="

          mt-2

          text-sm

          text-ink-soft

        "

      >

        Memories will appear here.

      </p>



      <Link

        href="/memories"

        className="

          mt-6

          inline-flex

          items-center

          text-sm

          font-semibold

          text-ocean-800

          transition

          hover:text-ocean-950

        "

      >

        Open Memories

      </Link>

    </div>

  );

}



/* =========================================================

   BUILD TIMELINE

========================================================= */



function buildTimelineItems({

  anniversaryDate,

  memories,

  today,

}: {

  anniversaryDate:

    | string

    | null;



  memories:

    TimelineMemory[];



  today:

    string;

}) {

  const items:

    TimelineItem[] =

    [];



  if (

    anniversaryDate

  ) {

    items.push({

      type:

        "milestone",



      key:

        "relationship-start",



      date:

        anniversaryDate,



      title:

        "Together",



      subtitle:

        "The beginning.",

    });

  }



  for (

    const memory

    of memories

  ) {

    items.push({

      type:

        "memory",



      key:

        `memory-${memory.id}`,



      date:

        memory.memory_date,



      memory,

    });

  }



  if (

    !anniversaryDate ||

    today >=

      anniversaryDate

  ) {

    items.push({

      type:

        "today",



      key:

        "today",



      date:

        today,

    });

  }



  return items.sort(

    (

      a,

      b

    ) => {

      const byDate =

        a.date.localeCompare(

          b.date

        );



      if (

        byDate !==

        0

      ) {

        return byDate;

      }



      return itemOrder(

        a

      ) -

        itemOrder(

          b

        );

    }

  );

}



function itemOrder(

  item:

    TimelineItem

) {

  if (

    item.type ===

    "milestone"

  ) {

    return 0;

  }



  if (

    item.type ===

    "memory"

  ) {

    return 1;

  }



  return 2;

}



function groupByYear(

  items:

    TimelineItem[]

) {

  const groups =

    new Map<

      string,

      TimelineItem[]

    >();



  for (

    const item

    of items

  ) {

    const year =

      item.date.slice(

        0,

        4

      );



    const current =

      groups.get(

        year

      ) ??

      [];



    current.push(

      item

    );



    groups.set(

      year,

      current

    );

  }



  return [

    ...groups.entries(),

  ].map(

    ([

      year,

      groupItems,

    ]) => ({

      year,

      items:

        groupItems,

    })

  );

}



/* =========================================================

   DATE

========================================================= */



function parseDateOnly(

  value:

    string

) {

  const [

    year,

    month,

    day,

  ] =

    value

      .split("-")

      .map(

        Number

      );



  return new Date(

    year,

    month - 1,

    day,

    12,

    0,

    0

  );

}



function formatLongDate(

  value:

    string

) {

  return new Intl.DateTimeFormat(

    "en-GB",

    {

      day:

        "2-digit",



      month:

        "short",



      year:

        "numeric",

    }

  ).format(

    parseDateOnly(

      value

    )

  );

}



function getJakartaDateKey() {

  return new Intl.DateTimeFormat(

    "en-CA",

    {

      timeZone:

        "Asia/Jakarta",



      year:

        "numeric",



      month:

        "2-digit",



      day:

        "2-digit",

    }

  ).format(

    new Date()

  );

}
