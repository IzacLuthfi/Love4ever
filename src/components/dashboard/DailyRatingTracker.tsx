// src/components/dashboard/DailyRatingTracker.tsx

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "@/lib/supabase/client";

type RatingRow = {
  id: string;
  couple_id: string;
  user_id: string;
  rating: number;
  rating_date: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  nickname: string | null;
};

type MemberRow = {
  user_id: string;
};

type ChartPoint = {
  date: string;
  label: string;
  mine: number | null;
  partner: number | null;
};

export default function DailyRatingTracker() {
  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const [
    ratings,
    setRatings,
  ] =
    useState<RatingRow[]>([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState("");

  const [
    coupleId,
    setCoupleId,
  ] =
    useState("");

  const [
    partnerId,
    setPartnerId,
  ] =
    useState("");

  const [
    myName,
    setMyName,
  ] =
    useState("You");

  const [
    partnerName,
    setPartnerName,
  ] =
    useState("Partner");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    savingRating,
    setSavingRating,
  ] =
    useState<number | null>(
      null
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  /*
   * =========================================================
   * DATE
   * =========================================================
   */

  const today =
    useMemo(
      () =>
        getTodayInJakarta(),
      []
    );

  const days =
    useMemo(
      () =>
        getLastSevenDays(
          today
        ),
      [today]
    );

  /*
   * =========================================================
   * LOAD
   * =========================================================
   */

  const loadRatings =
    useCallback(
      async (
        showLoading = false
      ) => {
        if (showLoading) {
          setLoading(
            true
          );
        }

        setErrorMessage(
          null
        );

        try {
          /*
           * AUTH
           */

          const {
            data: {
              user,
            },
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !user
          ) {
            throw new Error(
              "Session tidak ditemukan."
            );
          }

          setCurrentUserId(
            user.id
          );

          /*
           * COUPLE
           */

          const {
            data:
              membership,
            error:
              membershipError,
          } =
            await supabase
              .from(
                "couple_members"
              )
              .select(
                "couple_id"
              )
              .eq(
                "user_id",
                user.id
              )
              .limit(1)
              .maybeSingle();

          if (
            membershipError
          ) {
            throw new Error(
              membershipError.message
            );
          }

          if (
            !membership
          ) {
            throw new Error(
              "Couple belum terhubung."
            );
          }

          const currentCoupleId =
            membership.couple_id;

          setCoupleId(
            currentCoupleId
          );

          /*
           * MEMBERS
           */

          const {
            data:
              membersData,
            error:
              membersError,
          } =
            await supabase
              .from(
                "couple_members"
              )
              .select(
                "user_id"
              )
              .eq(
                "couple_id",
                currentCoupleId
              );

          if (
            membersError
          ) {
            throw new Error(
              membersError.message
            );
          }

          const members =
            (
              membersData ??
              []
            ) as MemberRow[];

          const userIds =
            members.map(
              (member) =>
                member.user_id
            );

          const otherUserId =
            userIds.find(
              (id) =>
                id !==
                user.id
            ) ?? "";

          setPartnerId(
            otherUserId
          );

          /*
           * PROFILES
           */

          if (
            userIds.length >
            0
          ) {
            const {
              data:
                profilesData,
              error:
                profilesError,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(
                  `
                  id,
                  full_name,
                  nickname
                  `
                )
                .in(
                  "id",
                  userIds
                );

            if (
              profilesError
            ) {
              throw new Error(
                profilesError.message
              );
            }

            const profiles =
              (
                profilesData ??
                []
              ) as ProfileRow[];

            const myProfile =
              profiles.find(
                (profile) =>
                  profile.id ===
                  user.id
              );

            const partnerProfile =
              profiles.find(
                (profile) =>
                  profile.id ===
                  otherUserId
              );

            setMyName(
              getProfileName(
                myProfile,
                "You"
              )
            );

            setPartnerName(
              getProfileName(
                partnerProfile,
                "Partner"
              )
            );
          }

          /*
           * LAST 7 DAYS
           */

          const firstDate =
            days[0]?.date ??
            today;

          const {
            data:
              ratingsData,
            error:
              ratingsError,
          } =
            await supabase
              .from(
                "daily_ratings"
              )
              .select(
                `
                id,
                couple_id,
                user_id,
                rating,
                rating_date,
                created_at,
                updated_at
                `
              )
              .eq(
                "couple_id",
                currentCoupleId
              )
              .gte(
                "rating_date",
                firstDate
              )
              .lte(
                "rating_date",
                today
              )
              .order(
                "rating_date",
                {
                  ascending:
                    true,
                }
              );

          if (
            ratingsError
          ) {
            throw new Error(
              ratingsError.message
            );
          }

          setRatings(
            (
              ratingsData ??
              []
            ) as RatingRow[]
          );
        } catch (error) {
          console.error(
            "Daily rating error:",
            error
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "Rating gagal dimuat."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        days,
        supabase,
        today,
      ]
    );

  /*
   * INITIAL LOAD
   */

  useEffect(() => {
    void loadRatings(
      true
    );
  }, [loadRatings]);

  /*
   * =========================================================
   * REALTIME
   * =========================================================
   */

  useEffect(() => {
    if (!coupleId) {
      return;
    }

    const channel =
      supabase
        .channel(
          `daily-ratings-${coupleId}`
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "daily_ratings",

            filter:
              `couple_id=eq.${coupleId}`,
          },
          () => {
            void loadRatings();
          }
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [
    coupleId,
    loadRatings,
    supabase,
  ]);

  /*
   * =========================================================
   * TODAY RATINGS
   * =========================================================
   */

  const myTodayRating =
    ratings.find(
      (rating) =>
        rating.user_id ===
          currentUserId &&
        rating.rating_date ===
          today
    )?.rating ?? null;

  const partnerTodayRating =
    ratings.find(
      (rating) =>
        rating.user_id ===
          partnerId &&
        rating.rating_date ===
          today
    )?.rating ?? null;

  /*
   * =========================================================
   * CHART
   * =========================================================
   */

  const chartData:
    ChartPoint[] =
    useMemo(
      () =>
        days.map(
          (day) => {
            const myRating =
              ratings.find(
                (rating) =>
                  rating.user_id ===
                    currentUserId &&
                  rating.rating_date ===
                    day.date
              );

            const partnerRating =
              ratings.find(
                (rating) =>
                  rating.user_id ===
                    partnerId &&
                  rating.rating_date ===
                    day.date
              );

            return {
              date:
                day.date,

              label:
                day.label,

              mine:
                myRating?.rating ??
                null,

              partner:
                partnerRating?.rating ??
                null,
            };
          }
        ),
      [
        currentUserId,
        days,
        partnerId,
        ratings,
      ]
    );

  /*
   * =========================================================
   * SAVE RATING
   * =========================================================
   */

  const handleRate =
    async (
      value:
        number
    ) => {
      if (
        !coupleId ||
        !currentUserId ||
        savingRating
      ) {
        return;
      }

      setSavingRating(
        value
      );

      /*
       * Optimistic update.
       */

      const oldRatings =
        ratings;

      const existing =
        ratings.find(
          (rating) =>
            rating.user_id ===
              currentUserId &&
            rating.rating_date ===
              today
        );

      if (existing) {
        setRatings(
          (current) =>
            current.map(
              (rating) =>
                rating.id ===
                existing.id
                  ? {
                      ...rating,
                      rating:
                        value,
                    }
                  : rating
            )
        );
      }

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "daily_ratings"
            )
            .upsert(
              {
                couple_id:
                  coupleId,

                user_id:
                  currentUserId,

                rating:
                  value,

                rating_date:
                  today,
              },
              {
                onConflict:
                  "couple_id,user_id,rating_date",
              }
            )
            .select(
              `
              id,
              couple_id,
              user_id,
              rating,
              rating_date,
              created_at,
              updated_at
              `
            )
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        setRatings(
          (current) => {
            const withoutToday =
              current.filter(
                (rating) =>
                  !(
                    rating.user_id ===
                      currentUserId &&
                    rating.rating_date ===
                      today
                  )
              );

            return [
              ...withoutToday,
              data as RatingRow,
            ];
          }
        );
      } catch (error) {
        setRatings(
          oldRatings
        );

        console.error(
          "Save rating error:",
          error
        );

        setErrorMessage(
          error instanceof
            Error
            ? error.message
            : "Rating gagal disimpan."
        );
      } finally {
        setSavingRating(
          null
        );
      }
    };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  if (loading) {
    return (
      <section
        className="
          rounded-[28px]
          border
          border-ocean-100/80
          bg-white/70
          p-5
          sm:p-6
        "
      >
        <div
          className="
            h-5
            w-20
            animate-pulse
            rounded-full
            bg-ocean-100
          "
        />

        <div
          className="
            mt-5
            h-[260px]
            animate-pulse
            rounded-[20px]
            bg-ocean-50
          "
        />
      </section>
    );
  }

  return (
    <section
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-ocean-100/80
        bg-white/75
        shadow-[0_15px_50px_rgba(8,59,89,0.06)]
        backdrop-blur-xl
      "
    >
      {/* TODAY */}

      <div
        className="
          p-5
          sm:p-6
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div>
            <h2
              className="
                font-display
                text-2xl
                font-semibold
                text-ocean-950
              "
            >
              Today
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-ink-soft
              "
            >
              {myName}
            </p>

            {/* RATING BUTTONS */}

            <div
              className="
                mt-4
                flex
                gap-2
              "
            >
              {[
                1,
                2,
                3,
                4,
                5,
              ].map(
                (value) => {
                  const active =
                    myTodayRating ===
                    value;

                  const isSaving =
                    savingRating ===
                    value;

                  return (
                    <button
                      key={
                        value
                      }
                      type="button"
                      onClick={() =>
                        handleRate(
                          value
                        )
                      }
                      disabled={
                        savingRating !==
                        null
                      }
                      className={`
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        text-sm
                        font-semibold
                        transition

                        ${
                          active
                            ? "bg-ocean-900 text-white shadow-[0_8px_22px_rgba(8,59,89,0.20)]"
                            : "border border-ocean-100 bg-white text-ocean-800 hover:border-ocean-300 hover:bg-ocean-50"
                        }

                        ${
                          isSaving
                            ? "scale-95 opacity-70"
                            : ""
                        }
                      `}
                    >
                      {value}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* TODAY VALUES */}

          <div
            className="
              flex
              gap-3
            "
          >
            <RatingValue
              name={
                myName
              }
              value={
                myTodayRating
              }
            />

            <RatingValue
              name={
                partnerName
              }
              value={
                partnerTodayRating
              }
            />
          </div>
        </div>

        {errorMessage && (
          <p
            className="
              mt-4
              text-xs
              text-heart
            "
          >
            {errorMessage}
          </p>
        )}
      </div>

      {/* DIVIDER */}

      <div
        className="
          border-t
          border-ocean-100/80
        "
      />

      {/* CHART */}

      <div
        className="
          p-5
          sm:p-6
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <h3
            className="
              font-display
              text-xl
              font-semibold
              text-ocean-950
            "
          >
            Last 7 Days
          </h3>

          <div
            className="
              flex
              items-center
              gap-4
              text-[11px]
              font-medium
              text-ink-soft
            "
          >
            <span
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-[#0b4f71]
                "
              />

              {myName}
            </span>

            <span
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-[#ef7890]
                "
              />

              {partnerName}
            </span>
          </div>
        </div>

        <div
          className="
            mt-5
            h-[260px]
            w-full
          "
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={
                chartData
              }
              margin={{
                top: 8,
                right: 8,
                bottom: 0,
                left: -22,
              }}
            >
              <CartesianGrid
                vertical={
                  false
                }
                stroke="#dcecf3"
                strokeDasharray="3 5"
              />

              <XAxis
                dataKey="label"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                tick={{
                  fill:
                    "#648196",

                  fontSize:
                    11,
                }}
                dy={8}
              />

              <YAxis
                domain={[
                  1,
                  5,
                ]}
                ticks={[
                  1,
                  2,
                  3,
                  4,
                  5,
                ]}
                allowDecimals={
                  false
                }
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                tick={{
                  fill:
                    "#8aa2b2",

                  fontSize:
                    10,
                }}
              />

              <Tooltip
                cursor={{
                  stroke:
                    "#cbeef7",
                }}
                contentStyle={{
                  borderRadius:
                    "14px",

                  border:
                    "1px solid #dff5fc",

                  boxShadow:
                    "0 10px 30px rgba(8,59,89,0.10)",

                  fontSize:
                    "12px",
                }}
                formatter={(
                  value,
                  name
                ) => {
                  if (
                    value ===
                      null ||
                    value ===
                      undefined
                  ) {
                    return [
                      "—",
                      name ===
                      "mine"
                        ? myName
                        : partnerName,
                    ];
                  }

                  return [
                    `${value}/5`,

                    name ===
                    "mine"
                      ? myName
                      : partnerName,
                  ];
                }}
              />

              <Line
                type="monotone"
                dataKey="mine"
                stroke="#0b4f71"
                strokeWidth={2.5}
                connectNulls={
                  false
                }
                dot={{
                  r: 3.5,
                  fill:
                    "#0b4f71",
                  strokeWidth:
                    0,
                }}
                activeDot={{
                  r: 5,
                }}
              />

              <Line
                type="monotone"
                dataKey="partner"
                stroke="#ef7890"
                strokeWidth={2.5}
                connectNulls={
                  false
                }
                dot={{
                  r: 3.5,
                  fill:
                    "#ef7890",
                  strokeWidth:
                    0,
                }}
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

/*
 * =========================================================
 * TODAY VALUE
 * =========================================================
 */

function RatingValue({
  name,
  value,
}: {
  name:
    string;

  value:
    number | null;
}) {
  return (
    <div
      className="
        min-w-[100px]
        rounded-[18px]
        bg-ocean-50/70
        px-4
        py-3
      "
    >
      <p
        className="
          max-w-[110px]
          truncate
          text-[11px]
          font-medium
          text-ink-soft
        "
      >
        {name}
      </p>

      <p
        className="
          mt-1
          text-xl
          font-semibold
          text-ocean-950
        "
      >
        {value ??
          "—"}

        {value !==
          null && (
          <span
            className="
              ml-0.5
              text-xs
              font-medium
              text-ink-soft
            "
          >
            /5
          </span>
        )}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PROFILE NAME
 * =========================================================
 */

function getProfileName(
  profile:
    ProfileRow | undefined,

  fallback:
    string
) {
  if (
    profile?.nickname?.trim()
  ) {
    return profile.nickname.trim();
  }

  if (
    profile?.full_name?.trim()
  ) {
    return profile.full_name.trim();
  }

  return fallback;
}

/*
 * =========================================================
 * JAKARTA DATE
 * =========================================================
 */

function getTodayInJakarta() {
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

/*
 * =========================================================
 * LAST 7 DAYS
 * =========================================================
 */

function getLastSevenDays(
  today:
    string
) {
  const [
    year,
    month,
    day,
  ] =
    today
      .split("-")
      .map(Number);

  const baseDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  return Array.from(
    {
      length: 7,
    },
    (
      _,
      index
    ) => {
      const date =
        new Date(
          baseDate
        );

      date.setUTCDate(
        date.getUTCDate() -
          (6 - index)
      );

      const dateKey =
        [
          date.getUTCFullYear(),
          String(
            date.getUTCMonth() +
              1
          ).padStart(
            2,
            "0"
          ),
          String(
            date.getUTCDate()
          ).padStart(
            2,
            "0"
          ),
        ].join("-");

      const label =
        new Intl.DateTimeFormat(
          "id-ID",
          {
            weekday:
              "short",

            day:
              "numeric",

            timeZone:
              "UTC",
          }
        ).format(
          date
        );

      return {
        date:
          dateKey,

        label,
      };
    }
  );
}