// src/components/planner/PlannerClient.tsx

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  Heart,
  MapPin,
  Plus,
  Trash2,
  WalletCards,
  XCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";

type PlanStatus =
  | "planned"
  | "done"
  | "cancelled";

type Plan = {
  id: string;

  couple_id: string;

  created_by: string;

  title: string;

  description: string | null;

  plan_date: string;

  plan_time: string | null;

  location_name: string | null;

  maps_url: string | null;

  budget: number | null;

  status: PlanStatus;

  created_at: string;

  updated_at: string;
};

type PlannerUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl: string | null;
};

type PlannerClientProps = {
  user: PlannerUser;

  coupleId: string;

  initialPlans: Plan[];
};

type PlanFormResult = {
  title: string;

  description: string;

  planDate: string;

  planTime: string;

  locationName: string;

  mapsUrl: string;

  budget: number | null;

  status: PlanStatus;
};

export default function PlannerClient({
  user,
  coupleId,
  initialPlans,
}: PlannerClientProps) {
  const [plans, setPlans] =
    useState<Plan[]>(
      initialPlans
    );

  const [filter, setFilter] =
    useState<
      "all" | PlanStatus
    >("all");

  /*
   * ============================================
   * FILTERED PLANS
   * ============================================
   */

  const filteredPlans =
    useMemo(() => {
      if (filter === "all") {
        return plans;
      }

      return plans.filter(
        (plan) =>
          plan.status === filter
      );
    }, [
      filter,
      plans,
    ]);

  /*
   * ============================================
   * SUMMARY
   * ============================================
   */

  const plannedCount =
    plans.filter(
      (plan) =>
        plan.status ===
        "planned"
    ).length;

  const doneCount =
    plans.filter(
      (plan) =>
        plan.status ===
        "done"
    ).length;

  const cancelledCount =
    plans.filter(
      (plan) =>
        plan.status ===
        "cancelled"
    ).length;

  /*
   * ============================================
   * NEXT PLAN
   * ============================================
   */

  const nextPlan =
    useMemo(() => {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      return plans
        .filter(
          (plan) => {
            if (
              plan.status !==
              "planned"
            ) {
              return false;
            }

            const planDate =
              new Date(
                `${plan.plan_date}T00:00:00`
              );

            return (
              planDate >=
              today
            );
          }
        )
        .sort(
          (a, b) =>
            new Date(
              `${a.plan_date}T${a.plan_time || "00:00"}`
            ).getTime() -
            new Date(
              `${b.plan_date}T${b.plan_time || "00:00"}`
            ).getTime()
        )[0] ?? null;
    }, [plans]);

  /*
   * ============================================
   * CREATE PLAN
   * ============================================
   */

  const handleCreate =
    async () => {
      const form =
        await openPlanForm();

      if (!form) {
        return;
      }

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from("plans")
          .insert({
            couple_id:
              coupleId,

            created_by:
              user.id,

            title:
              form.title,

            description:
              form.description ||
              null,

            plan_date:
              form.planDate,

            plan_time:
              form.planTime ||
              null,

            location_name:
              form.locationName ||
              null,

            maps_url:
              form.mapsUrl ||
              null,

            budget:
              form.budget,

            status:
              form.status,
          })
          .select()
          .single();

      if (error) {
        await Swal.fire({
          icon: "error",

          title:
            "Plan gagal dibuat",

          text:
            error.message,

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setPlans(
        (current) =>
          sortPlans([
            ...current,
            data as Plan,
          ])
      );

      await Swal.fire({
        icon: "success",

        title:
          "Plan berhasil dibuat ♡",

        text:
          "Rencana baru sudah masuk ke Love4ever.",

        timer: 1400,

        showConfirmButton:
          false,
      });
    };

  /*
   * ============================================
   * EDIT PLAN
   * ============================================
   */

  const handleEdit =
    async (
      plan: Plan
    ) => {
      const form =
        await openPlanForm(
          plan
        );

      if (!form) {
        return;
      }

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from("plans")
          .update({
            title:
              form.title,

            description:
              form.description ||
              null,

            plan_date:
              form.planDate,

            plan_time:
              form.planTime ||
              null,

            location_name:
              form.locationName ||
              null,

            maps_url:
              form.mapsUrl ||
              null,

            budget:
              form.budget,

            status:
              form.status,
          })
          .eq(
            "id",
            plan.id
          )
          .select()
          .single();

      if (error) {
        await Swal.fire({
          icon: "error",

          title:
            "Update gagal",

          text:
            error.message,

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setPlans(
        (current) =>
          sortPlans(
            current.map(
              (item) =>
                item.id ===
                plan.id
                  ? (data as Plan)
                  : item
            )
          )
      );

      await Swal.fire({
        icon: "success",

        title:
          "Plan diperbarui ♡",

        timer: 1200,

        showConfirmButton:
          false,
      });
    };

  /*
   * ============================================
   * DELETE PLAN
   * ============================================
   */

  const handleDelete =
    async (
      plan: Plan
    ) => {
      const result =
        await Swal.fire({
          icon: "warning",

          title:
            "Hapus plan?",

          text:
            `"${plan.title}" akan dihapus dari Love4ever.`,

          showCancelButton:
            true,

          confirmButtonText:
            "Hapus",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#dc5f72",

          cancelButtonColor:
            "#1688b5",
        });

      if (
        !result.isConfirmed
      ) {
        return;
      }

      const supabase =
        createClient();

      const {
        error,
      } =
        await supabase
          .from("plans")
          .delete()
          .eq(
            "id",
            plan.id
          );

      if (error) {
        await Swal.fire({
          icon: "error",

          title:
            "Gagal menghapus",

          text:
            error.message,

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setPlans(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              plan.id
          )
      );

      await Swal.fire({
        icon: "success",

        title:
          "Plan dihapus",

        timer: 1100,

        showConfirmButton:
          false,
      });
    };

  /*
   * ============================================
   * UI
   * ============================================
   */

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
          pt-4
          sm:px-6
          sm:pt-6
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
          {/* ====================================
              HEADER
          ===================================== */}

          <header
            className="
              flex
              flex-col
              gap-5
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <Link
                href="/dashboard"
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-ink-soft
                  transition
                  hover:text-ocean-700
                "
              >
                <ChevronLeft
                  size={17}
                />

                Dashboard
              </Link>

              <p
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.23em]
                  text-ocean-500
                "
              >
                Our Planner
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
                Plans for us ♡
              </h1>

              <p
                className="
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-ink-soft
                "
              >
                Simpan rencana date,
                perjalanan, wishlist,
                atau hal kecil yang
                ingin kalian lakukan
                bersama.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleCreate
              }
              className="
                love-button
                flex
                items-center
                justify-center
                gap-2
                rounded-2xl
                px-5
                py-3.5
                text-sm
                font-semibold
              "
            >
              <Plus size={18} />

              Add Plan
            </button>
          </header>

          {/* ====================================
              NEXT PLAN
          ===================================== */}

          <section
            className="
              mt-7
              grid
              gap-4
              xl:grid-cols-[1.4fr_0.6fr]
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-[32px]
                bg-gradient-to-br
                from-ocean-900
                via-ocean-700
                to-ocean-400
                p-6
                text-white
                shadow-love-lg
                sm:p-8
              "
            >
              <div
                className="
                  absolute
                  -right-16
                  -top-20
                  h-64
                  w-64
                  rounded-full
                  bg-white/10
                  blur-xl
                "
              />

              <p
                className="
                  relative
                  z-10
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.24em]
                  text-white/60
                "
              >
                Next Plan
              </p>

              {nextPlan ? (
                <div
                  className="
                    relative
                    z-10
                  "
                >
                  <h2
                    className="
                      mt-4
                      max-w-3xl
                      font-display
                      text-4xl
                      font-semibold
                      sm:text-5xl
                    "
                  >
                    {
                      nextPlan.title
                    }
                  </h2>

                  <div
                    className="
                      mt-7
                      flex
                      flex-wrap
                      gap-3
                    "
                  >
                    <InfoPill
                      icon={
                        CalendarDays
                      }
                    >
                      {formatDate(
                        nextPlan.plan_date
                      )}
                    </InfoPill>

                    {nextPlan.plan_time && (
                      <InfoPill
                        icon={
                          Clock3
                        }
                      >
                        {formatTime(
                          nextPlan.plan_time
                        )}
                      </InfoPill>
                    )}

                    {nextPlan.location_name && (
                      <InfoPill
                        icon={
                          MapPin
                        }
                      >
                        {
                          nextPlan.location_name
                        }
                      </InfoPill>
                    )}
                  </div>

                  {nextPlan.description && (
                    <p
                      className="
                        mt-6
                        max-w-2xl
                        text-sm
                        leading-7
                        text-white/70
                      "
                    >
                      {
                        nextPlan.description
                      }
                    </p>
                  )}

                  <Link
                    href={`/planner/${nextPlan.id}`}
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-2
                      rounded-2xl
                      border
                      border-white/20
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-ocean-800
                      shadow-lg
                      transition
                      hover:-translate-y-0.5
                      hover:bg-ocean-50
                    "
                  >
                    Open Plan Detail

                    <ChevronRight
                      size={17}
                    />
                  </Link>
                </div>
              ) : (
                <div
                  className="
                    relative
                    z-10
                  "
                >
                  <Heart
                    className="
                      mt-8
                      text-white/75
                    "
                    size={37}
                    fill="currentColor"
                  />

                  <h2
                    className="
                      mt-4
                      font-display
                      text-4xl
                      font-semibold
                    "
                  >
                    Belum ada rencana.
                  </h2>

                  <p
                    className="
                      mt-3
                      max-w-xl
                      leading-7
                      text-white/70
                    "
                  >
                    Mungkin waktunya
                    merencanakan date
                    kecil berikutnya ♡
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleCreate
                    }
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-2
                      rounded-2xl
                      bg-white
                      px-5
                      py-3
                      text-sm
                      font-bold
                      text-ocean-800
                      transition
                      hover:bg-ocean-50
                    "
                  >
                    <Plus
                      size={17}
                    />

                    Create First Plan
                  </button>
                </div>
              )}
            </div>

            {/* ====================================
                SUMMARY
            ===================================== */}

            <div
              className="
                grid
                grid-cols-3
                gap-3
                xl:grid-cols-1
              "
            >
              <SummaryCard
                label="Planned"
                value={
                  plannedCount
                }
                icon={
                  CalendarDays
                }
              />

              <SummaryCard
                label="Done"
                value={
                  doneCount
                }
                icon={
                  CheckCircle2
                }
              />

              <SummaryCard
                label="Cancelled"
                value={
                  cancelledCount
                }
                icon={
                  XCircle
                }
              />
            </div>
          </section>

          {/* ====================================
              FILTER
          ===================================== */}

          <section
            className="
              mt-6
              flex
              gap-2
              overflow-x-auto
              pb-1
            "
          >
            <FilterButton
              active={
                filter === "all"
              }
              onClick={() =>
                setFilter("all")
              }
            >
              All
            </FilterButton>

            <FilterButton
              active={
                filter ===
                "planned"
              }
              onClick={() =>
                setFilter(
                  "planned"
                )
              }
            >
              Planned
            </FilterButton>

            <FilterButton
              active={
                filter === "done"
              }
              onClick={() =>
                setFilter(
                  "done"
                )
              }
            >
              Done
            </FilterButton>

            <FilterButton
              active={
                filter ===
                "cancelled"
              }
              onClick={() =>
                setFilter(
                  "cancelled"
                )
              }
            >
              Cancelled
            </FilterButton>
          </section>

          {/* ====================================
              PLAN LIST
          ===================================== */}

          <section
            className="
              mt-5
              grid
              gap-4
              md:grid-cols-2
              2xl:grid-cols-3
            "
          >
            {filteredPlans.length >
            0 ? (
              filteredPlans.map(
                (plan) => (
                  <PlanCard
                    key={
                      plan.id
                    }
                    plan={
                      plan
                    }
                    onEdit={() =>
                      handleEdit(
                        plan
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        plan
                      )
                    }
                  />
                )
              )
            ) : (
              <div
                className="
                  glass-card
                  col-span-full
                  rounded-[30px]
                  px-6
                  py-16
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-[22px]
                    bg-ocean-100
                    text-ocean-600
                  "
                >
                  <CalendarDays
                    size={28}
                  />
                </div>

                <h2
                  className="
                    mt-5
                    font-display
                    text-3xl
                    font-semibold
                    text-ocean-950
                  "
                >
                  Belum ada plan ♡
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-md
                    text-sm
                    leading-7
                    text-ink-soft
                  "
                >
                  Tambahkan rencana
                  pertama kalian dan
                  mulai isi perjalanan
                  Love4ever.
                </p>

                <button
                  type="button"
                  onClick={
                    handleCreate
                  }
                  className="
                    love-button
                    mt-6
                    inline-flex
                    items-center
                    gap-2
                    rounded-2xl
                    px-5
                    py-3
                    text-sm
                    font-semibold
                  "
                >
                  <Plus
                    size={17}
                  />

                  Add First Plan
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * ============================================
 * PLAN CARD
 * ============================================
 */

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: Plan;

  onEdit: () => void;

  onDelete: () => void;
}) {
  return (
    <article
      className="
        glass-card
        flex
        h-full
        flex-col
        rounded-[28px]
        p-5
        transition
        duration-300
        hover:-translate-y-1
        hover:shadow-love
      "
    >
      {/* TOP */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <StatusBadge
          status={
            plan.status
          }
        />

        <div
          className="
            flex
            gap-1
          "
        >
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit plan"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-ocean-50
              text-ocean-700
              transition
              hover:bg-ocean-100
            "
          >
            <Edit3
              size={16}
            />
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            aria-label="Delete plan"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-heart-soft
              text-heart
              transition
              hover:opacity-80
            "
          >
            <Trash2
              size={16}
            />
          </button>
        </div>
      </div>

      {/* TITLE */}

      <h2
        className="
          mt-5
          font-display
          text-2xl
          font-semibold
          text-ocean-950
        "
      >
        {plan.title}
      </h2>

      {/* DESCRIPTION */}

      {plan.description && (
        <p
          className="
            mt-2
            line-clamp-3
            text-sm
            leading-6
            text-ink-soft
          "
        >
          {
            plan.description
          }
        </p>
      )}

      {/* INFO */}

      <div
        className="
          mt-5
          space-y-3
          border-t
          border-ocean-100
          pt-5
        "
      >
        <PlanInfo
          icon={
            CalendarDays
          }
        >
          {formatDate(
            plan.plan_date
          )}
        </PlanInfo>

        {plan.plan_time && (
          <PlanInfo
            icon={
              Clock3
            }
          >
            {formatTime(
              plan.plan_time
            )}
          </PlanInfo>
        )}

        {plan.location_name && (
          <PlanInfo
            icon={
              MapPin
            }
          >
            {
              plan.location_name
            }
          </PlanInfo>
        )}

        {plan.budget !== null && (
          <PlanInfo
            icon={
              WalletCards
            }
          >
            {formatRupiah(
              Number(
                plan.budget
              )
            )}
          </PlanInfo>
        )}
      </div>

      {/* PUSH BUTTONS TO BOTTOM */}

      <div className="mt-auto pt-5">
        {/* PLAN DETAIL */}

        <Link
          href={`/planner/${plan.id}`}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-2xl
            bg-ocean-700
            px-4
            py-3
            text-sm
            font-semibold
            text-white
            shadow-[0_10px_25px_rgba(17,107,145,0.18)]
            transition
            hover:-translate-y-0.5
            hover:bg-ocean-800
          "
        >
          View Plan Detail

          <ChevronRight
            size={16}
          />
        </Link>

        {/* MAPS */}

        {plan.maps_url && (
          <a
            href={
              plan.maps_url
            }
            target="_blank"
            rel="noreferrer"
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-ocean-100
              px-4
              py-3
              text-sm
              font-semibold
              text-ocean-700
              transition
              hover:bg-ocean-200
            "
          >
            <MapPin
              size={16}
            />

            Open Maps

            <ExternalLink
              size={14}
            />
          </a>
        )}
      </div>
    </article>
  );
}

/*
 * ============================================
 * SUMMARY CARD
 * ============================================
 */

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;

  value: number;

  icon: React.ElementType;
}) {
  return (
    <div
      className="
        glass-card
        rounded-[25px]
        p-4
        sm:p-5
      "
    >
      <Icon
        size={19}
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
          text-xs
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
 * ============================================
 * STATUS BADGE
 * ============================================
 */

function StatusBadge({
  status,
}: {
  status: PlanStatus;
}) {
  const config = {
    planned: {
      text: "Planned",

      className:
        "bg-ocean-100 text-ocean-700",
    },

    done: {
      text: "Done",

      className:
        "bg-emerald-100 text-emerald-700",
    },

    cancelled: {
      text: "Cancelled",

      className:
        "bg-heart-soft text-heart",
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`
        rounded-full
        px-3
        py-1.5
        text-[10px]
        font-bold
        uppercase
        tracking-[0.13em]
        ${item.className}
      `}
    >
      {item.text}
    </span>
  );
}

/*
 * ============================================
 * PLAN INFORMATION
 * ============================================
 */

function PlanInfo({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;

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
        size={17}
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
 * ============================================
 * NEXT PLAN INFO PILL
 * ============================================
 */

function InfoPill({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        rounded-full
        border
        border-white/15
        bg-white/10
        px-4
        py-2
        text-xs
        font-semibold
        backdrop-blur-xl
      "
    >
      <Icon size={14} />

      {children}
    </div>
  );
}

/*
 * ============================================
 * FILTER BUTTON
 * ============================================
 */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick: () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0
        rounded-full
        px-5
        py-2.5
        text-sm
        font-semibold
        transition
        ${
          active
            ? "bg-ocean-700 text-white shadow-md"
            : "border border-ocean-100 bg-white/65 text-ink-soft hover:bg-white"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * ============================================
 * SWEETALERT PLAN FORM
 * ============================================
 */

async function openPlanForm(
  plan?: Plan
): Promise<
  PlanFormResult | null
> {
  const title =
    plan
      ? "Edit Plan ♡"
      : "Add New Plan ♡";

  const result =
    await Swal.fire({
      title,

      width: 650,

      html: `
        <div style="
          text-align:left;
          display:grid;
          gap:14px;
          padding-top:8px;
        ">

          <div>
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:13px;
              font-weight:700;
              color:#0b4f71;
            ">
              Judul Plan *
            </label>

            <input
              id="plan-title"
              class="swal2-input"
              style="
                margin:0;
                width:100%;
                box-sizing:border-box;
              "
              placeholder="Contoh: Date ke pantai"
              value="${escapeHtml(
                plan?.title ??
                  ""
              )}"
            />
          </div>

          <div>
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:13px;
              font-weight:700;
              color:#0b4f71;
            ">
              Deskripsi
            </label>

            <textarea
              id="plan-description"
              class="swal2-textarea"
              style="
                margin:0;
                width:100%;
                min-height:90px;
                box-sizing:border-box;
              "
              placeholder="Mau ngapain aja?"
            >${escapeHtml(
              plan?.description ??
                ""
            )}</textarea>
          </div>

          <div style="
            display:grid;
            grid-template-columns:
              repeat(2, minmax(0,1fr));
            gap:12px;
          ">
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:13px;
                font-weight:700;
                color:#0b4f71;
              ">
                Tanggal *
              </label>

              <input
                id="plan-date"
                type="date"
                class="swal2-input"
                style="
                  margin:0;
                  width:100%;
                  box-sizing:border-box;
                "
                value="${escapeHtml(
                  plan?.plan_date ??
                    ""
                )}"
              />
            </div>

            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:13px;
                font-weight:700;
                color:#0b4f71;
              ">
                Jam
              </label>

              <input
                id="plan-time"
                type="time"
                class="swal2-input"
                style="
                  margin:0;
                  width:100%;
                  box-sizing:border-box;
                "
                value="${escapeHtml(
                  normalizeTime(
                    plan?.plan_time
                  )
                )}"
              />
            </div>
          </div>

          <div>
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:13px;
              font-weight:700;
              color:#0b4f71;
            ">
              Lokasi
            </label>

            <input
              id="plan-location"
              class="swal2-input"
              style="
                margin:0;
                width:100%;
                box-sizing:border-box;
              "
              placeholder="Contoh: Pantai Marina"
              value="${escapeHtml(
                plan?.location_name ??
                  ""
              )}"
            />
          </div>

          <div>
            <label style="
              display:block;
              margin-bottom:6px;
              font-size:13px;
              font-weight:700;
              color:#0b4f71;
            ">
              Link Maps
            </label>

            <input
              id="plan-maps"
              class="swal2-input"
              style="
                margin:0;
                width:100%;
                box-sizing:border-box;
              "
              placeholder="https://maps.google.com/..."
              value="${escapeHtml(
                plan?.maps_url ??
                  ""
              )}"
            />
          </div>

          <div style="
            display:grid;
            grid-template-columns:
              repeat(2, minmax(0,1fr));
            gap:12px;
          ">
            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:13px;
                font-weight:700;
                color:#0b4f71;
              ">
                Budget
              </label>

              <input
                id="plan-budget"
                type="number"
                min="0"
                class="swal2-input"
                style="
                  margin:0;
                  width:100%;
                  box-sizing:border-box;
                "
                placeholder="100000"
                value="${
                  plan?.budget ??
                  ""
                }"
              />
            </div>

            <div>
              <label style="
                display:block;
                margin-bottom:6px;
                font-size:13px;
                font-weight:700;
                color:#0b4f71;
              ">
                Status
              </label>

              <select
                id="plan-status"
                class="swal2-select"
                style="
                  margin:0;
                  width:100%;
                  height:48px;
                  box-sizing:border-box;
                "
              >
                <option
                  value="planned"
                  ${
                    !plan ||
                    plan.status ===
                      "planned"
                      ? "selected"
                      : ""
                  }
                >
                  Planned
                </option>

                <option
                  value="done"
                  ${
                    plan?.status ===
                    "done"
                      ? "selected"
                      : ""
                  }
                >
                  Done
                </option>

                <option
                  value="cancelled"
                  ${
                    plan?.status ===
                    "cancelled"
                      ? "selected"
                      : ""
                  }
                >
                  Cancelled
                </option>
              </select>
            </div>
          </div>
        </div>
      `,

      showCancelButton:
        true,

      confirmButtonText:
        plan
          ? "Save Changes"
          : "Create Plan",

      cancelButtonText:
        "Cancel",

      confirmButtonColor:
        "#1688b5",

      cancelButtonColor:
        "#78909c",

      focusConfirm:
        false,

      preConfirm: () => {
        const titleInput =
          document.getElementById(
            "plan-title"
          ) as HTMLInputElement;

        const descriptionInput =
          document.getElementById(
            "plan-description"
          ) as HTMLTextAreaElement;

        const dateInput =
          document.getElementById(
            "plan-date"
          ) as HTMLInputElement;

        const timeInput =
          document.getElementById(
            "plan-time"
          ) as HTMLInputElement;

        const locationInput =
          document.getElementById(
            "plan-location"
          ) as HTMLInputElement;

        const mapsInput =
          document.getElementById(
            "plan-maps"
          ) as HTMLInputElement;

        const budgetInput =
          document.getElementById(
            "plan-budget"
          ) as HTMLInputElement;

        const statusInput =
          document.getElementById(
            "plan-status"
          ) as HTMLSelectElement;

        const formTitle =
          titleInput.value.trim();

        const planDate =
          dateInput.value;

        if (!formTitle) {
          Swal.showValidationMessage(
            "Judul plan wajib diisi."
          );

          return false;
        }

        if (!planDate) {
          Swal.showValidationMessage(
            "Tanggal plan wajib diisi."
          );

          return false;
        }

        const mapsUrl =
          mapsInput.value.trim();

        if (
          mapsUrl &&
          !isValidUrl(
            mapsUrl
          )
        ) {
          Swal.showValidationMessage(
            "Link Maps harus berupa URL yang valid."
          );

          return false;
        }

        const budgetText =
          budgetInput.value.trim();

        const budget =
          budgetText
            ? Number(
                budgetText
              )
            : null;

        if (
          budget !== null &&
          (
            Number.isNaN(
              budget
            ) ||
            budget < 0
          )
        ) {
          Swal.showValidationMessage(
            "Budget tidak valid."
          );

          return false;
        }

        return {
          title:
            formTitle,

          description:
            descriptionInput.value.trim(),

          planDate,

          planTime:
            timeInput.value,

          locationName:
            locationInput.value.trim(),

          mapsUrl,

          budget,

          status:
            statusInput.value as PlanStatus,
        };
      },
    });

  if (
    !result.isConfirmed ||
    !result.value
  ) {
    return null;
  }

  return (
    result.value as PlanFormResult
  );
}

/*
 * ============================================
 * SORT PLANS
 * ============================================
 */

function sortPlans(
  plans: Plan[]
) {
  return [...plans].sort(
    (a, b) => {
      const aTime =
        new Date(
          `${a.plan_date}T${a.plan_time || "00:00"}`
        ).getTime();

      const bTime =
        new Date(
          `${b.plan_date}T${b.plan_time || "00:00"}`
        ).getTime();

      return aTime - bTime;
    }
  );
}

/*
 * ============================================
 * FORMAT DATE
 * ============================================
 */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "numeric",

      month: "long",

      year: "numeric",
    }
  ).format(
    new Date(
      `${value}T00:00:00`
    )
  );
}

/*
 * ============================================
 * FORMAT TIME
 * ============================================
 */

function formatTime(
  value: string
) {
  return value.slice(
    0,
    5
  );
}

/*
 * ============================================
 * FORMAT RUPIAH
 * ============================================
 */

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",

      currency: "IDR",

      maximumFractionDigits:
        0,
    }
  ).format(value);
}

/*
 * ============================================
 * NORMALIZE TIME
 * ============================================
 */

function normalizeTime(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
  }

  return value.slice(
    0,
    5
  );
}

/*
 * ============================================
 * VALIDATE URL
 * ============================================
 */

function isValidUrl(
  value: string
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" ||
      url.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

/*
 * ============================================
 * ESCAPE HTML
 * ============================================
 */

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}