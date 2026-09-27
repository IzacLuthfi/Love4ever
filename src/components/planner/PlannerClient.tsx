// src/components/planner/PlannerClient.tsx

"use client";

import Link from "next/link";

import {
  type ReactNode,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";

import {
  differenceInDays,
  getTodayInJakarta,
} from "@/utils/date";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

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

type PlanFilter =
  | "all"
  | PlanStatus;

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function PlannerClient({
  user,
  coupleId,
  initialPlans,
}: PlannerClientProps) {
  const [
    plans,
    setPlans,
  ] =
    useState<Plan[]>(
      initialPlans
    );

  const [
    filter,
    setFilter,
  ] =
    useState<PlanFilter>(
      "all"
    );

  const today =
    getTodayInJakarta();

  /*
   * =========================================================
   * COUNTS
   * =========================================================
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
   * =========================================================
   * FILTER
   * =========================================================
   */

  const filteredPlans =
    useMemo(() => {
      const selected =
        filter === "all"
          ? plans
          : plans.filter(
              (plan) =>
                plan.status ===
                filter
            );

      return sortPlans(
        selected
      );
    }, [
      filter,
      plans,
    ]);

  /*
   * =========================================================
   * NEXT PLAN
   * =========================================================
   */

  const nextPlan =
    useMemo(() => {
      return sortPlans(
        plans.filter(
          (plan) =>
            plan.status ===
              "planned" &&
            plan.plan_date >=
              today
        )
      )[0] ?? null;
    }, [
      plans,
      today,
    ]);

  /*
   * =========================================================
   * CREATE
   * =========================================================
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
        await showError(
          "Plan could not be created",
          error.message
        );

        return;
      }

      setPlans(
        (current) =>
          sortPlans([
            ...current,
            data as Plan,
          ])
      );

      await showSuccess(
        "Plan created"
      );
    };

  /*
   * =========================================================
   * EDIT
   * =========================================================
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
        await showError(
          "Plan could not be updated",
          error.message
        );

        return;
      }

      setPlans(
        (current) =>
          sortPlans(
            current.map(
              (item) =>
                item.id ===
                plan.id
                  ? (
                      data as Plan
                    )
                  : item
            )
          )
      );

      await showSuccess(
        "Plan updated"
      );
    };

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete =
    async (
      plan: Plan
    ) => {
      const result =
        await Swal.fire({
          title:
            "Delete plan?",

          text:
            plan.title,

          showCancelButton:
            true,

          confirmButtonText:
            "Delete",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#d85f72",

          background:
            "#fffdf9",

          color:
            "#123d59",
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
        await showError(
          "Plan could not be deleted",
          error.message
        );

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
    };

  /*
   * =========================================================
   * OPTIONS
   * =========================================================
   */

  const handleOptions =
    async (
      plan: Plan
    ) => {
      const result =
        await Swal.fire({
          title:
            plan.title,

          showCancelButton:
            true,

          showDenyButton:
            true,

          confirmButtonText:
            "Edit",

          denyButtonText:
            "Delete",

          cancelButtonText:
            "Close",

          confirmButtonColor:
            "#083b59",

          denyButtonColor:
            "#d85f72",

          background:
            "#fffdf9",

          color:
            "#123d59",
        });

      if (
        result.isConfirmed
      ) {
        await handleEdit(
          plan
        );
      }

      if (
        result.isDenied
      ) {
        await handleDelete(
          plan
        );
      }
    };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className="
        min-h-[100svh]
        bg-[linear-gradient(145deg,#f5fbfd_0%,#fffdf9_52%,#f8f2e9_100%)]
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
              gap-5
            "
          >
            <h1
              className="
                font-display
                text-[34px]
                font-semibold
                leading-none
                tracking-[-0.035em]
                text-ocean-950
                sm:text-[40px]
              "
            >
              Planner
            </h1>

            <button
              type="button"
              onClick={() =>
                void handleCreate()
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-[13px]
                bg-ocean-950
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-[0_8px_22px_rgba(6,42,63,0.12)]
                transition
                hover:bg-ocean-800
                active:scale-[0.98]
              "
            >
              <Plus
                size={15}
              />

              Add Plan
            </button>
          </header>

          {/* =================================================
              FEATURED
          ================================================= */}

          <section
            className="
              mt-8
              grid
              gap-5
              xl:grid-cols-[1fr_340px]
            "
          >
            <NextPlan
              plan={
                nextPlan
              }
              today={
                today
              }
              onCreate={
                handleCreate
              }
            />

            <PlanSummary
              total={
                plans.length
              }
              planned={
                plannedCount
              }
              done={
                doneCount
              }
              cancelled={
                cancelledCount
              }
            />
          </section>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div
            className="
              mt-8
              flex
              items-end
              justify-between
              gap-5
              border-b
              border-ocean-100/80
            "
          >
            <div
              className="
                flex
                gap-7
                overflow-x-auto
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              <FilterButton
                active={
                  filter ===
                  "all"
                }
                onClick={() =>
                  setFilter(
                    "all"
                  )
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
                  filter ===
                  "done"
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
            </div>

            <p
              className="
                hidden
                pb-3.5
                text-xs
                text-ink-soft
                sm:block
              "
            >
              {
                filteredPlans.length
              }{" "}
              {filteredPlans.length ===
              1
                ? "plan"
                : "plans"}
            </p>
          </div>

          {/* =================================================
              LIST
          ================================================= */}

          {filteredPlans.length >
          0 ? (
            <section
              className="
                mt-6
                grid
                gap-4
                md:grid-cols-2
                2xl:grid-cols-3
              "
            >
              {filteredPlans.map(
                (plan) => (
                  <PlanCard
                    key={
                      plan.id
                    }
                    plan={
                      plan
                    }
                    onOptions={() =>
                      void handleOptions(
                        plan
                      )
                    }
                  />
                )
              )}
            </section>
          ) : (
            <EmptyPlans
              hasPlans={
                plans.length >
                0
              }
              onCreate={
                handleCreate
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * NEXT PLAN
 * =========================================================
 */

function NextPlan({
  plan,
  today,
  onCreate,
}: {
  plan:
    | Plan
    | null;

  today: string;

  onCreate:
    () => void;
}) {
  if (!plan) {
    return (
      <section
        className="
          flex
          min-h-[330px]
          flex-col
          rounded-[30px]
          bg-ocean-950
          p-7
          text-white
          shadow-[0_22px_55px_rgba(6,42,63,0.12)]
          sm:p-9
        "
      >
        <p
          className="
            text-xs
            font-medium
            text-white/40
          "
        >
          Next Plan
        </p>

        <h2
          className="
            mt-5
            max-w-xl
            font-display
            text-[38px]
            font-semibold
            leading-[1.08]
            tracking-[-0.035em]
          "
        >
          Nothing planned yet.
        </h2>

        <button
          type="button"
          onClick={
            onCreate
          }
          className="
            mt-auto
            w-fit
            rounded-[13px]
            bg-white
            px-5
            py-2.5
            text-sm
            font-semibold
            text-ocean-950
            transition
            hover:bg-white/90
          "
        >
          Add Plan
        </button>
      </section>
    );
  }

  const distance =
    differenceInDays(
      today,
      plan.plan_date
    );

  return (
    <section
      className="
        relative
        min-h-[330px]
        overflow-hidden
        rounded-[30px]
        bg-ocean-950
        p-7
        text-white
        shadow-[0_22px_55px_rgba(6,42,63,0.12)]
        sm:p-9
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-28
          -top-32
          h-80
          w-80
          rounded-full
          bg-ocean-400/10
          blur-[90px]
        "
      />

      <div
        className="
          relative
          z-10
          flex
          min-h-[258px]
          flex-col
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-5
          "
        >
          <p
            className="
              text-xs
              font-medium
              text-white/40
            "
          >
            Next Plan
          </p>

          <p
            className="
              text-xs
              font-medium
              text-white/45
            "
          >
            {getDistanceLabel(
              distance
            )}
          </p>
        </div>

        <h2
          className="
            mt-5
            max-w-3xl
            font-display
            text-[38px]
            font-semibold
            leading-[1.06]
            tracking-[-0.04em]
            sm:text-[46px]
          "
        >
          {plan.title}
        </h2>

        <div
          className="
            mt-5
            flex
            flex-wrap
            items-center
            gap-x-2
            gap-y-1
            text-sm
            text-white/50
          "
        >
          <span>
            {formatDate(
              plan.plan_date
            )}
          </span>

          {plan.plan_time && (
            <>
              <MetaDot />

              <span>
                {formatTime(
                  plan.plan_time
                )}
              </span>
            </>
          )}

          {plan.location_name && (
            <>
              <MetaDot />

              <span>
                {
                  plan.location_name
                }
              </span>
            </>
          )}
        </div>

        {plan.description && (
          <p
            className="
              mt-6
              max-w-2xl
              line-clamp-2
              text-sm
              leading-7
              text-white/50
            "
          >
            {
              plan.description
            }
          </p>
        )}

        <div
          className="
            mt-auto
            pt-8
          "
        >
          <LightLink
            href={`/planner/${plan.id}`}
          >
            Open
          </LightLink>
        </div>
      </div>
    </section>
  );
}

/*
 * =========================================================
 * SUMMARY
 * =========================================================
 */

function PlanSummary({
  total,
  planned,
  done,
  cancelled,
}: {
  total: number;
  planned: number;
  done: number;
  cancelled: number;
}) {
  return (
    <section
      className="
        flex
        min-h-[330px]
        flex-col
        rounded-[30px]
        border
        border-ocean-100/70
        bg-white/80
        p-7
        shadow-[0_16px_50px_rgba(8,59,89,0.045)]
        backdrop-blur-xl
      "
    >
      <p
        className="
          text-xs
          font-medium
          text-ink-soft
        "
      >
        Plans
      </p>

      <p
        className="
          mt-4
          font-display
          text-[52px]
          font-semibold
          leading-none
          tracking-[-0.05em]
          text-ocean-950
        "
      >
        {total}
      </p>

      <div
        className="
          mt-auto
          divide-y
          divide-ocean-100/80
        "
      >
        <SummaryRow
          label="Planned"
          value={
            planned
          }
        />

        <SummaryRow
          label="Done"
          value={
            done
          }
        />

        <SummaryRow
          label="Cancelled"
          value={
            cancelled
          }
        />
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        py-3
        first:pt-0
        last:pb-0
      "
    >
      <span
        className="
          text-sm
          text-ink-soft
        "
      >
        {label}
      </span>

      <span
        className="
          font-display
          text-xl
          font-semibold
          text-ocean-950
        "
      >
        {value}
      </span>
    </div>
  );
}

/*
 * =========================================================
 * PLAN CARD
 * =========================================================
 */

function PlanCard({
  plan,
  onOptions,
}: {
  plan: Plan;
  onOptions:
    () => void;
}) {
  return (
    <article
      className="
        group
        flex
        min-h-[320px]
        flex-col
        rounded-[25px]
        border
        border-ocean-100/70
        bg-white/80
        p-6
        shadow-[0_10px_35px_rgba(8,59,89,0.035)]
        backdrop-blur-xl
        transition
        duration-300
        hover:-translate-y-0.5
        hover:shadow-[0_18px_45px_rgba(8,59,89,0.075)]
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
        <StatusBadge
          status={
            plan.status
          }
        />

        <button
          type="button"
          onClick={
            onOptions
          }
          aria-label="Plan options"
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            text-ink-soft
            transition
            hover:bg-ocean-50
            hover:text-ocean-950
          "
        >
          <MoreHorizontal
            size={17}
          />
        </button>
      </div>

      <h2
        className="
          mt-5
          font-display
          text-[26px]
          font-semibold
          leading-[1.15]
          tracking-[-0.03em]
          text-ocean-950
        "
      >
        {plan.title}
      </h2>

      {plan.description && (
        <p
          className="
            mt-3
            line-clamp-2
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
          {formatDate(
            plan.plan_date
          )}
        </p>

        {plan.plan_time && (
          <p>
            {formatTime(
              plan.plan_time
            )}
          </p>
        )}

        {plan.location_name && (
          <p>
            {
              plan.location_name
            }
          </p>
        )}

        {plan.budget !==
          null && (
          <p>
            {formatRupiah(
              Number(
                plan.budget
              )
            )}
          </p>
        )}
      </div>

      <div
        className="
          mt-auto
          flex
          items-end
          justify-between
          gap-4
          pt-7
        "
      >
        <PrimaryLink
          href={`/planner/${plan.id}`}
        >
          Open
        </PrimaryLink>

        {plan.maps_url && (
          <a
            href={
              plan.maps_url
            }
            target="_blank"
            rel="noreferrer"
            className="
              pb-2.5
              text-xs
              font-medium
              text-ocean-600
              transition
              hover:text-ocean-950
            "
          >
            Maps ↗
          </a>
        )}
      </div>
    </article>
  );
}

/*
 * =========================================================
 * STATUS
 * =========================================================
 */

function StatusBadge({
  status,
}: {
  status: PlanStatus;
}) {
  const config: Record<
    PlanStatus,
    {
      label: string;
      className: string;
    }
  > = {
    planned: {
      label:
        "Planned",

      className:
        "bg-ocean-50 text-ocean-700",
    },

    done: {
      label:
        "Done",

      className:
        "bg-emerald-50 text-emerald-700",
    },

    cancelled: {
      label:
        "Cancelled",

      className:
        "bg-heart-soft/70 text-heart",
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
        font-semibold
        ${item.className}
      `}
    >
      {item.label}
    </span>
  );
}

/*
 * =========================================================
 * FILTER
 * =========================================================
 */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick:
    () => void;
  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        shrink-0
        pb-3.5
        text-sm
        font-medium
        transition

        ${
          active
            ? "text-ocean-950"
            : "text-ink-soft hover:text-ocean-800"
        }

        after:absolute
        after:bottom-0
        after:left-0
        after:h-[2px]
        after:w-full
        after:origin-left
        after:rounded-full
        after:bg-ocean-900
        after:transition-transform

        ${
          active
            ? "after:scale-x-100"
            : "after:scale-x-0"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * EMPTY
 * =========================================================
 */

function EmptyPlans({
  hasPlans,
  onCreate,
}: {
  hasPlans:
    boolean;

  onCreate:
    () => void;
}) {
  return (
    <section
      className="
        flex
        min-h-[420px]
        flex-col
        items-center
        justify-center
        text-center
      "
    >
      <h2
        className="
          font-display
          text-[30px]
          font-semibold
          tracking-[-0.03em]
          text-ocean-950
        "
      >
        {hasPlans
          ? "No plans here."
          : "No plans yet."}
      </h2>

      {!hasPlans && (
        <button
          type="button"
          onClick={
            onCreate
          }
          className="
            mt-6
            rounded-[13px]
            bg-ocean-950
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-ocean-800
          "
        >
          Add Plan
        </button>
      )}
    </section>
  );
}

/*
 * =========================================================
 * LINKS
 * =========================================================
 */

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children:
    ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      style={{
        color:
          "#ffffff",
      }}
      className="
        group
        inline-flex
        items-center
        gap-2
        rounded-[13px]
        bg-ocean-900
        px-5
        py-2.5
        text-sm
        font-semibold
        shadow-[0_8px_20px_rgba(8,59,89,0.12)]
        transition
        hover:bg-ocean-800
      "
    >
      {children}

      <ArrowRight
        size={14}
        className="
          transition-transform
          group-hover:translate-x-0.5
        "
      />
    </Link>
  );
}

function LightLink({
  href,
  children,
}: {
  href: string;
  children:
    ReactNode;
}) {
  return (
    <Link
      href={
        href
      }
      style={{
        color:
          "#062a3f",
      }}
      className="
        group
        inline-flex
        items-center
        gap-2
        rounded-[13px]
        bg-white
        px-5
        py-2.5
        text-sm
        font-semibold
        shadow-[0_8px_25px_rgba(0,0,0,0.08)]
        transition
        hover:bg-white/90
      "
    >
      {children}

      <ArrowRight
        size={14}
        className="
          transition-transform
          group-hover:translate-x-0.5
        "
      />
    </Link>
  );
}

function MetaDot() {
  return (
    <span
      className="
        h-[3px]
        w-[3px]
        rounded-full
        bg-white/30
      "
    />
  );
}

/*
 * =========================================================
 * PLAN FORM
 * =========================================================
 */

async function openPlanForm(
  plan?: Plan
): Promise<
  PlanFormResult | null
> {
  const result =
    await Swal.fire({
      title:
        plan
          ? "Edit Plan"
          : "New Plan",

      width:
        650,

      background:
        "#fffdf9",

      color:
        "#123d59",

      html: `
        <div
          style="
            text-align:left;
            display:grid;
            gap:16px;
            padding-top:8px;
          "
        >
          ${formField(
            "Title",
            `
              <input
                id="plan-title"
                class="swal2-input"
                style="${swalInputStyle}"
                value="${escapeHtml(
                  plan?.title ??
                    ""
                )}"
              />
            `
          )}

          ${formField(
            "Description",
            `
              <textarea
                id="plan-description"
                class="swal2-textarea"
                style="${swalTextareaStyle}"
              >${escapeHtml(
                plan?.description ??
                  ""
              )}</textarea>
            `
          )}

          <div
            style="
              display:grid;
              grid-template-columns:repeat(2,minmax(0,1fr));
              gap:12px;
            "
          >
            ${formField(
              "Date",
              `
                <input
                  id="plan-date"
                  type="date"
                  class="swal2-input"
                  style="${swalInputStyle}"
                  value="${escapeHtml(
                    plan?.plan_date ??
                      ""
                  )}"
                />
              `
            )}

            ${formField(
              "Time",
              `
                <input
                  id="plan-time"
                  type="time"
                  class="swal2-input"
                  style="${swalInputStyle}"
                  value="${escapeHtml(
                    normalizeTime(
                      plan?.plan_time
                    )
                  )}"
                />
              `
            )}
          </div>

          ${formField(
            "Location",
            `
              <input
                id="plan-location"
                class="swal2-input"
                style="${swalInputStyle}"
                value="${escapeHtml(
                  plan?.location_name ??
                    ""
                )}"
              />
            `
          )}

          ${formField(
            "Maps",
            `
              <input
                id="plan-maps"
                class="swal2-input"
                style="${swalInputStyle}"
                placeholder="https://..."
                value="${escapeHtml(
                  plan?.maps_url ??
                    ""
                )}"
              />
            `
          )}

          <div
            style="
              display:grid;
              grid-template-columns:repeat(2,minmax(0,1fr));
              gap:12px;
            "
          >
            ${formField(
              "Budget",
              `
                <input
                  id="plan-budget"
                  type="number"
                  min="0"
                  class="swal2-input"
                  style="${swalInputStyle}"
                  value="${
                    plan?.budget ??
                    ""
                  }"
                />
              `
            )}

            ${formField(
              "Status",
              `
                <select
                  id="plan-status"
                  class="swal2-select"
                  style="${swalSelectStyle}"
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
              `
            )}
          </div>
        </div>
      `,

      showCancelButton:
        true,

      confirmButtonText:
        plan
          ? "Save"
          : "Create",

      cancelButtonText:
        "Cancel",

      confirmButtonColor:
        "#083b59",

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

        const title =
          titleInput.value.trim();

        const planDate =
          dateInput.value;

        if (!title) {
          Swal.showValidationMessage(
            "Title is required."
          );

          return false;
        }

        if (!planDate) {
          Swal.showValidationMessage(
            "Date is required."
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
            "Maps must be a valid URL."
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
            "Budget is not valid."
          );

          return false;
        }

        return {
          title,

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

const swalInputStyle =
  "margin:0;width:100%;height:46px;box-sizing:border-box;border-radius:12px;border:1px solid #cbeef7;box-shadow:none;";

const swalTextareaStyle =
  "margin:0;width:100%;min-height:90px;box-sizing:border-box;border-radius:12px;border:1px solid #cbeef7;box-shadow:none;resize:vertical;";

const swalSelectStyle =
  "margin:0;width:100%;height:46px;box-sizing:border-box;border-radius:12px;border:1px solid #cbeef7;box-shadow:none;";

function formField(
  label: string,
  content: string
) {
  return `
    <div>
      <label
        style="
          display:block;
          margin-bottom:7px;
          font-size:12px;
          font-weight:600;
          color:#123d59;
        "
      >
        ${label}
      </label>

      ${content}
    </div>
  `;
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function sortPlans(
  plans: Plan[]
) {
  return [
    ...plans,
  ].sort(
    (
      a,
      b
    ) => {
      const aTime =
        new Date(
          `${a.plan_date}T${a.plan_time || "00:00"}`
        ).getTime();

      const bTime =
        new Date(
          `${b.plan_date}T${b.plan_time || "00:00"}`
        ).getTime();

      return (
        aTime -
        bTime
      );
    }
  );
}

function getDistanceLabel(
  days: number
) {
  if (
    days === 0
  ) {
    return "Today";
  }

  if (
    days === 1
  ) {
    return "Tomorrow";
  }

  return `In ${days} days`;
}

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

function formatTime(
  value: string
) {
  return value.slice(
    0,
    5
  );
}

function formatRupiah(
  value: number
) {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style:
        "currency",

      currency:
        "IDR",

      maximumFractionDigits:
        0,
    }
  ).format(
    value
  );
}

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

function isValidUrl(
  value: string
) {
  try {
    const url =
      new URL(
        value
      );

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

async function showSuccess(
  title: string
) {
  await Swal.fire({
    icon:
      "success",

    title,

    timer:
      950,

    showConfirmButton:
      false,

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}

async function showError(
  title: string,
  message: string
) {
  await Swal.fire({
    icon:
      "error",

    title,

    text:
      message,

    confirmButtonColor:
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}