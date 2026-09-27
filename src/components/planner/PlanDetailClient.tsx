// src/components/planner/PlanDetailClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type PlanStatus =
  | "planned"
  | "done"
  | "cancelled";

type PlanDetail = {
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

  cover_path: string | null;
  completed_at: string | null;

  created_at: string;
  updated_at: string;
};

type PlanTask = {
  id: string;
  plan_id: string;

  title: string;
  is_completed: boolean;

  created_at: string;
};

type PlannerUser = {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  avatarUrl: string | null;
};

type PlanDetailClientProps = {
  user: PlannerUser;

  initialPlan:
    PlanDetail;

  initialTasks:
    PlanTask[];

  initialCoverUrl:
    string | null;

  initialMemoryId:
    string | null;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;

  finished: boolean;
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function PlanDetailClient({
  user,
  initialPlan,
  initialTasks,
  initialCoverUrl,
  initialMemoryId,
}: PlanDetailClientProps) {
  const [
    plan,
    setPlan,
  ] =
    useState<PlanDetail>(
      initialPlan
    );

  const [
    tasks,
    setTasks,
  ] =
    useState<PlanTask[]>(
      initialTasks
    );

  const [
    coverUrl,
    setCoverUrl,
  ] =
    useState<
      string | null
    >(
      initialCoverUrl
    );

  const [
    memoryId,
    setMemoryId,
  ] =
    useState<
      string | null
    >(
      initialMemoryId
    );

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  const [
    countdown,
    setCountdown,
  ] =
    useState<Countdown>(
      () =>
        calculateCountdown(
          initialPlan
        )
    );

  /*
   * =========================================================
   * COUNTDOWN
   * =========================================================
   */

  useEffect(() => {
    setCountdown(
      calculateCountdown(
        plan
      )
    );

    const interval =
      window.setInterval(
        () => {
          setCountdown(
            calculateCountdown(
              plan
            )
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [plan]);

  /*
   * =========================================================
   * PROGRESS
   * =========================================================
   */

  const completedTasks =
    tasks.filter(
      (task) =>
        task.is_completed
    ).length;

  const progress =
    useMemo(() => {
      if (
        tasks.length ===
        0
      ) {
        return 0;
      }

      return Math.round(
        (
          completedTasks /
          tasks.length
        ) * 100
      );
    }, [
      completedTasks,
      tasks.length,
    ]);

  /*
   * =========================================================
   * ADD TASK
   * =========================================================
   */

  const handleAddTask =
    async () => {
      const result =
        await Swal.fire({
          title:
            "New Task",

          input:
            "text",

          inputPlaceholder:
            "What needs to be prepared?",

          showCancelButton:
            true,

          confirmButtonText:
            "Add",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Task cannot be empty.";
              }

              return undefined;
            },
        });

      if (
        !result.isConfirmed ||
        !result.value
      ) {
        return;
      }

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "plan_tasks"
          )
          .insert({
            plan_id:
              plan.id,

            title:
              result.value.trim(),

            is_completed:
              false,
          })
          .select()
          .single();

      if (error) {
        await showError(
          "Task could not be added",
          error.message
        );

        return;
      }

      setTasks(
        (current) => [
          ...current,
          data as PlanTask,
        ]
      );
    };

  /*
   * =========================================================
   * TOGGLE TASK
   * =========================================================
   */

  const handleToggleTask =
    async (
      task: PlanTask
    ) => {
      const newValue =
        !task.is_completed;

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              task.id
                ? {
                    ...item,
                    is_completed:
                      newValue,
                  }
                : item
          )
      );

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "plan_tasks"
          )
          .update({
            is_completed:
              newValue,
          })
          .eq(
            "id",
            task.id
          )
          .select()
          .single();

      if (error) {
        setTasks(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                task.id
                  ? task
                  : item
            )
        );

        await showError(
          "Task could not be updated",
          error.message
        );

        return;
      }

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              task.id
                ? (
                    data as PlanTask
                  )
                : item
          )
      );
    };

  /*
   * =========================================================
   * EDIT TASK
   * =========================================================
   */

  const handleEditTask =
    async (
      task: PlanTask
    ) => {
      const result =
        await Swal.fire({
          title:
            "Edit Task",

          input:
            "text",

          inputValue:
            task.title,

          showCancelButton:
            true,

          confirmButtonText:
            "Save",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

          background:
            "#fffdf9",

          color:
            "#123d59",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Task cannot be empty.";
              }

              return undefined;
            },
        });

      if (
        !result.isConfirmed ||
        !result.value
      ) {
        return;
      }

      const supabase =
        createClient();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "plan_tasks"
          )
          .update({
            title:
              result.value.trim(),
          })
          .eq(
            "id",
            task.id
          )
          .select()
          .single();

      if (error) {
        await showError(
          "Task could not be updated",
          error.message
        );

        return;
      }

      setTasks(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              task.id
                ? (
                    data as PlanTask
                  )
                : item
          )
      );
    };

  /*
   * =========================================================
   * DELETE TASK
   * =========================================================
   */

  const handleDeleteTask =
    async (
      task: PlanTask
    ) => {
      const result =
        await Swal.fire({
          title:
            "Delete task?",

          text:
            task.title,

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
          .from(
            "plan_tasks"
          )
          .delete()
          .eq(
            "id",
            task.id
          );

      if (error) {
        await showError(
          "Task could not be deleted",
          error.message
        );

        return;
      }

      setTasks(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              task.id
          )
      );
    };

  /*
   * =========================================================
   * MARK DONE
   * =========================================================
   */

  const handleMarkDone =
    async () => {
      const result =
        await Swal.fire({
          title:
            "Mark as done?",

          showCancelButton:
            true,

          confirmButtonText:
            "Done",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

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
        data,
        error,
      } =
        await supabase
          .from("plans")
          .update({
            status:
              "done",

            completed_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            plan.id
          )
          .select()
          .single();

      if (error) {
        await showError(
          "Plan could not be completed",
          error.message
        );

        return;
      }

      setPlan(
        data as PlanDetail
      );
    };

  /*
   * =========================================================
   * RESTORE
   * =========================================================
   */

  const handleRestorePlan =
    async () => {
      const result =
        await Swal.fire({
          title:
            "Restore plan?",

          text:
            memoryId
              ? "The existing Memory will stay."
              : undefined,

          showCancelButton:
            true,

          confirmButtonText:
            "Restore",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

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
        data,
        error,
      } =
        await supabase
          .from("plans")
          .update({
            status:
              "planned",

            completed_at:
              null,
          })
          .eq(
            "id",
            plan.id
          )
          .select()
          .single();

      if (error) {
        await showError(
          "Plan could not be restored",
          error.message
        );

        return;
      }

      setPlan(
        data as PlanDetail
      );
    };

  /*
   * =========================================================
   * TURN INTO MEMORY
   * =========================================================
   */

  const handleTurnIntoMemory =
    async () => {
      if (memoryId) {
        return;
      }

      if (
        plan.status !==
        "done"
      ) {
        return;
      }

      const result =
        await Swal.fire({
          title:
            "Save as Memory",

          input:
            "textarea",

          inputPlaceholder:
            "Story (optional)",

          showCancelButton:
            true,

          confirmButtonText:
            "Save",

          cancelButtonText:
            "Cancel",

          confirmButtonColor:
            "#083b59",

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
        data:
          memory,

        error:
          memoryError,
      } =
        await supabase
          .from(
            "memories"
          )
          .insert({
            couple_id:
              plan.couple_id,

            created_by:
              user.id,

            source_plan_id:
              plan.id,

            title:
              plan.title,

            story:
              result.value?.trim() ||
              plan.description ||
              null,

            memory_date:
              plan.plan_date,

            memory_time:
              plan.plan_time,

            location_name:
              plan.location_name,

            maps_url:
              plan.maps_url,
          })
          .select("id")
          .single();

      if (memoryError) {
        if (
          memoryError.code ===
          "23505"
        ) {
          await Swal.fire({
            title:
              "Memory already exists",

            confirmButtonColor:
              "#083b59",

            background:
              "#fffdf9",

            color:
              "#123d59",
          });

          return;
        }

        await showError(
          "Memory could not be created",
          memoryError.message
        );

        return;
      }

      const newMemoryId =
        memory.id;

      setMemoryId(
        newMemoryId
      );

      if (
        plan.cover_path
      ) {
        try {
          await copyPlanCoverToMemory(
            {
              planCoverPath:
                plan.cover_path,

              coupleId:
                plan.couple_id,

              memoryId:
                newMemoryId,

              userId:
                user.id,
            }
          );
        } catch (
          error
        ) {
          console.error(
            "Plan cover copy error:",
            error
          );

          await Swal.fire({
            icon:
              "warning",

            title:
              "Memory saved",

            text:
              "The cover could not be copied.",

            confirmButtonColor:
              "#083b59",

            background:
              "#fffdf9",

            color:
              "#123d59",
          });

          return;
        }
      }

      await Swal.fire({
        icon:
          "success",

        title:
          "Memory saved",

        timer:
          1100,

        showConfirmButton:
          false,

        background:
          "#fffdf9",

        color:
          "#123d59",
      });
    };

  /*
   * =========================================================
   * COVER
   * =========================================================
   */

  const handleCoverUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        await showError(
          "Invalid file",
          "Choose an image file."
        );

        event.target.value =
          "";

        return;
      }

      if (
        file.size >
        8 *
          1024 *
          1024
      ) {
        await showError(
          "File too large",
          "Maximum size is 8 MB."
        );

        event.target.value =
          "";

        return;
      }

      setIsUploading(
        true
      );

      try {
        const supabase =
          createClient();

        const extension =
          getExtension(
            file.name
          );

        const filePath =
          `${plan.couple_id}/${plan.id}/cover-${Date.now()}.${extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "plan-covers"
            )
            .upload(
              filePath,
              file,
              {
                cacheControl:
                  "3600",

                upsert:
                  false,

                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw new Error(
            uploadError.message
          );
        }

        const oldCover =
          plan.cover_path;

        const {
          data:
            updatedPlan,

          error:
            updateError,
        } =
          await supabase
            .from(
              "plans"
            )
            .update({
              cover_path:
                filePath,
            })
            .eq(
              "id",
              plan.id
            )
            .select()
            .single();

        if (
          updateError
        ) {
          await supabase.storage
            .from(
              "plan-covers"
            )
            .remove([
              filePath,
            ]);

          throw new Error(
            updateError.message
          );
        }

        const {
          data:
            signedData,

          error:
            signedError,
        } =
          await supabase.storage
            .from(
              "plan-covers"
            )
            .createSignedUrl(
              filePath,
              60 * 60
            );

        if (
          signedError
        ) {
          console.error(
            "Signed URL error:",
            signedError
          );
        }

        setPlan(
          updatedPlan as PlanDetail
        );

        setCoverUrl(
          signedData?.signedUrl ??
          null
        );

        if (
          oldCover &&
          oldCover !==
            filePath
        ) {
          await supabase.storage
            .from(
              "plan-covers"
            )
            .remove([
              oldCover,
            ]);
        }
      } catch (
        error
      ) {
        await showError(
          "Cover could not be uploaded",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsUploading(
          false
        );

        event.target.value =
          "";
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
          {/* BACK */}

          <Link
            href="/planner"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-ink-soft
              transition
              hover:text-ocean-950
            "
          >
            <ArrowLeft
              size={15}
            />

            Planner
          </Link>

          {/* =================================================
              HERO
          ================================================= */}

          <section
            className="
              relative
              mt-5
              min-h-[390px]
              overflow-hidden
              rounded-[32px]
              bg-ocean-950
              shadow-[0_24px_65px_rgba(6,42,63,0.12)]
              sm:min-h-[460px]
            "
          >
            {coverUrl ? (
              <>
                <Image
                  src={
                    coverUrl
                  }
                  alt={
                    plan.title
                  }
                  fill
                  priority
                  unoptimized
                  className="
                    object-cover
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-[linear-gradient(to_top,rgba(6,42,63,0.94)_0%,rgba(6,42,63,0.34)_55%,rgba(0,0,0,0.08)_100%)]
                  "
                />
              </>
            ) : (
              <div
                className="
                  absolute
                  inset-0
                  bg-[linear-gradient(145deg,#062a3f_0%,#0b4f71_55%,#1688b5_100%)]
                "
              />
            )}

            {/* COVER */}

            <label
              className="
                absolute
                right-5
                top-5
                z-20
                flex
                cursor-pointer
                items-center
                gap-2
                rounded-full
                border
                border-white/15
                bg-black/20
                px-4
                py-2
                text-xs
                font-medium
                text-white
                backdrop-blur-xl
                transition
                hover:bg-black/35
                sm:right-7
                sm:top-7
              "
            >
              <ImagePlus
                size={14}
              />

              {isUploading
                ? "Uploading"
                : "Cover"}

              <input
                type="file"
                accept="image/*"
                disabled={
                  isUploading
                }
                onChange={
                  handleCoverUpload
                }
                className="hidden"
              />
            </label>

            {/* CONTENT */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-10
                p-6
                text-white
                sm:p-9
                lg:p-11
              "
            >
              <StatusBadge
                status={
                  plan.status
                }
              />

              <h1
                className="
                  mt-5
                  max-w-5xl
                  font-display
                  text-[40px]
                  font-semibold
                  leading-[1.02]
                  tracking-[-0.045em]
                  sm:text-[54px]
                  lg:text-[64px]
                "
              >
                {plan.title}
              </h1>

              <div
                className="
                  mt-5
                  flex
                  max-w-4xl
                  flex-wrap
                  items-center
                  gap-x-2
                  gap-y-1
                  text-sm
                  text-white/55
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
            </div>
          </section>

          {/* =================================================
              CONTENT
          ================================================= */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1.25fr_0.75fr]
            "
          >
            {/* LEFT */}

            <div
              className="
                space-y-5
              "
            >
              {/* DESCRIPTION */}

              <Surface>
                <div
                  className="
                    p-6
                    sm:p-8
                  "
                >
                  <SectionTitle>
                    About
                  </SectionTitle>

                  <p
                    className="
                      mt-5
                      whitespace-pre-line
                      text-sm
                      leading-7
                      text-ink-soft
                      sm:text-[15px]
                    "
                  >
                    {plan.description ||
                      "No description."}
                  </p>
                </div>
              </Surface>

              {/* CHECKLIST */}

              <Surface>
                <div
                  className="
                    p-6
                    sm:p-8
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
                    <SectionTitle>
                      Checklist
                    </SectionTitle>

                    <button
                      type="button"
                      onClick={() =>
                        void handleAddTask()
                      }
                      className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-[12px]
                        bg-ocean-950
                        px-4
                        py-2.5
                        text-xs
                        font-semibold
                        text-white
                        transition
                        hover:bg-ocean-800
                      "
                    >
                      <Plus
                        size={14}
                      />

                      Add
                    </button>
                  </div>

                  {/* PROGRESS */}

                  <div
                    className="
                      mt-7
                    "
                  >
                    <div
                      className="
                        flex
                        items-end
                        justify-between
                        gap-5
                      "
                    >
                      <p
                        className="
                          text-xs
                          text-ink-soft
                        "
                      >
                        {
                          completedTasks
                        }{" "}
                        /{" "}
                        {
                          tasks.length
                        }{" "}
                        completed
                      </p>

                      <p
                        className="
                          font-display
                          text-2xl
                          font-semibold
                          text-ocean-950
                        "
                      >
                        {progress}%
                      </p>
                    </div>

                    <div
                      className="
                        mt-3
                        h-[5px]
                        overflow-hidden
                        rounded-full
                        bg-ocean-50
                      "
                    >
                      <div
                        className="
                          h-full
                          rounded-full
                          bg-ocean-800
                          transition-[width]
                          duration-500
                        "
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* TASKS */}

                  <div
                    className="
                      mt-7
                    "
                  >
                    {tasks.length >
                    0 ? (
                      <div
                        className="
                          divide-y
                          divide-ocean-100/80
                        "
                      >
                        {tasks.map(
                          (
                            task
                          ) => (
                            <TaskRow
                              key={
                                task.id
                              }
                              task={
                                task
                              }
                              onToggle={() =>
                                void handleToggleTask(
                                  task
                                )
                              }
                              onEdit={() =>
                                void handleEditTask(
                                  task
                                )
                              }
                              onDelete={() =>
                                void handleDeleteTask(
                                  task
                                )
                              }
                            />
                          )
                        )}
                      </div>
                    ) : (
                      <div
                        className="
                          py-10
                          text-center
                          text-sm
                          text-ink-soft
                        "
                      >
                        No tasks yet.
                      </div>
                    )}
                  </div>
                </div>
              </Surface>
            </div>

            {/* RIGHT */}

            <aside
              className="
                space-y-5
              "
            >
              {/* COUNTDOWN */}

              <CountdownCard
                plan={
                  plan
                }
                countdown={
                  countdown
                }
              />

              {/* DETAILS */}

              <Surface>
                <div
                  className="
                    p-6
                    sm:p-7
                  "
                >
                  <SectionTitle>
                    Details
                  </SectionTitle>

                  <div
                    className="
                      mt-6
                      divide-y
                      divide-ocean-100/80
                    "
                  >
                    <DetailRow
                      label="Date"
                      value={formatDate(
                        plan.plan_date
                      )}
                    />

                    <DetailRow
                      label="Time"
                      value={
                        plan.plan_time
                          ? formatTime(
                              plan.plan_time
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Location"
                      value={
                        plan.location_name ||
                        "—"
                      }
                    />

                    <DetailRow
                      label="Budget"
                      value={
                        plan.budget !==
                        null
                          ? formatRupiah(
                              Number(
                                plan.budget
                              )
                            )
                          : "—"
                      }
                    />
                  </div>

                  {plan.maps_url && (
                    <a
                      href={
                        plan.maps_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="
                        mt-6
                        inline-flex
                        text-sm
                        font-semibold
                        text-ocean-700
                        transition
                        hover:text-ocean-950
                      "
                    >
                      Open Maps ↗
                    </a>
                  )}
                </div>
              </Surface>

              {/* ACTION */}

              <PlanAction
                plan={
                  plan
                }
                memoryId={
                  memoryId
                }
                onMarkDone={
                  handleMarkDone
                }
                onRestore={
                  handleRestorePlan
                }
                onMemory={
                  handleTurnIntoMemory
                }
              />
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * COUNTDOWN
 * =========================================================
 */

function CountdownCard({
  plan,
  countdown,
}: {
  plan:
    PlanDetail;

  countdown:
    Countdown;
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-[28px]
        bg-ocean-950
        p-6
        text-white
        shadow-[0_18px_45px_rgba(6,42,63,0.10)]
        sm:p-7
      "
    >
      <p
        className="
          text-xs
          font-medium
          text-white/40
        "
      >
        Countdown
      </p>

      {plan.status ===
      "done" ? (
        <h2
          className="
            mt-5
            font-display
            text-[34px]
            font-semibold
            tracking-[-0.035em]
          "
        >
          Completed
        </h2>
      ) : plan.status ===
        "cancelled" ? (
        <h2
          className="
            mt-5
            font-display
            text-[34px]
            font-semibold
            tracking-[-0.035em]
          "
        >
          Cancelled
        </h2>
      ) : countdown.finished ? (
        <h2
          className="
            mt-5
            font-display
            text-[34px]
            font-semibold
            tracking-[-0.035em]
          "
        >
          Today
        </h2>
      ) : (
        <div
          className="
            mt-6
            grid
            grid-cols-4
            divide-x
            divide-white/10
          "
        >
          <CountdownValue
            value={
              countdown.days
            }
            label="Days"
          />

          <CountdownValue
            value={
              countdown.hours
            }
            label="Hours"
          />

          <CountdownValue
            value={
              countdown.minutes
            }
            label="Min"
          />

          <CountdownValue
            value={
              countdown.seconds
            }
            label="Sec"
          />
        </div>
      )}
    </section>
  );
}

function CountdownValue({
  value,
  label,
}: {
  value:
    number;

  label:
    string;
}) {
  return (
    <div
      className="
        px-2
        text-center
      "
    >
      <p
        className="
          font-display
          text-2xl
          font-semibold
          tracking-tight
        "
      >
        {String(
          value
        ).padStart(
          2,
          "0"
        )}
      </p>

      <p
        className="
          mt-1.5
          text-[9px]
          text-white/35
        "
      >
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * TASK
 * =========================================================
 */

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task:
    PlanTask;

  onToggle:
    () => void;

  onEdit:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <div
      className="
        group
        flex
        items-center
        gap-3
        py-3.5
      "
    >
      <button
        type="button"
        onClick={
          onToggle
        }
        aria-label={
          task.is_completed
            ? "Mark incomplete"
            : "Mark complete"
        }
        className={`
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-[9px]
          border
          transition

          ${
            task.is_completed
              ? "border-ocean-900 bg-ocean-900 text-white"
              : "border-ocean-200 bg-white text-transparent hover:border-ocean-500"
          }
        `}
      >
        <Check
          size={14}
        />
      </button>

      <p
        className={`
          min-w-0
          flex-1
          text-sm
          font-medium

          ${
            task.is_completed
              ? "text-ink-soft line-through"
              : "text-ocean-950"
          }
        `}
      >
        {task.title}
      </p>

      <div
        className="
          flex
          shrink-0
          opacity-60
          transition
          group-hover:opacity-100
        "
      >
        <button
          type="button"
          onClick={
            onEdit
          }
          aria-label="Edit task"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-ink-soft
            transition
            hover:bg-ocean-50
            hover:text-ocean-900
          "
        >
          <Pencil
            size={13}
          />
        </button>

        <button
          type="button"
          onClick={
            onDelete
          }
          aria-label="Delete task"
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-ink-soft
            transition
            hover:bg-heart-soft
            hover:text-heart
          "
        >
          <Trash2
            size={13}
          />
        </button>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * DETAILS
 * =========================================================
 */

function DetailRow({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div
      className="
        grid
        grid-cols-[95px_1fr]
        gap-4
        py-3.5
        first:pt-0
        last:pb-0
      "
    >
      <p
        className="
          text-xs
          text-ink-soft
        "
      >
        {label}
      </p>

      <p
        className="
          text-right
          text-sm
          font-medium
          text-ocean-950
        "
      >
        {value}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * PLAN ACTION
 * =========================================================
 */

function PlanAction({
  plan,
  memoryId,
  onMarkDone,
  onRestore,
  onMemory,
}: {
  plan:
    PlanDetail;

  memoryId:
    string | null;

  onMarkDone:
    () => void;

  onRestore:
    () => void;

  onMemory:
    () => void;
}) {
  return (
    <Surface>
      <div
        className="
          p-6
          sm:p-7
        "
      >
        {plan.status ===
        "done" ? (
          <>
            <SectionTitle>
              Completed
            </SectionTitle>

            <div
              className="
                mt-6
                space-y-3
              "
            >
              {memoryId ? (
                <PrimaryLink
                  href={`/memories/${memoryId}`}
                >
                  View Memory
                </PrimaryLink>
              ) : (
                <PrimaryButton
                  onClick={
                    onMemory
                  }
                >
                  Save as Memory
                </PrimaryButton>
              )}

              <SecondaryButton
                onClick={
                  onRestore
                }
              >
                Restore
              </SecondaryButton>
            </div>
          </>
        ) : plan.status ===
          "cancelled" ? (
          <>
            <SectionTitle>
              Cancelled
            </SectionTitle>

            <div
              className="
                mt-6
              "
            >
              <PrimaryButton
                onClick={
                  onRestore
                }
              >
                Restore
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <SectionTitle>
              Status
            </SectionTitle>

            <div
              className="
                mt-6
              "
            >
              <PrimaryButton
                onClick={
                  onMarkDone
                }
              >
                Mark as Done
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </Surface>
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
  status:
    PlanStatus;
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
        "border-white/15 bg-white/10 text-white/75",
    },

    done: {
      label:
        "Done",

      className:
        "border-emerald-200/20 bg-emerald-300/15 text-emerald-50",
    },

    cancelled: {
      label:
        "Cancelled",

      className:
        "border-rose-200/20 bg-rose-300/15 text-rose-50",
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-[10px]
        font-semibold
        backdrop-blur-md
        ${item.className}
      `}
    >
      {item.label}
    </span>
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
  children:
    ReactNode;
}) {
  return (
    <article
      className="
        overflow-hidden
        rounded-[28px]
        border
        border-ocean-100/70
        bg-white/80
        shadow-[0_14px_45px_rgba(8,59,89,0.04)]
        backdrop-blur-xl
      "
    >
      {children}
    </article>
  );
}

function SectionTitle({
  children,
}: {
  children:
    ReactNode;
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

function MetaDot() {
  return (
    <span
      className="
        h-[3px]
        w-[3px]
        rounded-full
        bg-white/35
      "
    />
  );
}

/*
 * =========================================================
 * BUTTONS
 * =========================================================
 */

function PrimaryLink({
  href,
  children,
}: {
  href:
    string;

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
        flex
        w-full
        items-center
        justify-between
        rounded-[13px]
        bg-ocean-900
        px-5
        py-3
        text-sm
        font-semibold
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

function PrimaryButton({
  children,
  onClick,
}: {
  children:
    ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="
        w-full
        rounded-[13px]
        bg-ocean-900
        px-5
        py-3
        text-sm
        font-semibold
        text-white
        transition
        hover:bg-ocean-800
      "
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children:
    ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="
        w-full
        rounded-[13px]
        border
        border-ocean-100
        bg-white
        px-5
        py-3
        text-sm
        font-semibold
        text-ocean-800
        transition
        hover:bg-ocean-50
      "
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * COPY COVER TO MEMORY
 * =========================================================
 */

type CopyPlanCoverParams = {
  planCoverPath:
    string;

  coupleId:
    string;

  memoryId:
    string;

  userId:
    string;
};

async function copyPlanCoverToMemory({
  planCoverPath,
  coupleId,
  memoryId,
  userId,
}: CopyPlanCoverParams) {
  const supabase =
    createClient();

  const {
    data:
      coverBlob,

    error:
      downloadError,
  } =
    await supabase.storage
      .from(
        "plan-covers"
      )
      .download(
        planCoverPath
      );

  if (
    downloadError ||
    !coverBlob
  ) {
    throw new Error(
      downloadError?.message ||
      "Plan cover could not be read."
    );
  }

  const extension =
    getExtension(
      planCoverPath
    );

  const fileName =
    `plan-cover-${crypto.randomUUID()}.${extension}`;

  const storagePath =
    `${coupleId}/${memoryId}/${fileName}`;

  const {
    error:
      uploadError,
  } =
    await supabase.storage
      .from(
        "memory-photos"
      )
      .upload(
        storagePath,
        coverBlob,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            coverBlob.type ||
            "image/jpeg",
        }
      );

  if (
    uploadError
  ) {
    throw new Error(
      uploadError.message
    );
  }

  const {
    error:
      photoError,
  } =
    await supabase
      .from(
        "memory_photos"
      )
      .insert({
        memory_id:
          memoryId,

        uploaded_by:
          userId,

        storage_path:
          storagePath,

        caption:
          null,

        is_cover:
          true,

        sort_order:
          0,
      });

  if (
    photoError
  ) {
    await supabase.storage
      .from(
        "memory-photos"
      )
      .remove([
        storagePath,
      ]);

    throw new Error(
      photoError.message
    );
  }

  return storagePath;
}

/*
 * =========================================================
 * COUNTDOWN
 * =========================================================
 */

function calculateCountdown(
  plan:
    PlanDetail
): Countdown {
  const time =
    plan.plan_time
      ? plan.plan_time.slice(
          0,
          5
        )
      : "00:00";

  const target =
    new Date(
      `${plan.plan_date}T${time}:00`
    );

  const difference =
    target.getTime() -
    Date.now();

  if (
    difference <= 0
  ) {
    return {
      days:
        0,

      hours:
        0,

      minutes:
        0,

      seconds:
        0,

      finished:
        true,
    };
  }

  return {
    days:
      Math.floor(
        difference /
          (
            1000 *
            60 *
            60 *
            24
          )
      ),

    hours:
      Math.floor(
        (
          difference /
          (
            1000 *
            60 *
            60
          )
        ) % 24
      ),

    minutes:
      Math.floor(
        (
          difference /
          (
            1000 *
            60
          )
        ) % 60
      ),

    seconds:
      Math.floor(
        (
          difference /
          1000
        ) % 60
      ),

    finished:
      false,
  };
}

/*
 * =========================================================
 * FORMAT
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

function getExtension(
  fileName: string
) {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ""
      );

  return (
    extension ||
    "jpg"
  );
}

/*
 * =========================================================
 * ERROR
 * =========================================================
 */

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

    confirmButtonText:
      "OK",

    confirmButtonColor:
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}