// src/components/planner/PlanDetailClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Heart,
  ImagePlus,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  WalletCards,
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

  initialPlan: PlanDetail;

  initialTasks: PlanTask[];

  initialCoverUrl:
    | string
    | null;

  initialMemoryId:
    | string
    | null;
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
  const [plan, setPlan] =
    useState<PlanDetail>(
      initialPlan
    );

  const [tasks, setTasks] =
    useState<PlanTask[]>(
      initialTasks
    );

  const [
    coverUrl,
    setCoverUrl,
  ] = useState<
    string | null
  >(
    initialCoverUrl
  );

  const [
    memoryId,
    setMemoryId,
  ] = useState<
    string | null
  >(
    initialMemoryId
  );

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    countdown,
    setCountdown,
  ] = useState<Countdown>(
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
   * CHECKLIST PROGRESS
   * =========================================================
   */

  const progress =
    useMemo(() => {
      if (
        tasks.length ===
        0
      ) {
        return 0;
      }

      const completed =
        tasks.filter(
          (task) =>
            task.is_completed
        ).length;

      return Math.round(
        (
          completed /
          tasks.length
        ) *
          100
      );
    }, [tasks]);

  const completedTasks =
    tasks.filter(
      (task) =>
        task.is_completed
    ).length;

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
            "Tambah Checklist",

          input: "text",

          inputLabel:
            "Apa yang harus disiapkan?",

          inputPlaceholder:
            "Contoh: Bawa kamera",

          showCancelButton:
            true,

          confirmButtonText:
            "Tambah",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          cancelButtonColor:
            "#78909c",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist tidak boleh kosong.";
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
          "Checklist gagal dibuat",
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

      await Swal.fire({
        icon: "success",

        title:
          "Checklist ditambahkan",

        timer: 900,

        showConfirmButton:
          false,
      });
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
      const supabase =
        createClient();

      const newValue =
        !task.is_completed;

      /*
       * Optimistic update supaya
       * checklist terasa instant.
       */

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
        /*
         * Rollback jika database gagal.
         */

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
          "Checklist gagal diperbarui",
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
                ? (data as PlanTask)
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
            "Edit Checklist",

          input: "text",

          inputValue:
            task.title,

          showCancelButton:
            true,

          confirmButtonText:
            "Simpan",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          cancelButtonColor:
            "#78909c",

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Checklist tidak boleh kosong.";
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
          "Checklist gagal diperbarui",
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
                ? (data as PlanTask)
                : item
          )
      );

      await Swal.fire({
        icon: "success",

        title:
          "Checklist diperbarui",

        timer: 900,

        showConfirmButton:
          false,
      });
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
          icon: "warning",

          title:
            "Hapus checklist?",

          text:
            task.title,

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
          "Checklist gagal dihapus",
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

      await Swal.fire({
        icon: "success",

        title:
          "Checklist dihapus",

        timer: 900,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * MARK PLAN AS DONE
   * =========================================================
   */

  const handleMarkDone =
    async () => {
      const result =
        await Swal.fire({
          icon: "question",

          title:
            "Tandai selesai?",

          text:
            "Plan ini akan dipindahkan ke status Done.",

          showCancelButton:
            true,

          confirmButtonText:
            "Mark as Done",

          cancelButtonText:
            "Belum",

          confirmButtonColor:
            "#1688b5",

          cancelButtonColor:
            "#78909c",
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
              new Date().toISOString(),
          })
          .eq(
            "id",
            plan.id
          )
          .select()
          .single();

      if (error) {
        await showError(
          "Plan gagal diselesaikan",
          error.message
        );

        return;
      }

      setPlan(
        data as PlanDetail
      );

      await Swal.fire({
        icon: "success",

        title:
          "Plan selesai",

        text:
          "Sekarang plan ini bisa dijadikan Memory.",

        timer: 1500,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * RESTORE PLAN
   * =========================================================
   */

  const handleRestorePlan =
    async () => {
      const result =
        await Swal.fire({
          icon: "question",

          title:
            "Kembalikan ke Planned?",

          text:
            memoryId
              ? "Memory yang sudah dibuat tidak akan ikut dihapus."
              : "Status plan akan kembali menjadi Planned.",

          showCancelButton:
            true,

          confirmButtonText:
            "Restore",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          cancelButtonColor:
            "#78909c",
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
          "Status gagal diperbarui",
          error.message
        );

        return;
      }

      setPlan(
        data as PlanDetail
      );

      await Swal.fire({
        icon: "success",

        title:
          "Plan dikembalikan",

        timer: 1000,

        showConfirmButton:
          false,
      });
    };

  /*
   * =========================================================
   * TURN PLAN INTO MEMORY
   * =========================================================
   */

  const handleTurnIntoMemory =
  async () => {
    if (memoryId) {
      await Swal.fire({
        icon: "info",
        title:
          "Sudah menjadi Memory",
        text:
          "Plan ini sudah pernah dimasukkan ke Memories.",
        confirmButtonColor:
          "#1688b5",
      });

      return;
    }

    if (
      plan.status !==
      "done"
    ) {
      await Swal.fire({
        icon: "info",
        title:
          "Plan belum selesai",
        text:
          "Tandai plan sebagai Done terlebih dahulu.",
        confirmButtonColor:
          "#1688b5",
      });

      return;
    }

    /*
     * ==========================================
     * ASK FOR MEMORY STORY
     * ==========================================
     */

    const result =
      await Swal.fire({
        title:
          "Turn into Memory",

        width: 620,

        html: `
          <div
            style="
              text-align:left;
              padding-top:8px;
            "
          >
            <label
              style="
                display:block;
                margin-bottom:8px;
                font-size:13px;
                font-weight:700;
                color:#0b4f71;
              "
            >
              Ceritakan sedikit tentang hari ini
            </label>

            <textarea
              id="memory-story"
              class="swal2-textarea"
              style="
                margin:0;
                width:100%;
                min-height:130px;
                box-sizing:border-box;
              "
              placeholder="Contoh: Hari ini seru banget..."
            ></textarea>

            ${
              plan.cover_path
                ? `
                  <div
                    style="
                      margin-top:14px;
                      padding:12px 14px;
                      background:#e8f8fc;
                      border-radius:12px;
                      color:#116b91;
                      font-size:12px;
                      line-height:1.6;
                    "
                  >
                    Cover dari plan ini akan
                    otomatis digunakan sebagai
                    cover Memory.
                  </div>
                `
                : ""
            }

            <p
              style="
                margin-top:12px;
                font-size:12px;
                line-height:1.6;
                color:#648196;
              "
            >
              Judul, tanggal, waktu, lokasi,
              dan Maps akan diambil otomatis
              dari plan.
            </p>
          </div>
        `,

        showCancelButton:
          true,

        confirmButtonText:
          "Save Memory",

        cancelButtonText:
          "Batal",

        confirmButtonColor:
          "#1688b5",

        cancelButtonColor:
          "#78909c",

        focusConfirm:
          false,

        preConfirm: () => {
          const input =
            document.getElementById(
              "memory-story"
            ) as HTMLTextAreaElement | null;

          return (
            input?.value.trim() ??
            ""
          );
        },
      });

    if (
      !result.isConfirmed
    ) {
      return;
    }

    const supabase =
      createClient();

    /*
     * ==========================================
     * CREATE MEMORY
     * ==========================================
     */

    const {
      data: memory,
      error:
        memoryError,
    } =
      await supabase
        .from("memories")
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
            result.value ||
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
      /*
       * Unique constraint:
       * satu plan hanya boleh
       * menjadi satu memory.
       */

      if (
        memoryError.code ===
        "23505"
      ) {
        await Swal.fire({
          icon: "info",

          title:
            "Sudah menjadi Memory",

          text:
            "Plan ini sudah pernah dimasukkan ke Memories.",

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      await showError(
        "Memory gagal dibuat",
        memoryError.message
      );

      return;
    }

    const newMemoryId =
      memory.id;

    /*
     * Set langsung supaya UI tahu
     * memory sudah berhasil dibuat.
     */

    setMemoryId(
      newMemoryId
    );

    /*
     * ==========================================
     * COPY PLAN COVER → MEMORY COVER
     * ==========================================
     */

    let coverCopied =
      false;

    let coverCopyError:
      string | null =
      null;

    if (
      plan.cover_path
    ) {
      try {
        await copyPlanCoverToMemory({
          planCoverPath:
            plan.cover_path,

          coupleId:
            plan.couple_id,

          memoryId:
            newMemoryId,

          userId:
            user.id,
        });

        coverCopied =
          true;
      } catch (error) {
        console.error(
          "Plan cover copy error:",
          error
        );

        coverCopyError =
          error instanceof
          Error
            ? error.message
            : "Cover gagal disalin.";
      }
    }

    /*
     * ==========================================
     * RESULT
     * ==========================================
     */

    if (
      plan.cover_path &&
      !coverCopied
    ) {
      await Swal.fire({
        icon: "warning",

        title:
          "Memory berhasil dibuat",

        text:
          coverCopyError
            ? `Memory tersimpan, tetapi cover gagal disalin: ${coverCopyError}`
            : "Memory tersimpan, tetapi cover gagal disalin.",

        confirmButtonText:
          "Oke",

        confirmButtonColor:
          "#1688b5",
      });

      return;
    }

    await Swal.fire({
      icon: "success",

      title:
        "Memory berhasil disimpan",

      text:
        coverCopied
          ? "Memory dan cover dari Planner berhasil disimpan."
          : "Plan ini sekarang sudah masuk ke Memories.",

      timer:
        1700,

      showConfirmButton:
        false,
    });
  };

  /*
   * =========================================================
   * COVER UPLOAD
   * =========================================================
   */

  const handleCoverUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        await Swal.fire({
          icon: "warning",

          title:
            "File bukan gambar",

          text:
            "Pilih file gambar seperti JPG, PNG, atau WEBP.",

          confirmButtonColor:
            "#1688b5",
        });

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
        await Swal.fire({
          icon: "warning",

          title:
            "Foto terlalu besar",

          text:
            "Ukuran maksimal cover adalah 8 MB.",

          confirmButtonColor:
            "#1688b5",
        });

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

        /*
         * Upload cover baru.
         */

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
          await showError(
            "Upload cover gagal",
            uploadError.message
          );

          return;
        }

        /*
         * Simpan path ke tabel plans.
         */

        const oldCover =
          plan.cover_path;

        const {
          data:
            updatedPlan,
          error:
            updateError,
        } =
          await supabase
            .from("plans")
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
          /*
           * Kalau database gagal,
           * hapus file baru supaya
           * tidak menjadi orphan file.
           */

          await supabase.storage
            .from(
              "plan-covers"
            )
            .remove([
              filePath,
            ]);

          await showError(
            "Cover gagal disimpan",
            updateError.message
          );

          return;
        }

        /*
         * Buat signed URL karena
         * bucket plan-covers private.
         */

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

        /*
         * Hapus cover lama
         * setelah cover baru berhasil.
         */

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

        await Swal.fire({
          icon: "success",

          title:
            "Cover diperbarui",

          timer: 1100,

          showConfirmButton:
            false,
        });
      } catch (error) {
        console.error(
          "Cover upload error:",
          error
        );

        await showError(
          "Upload cover gagal",
          "Terjadi kesalahan saat mengunggah gambar."
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
            max-w-[1450px]
          "
        >
          {/* =====================================
              BACK
          ====================================== */}

          <Link
            href="/planner"
            className="
              mb-5
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
            <ArrowLeft
              size={17}
            />

            Back to Planner
          </Link>

          {/* =====================================
              COVER / HERO
          ====================================== */}

          <section
            className="
              relative
              min-h-[360px]
              overflow-hidden
              rounded-[34px]
              bg-gradient-to-br
              from-ocean-900
              via-ocean-700
              to-ocean-400
              shadow-love-lg
              sm:min-h-[430px]
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
                    bg-gradient-to-t
                    from-ocean-950/95
                    via-ocean-950/30
                    to-black/5
                  "
                />
              </>
            ) : (
              <>
                <div
                  className="
                    absolute
                    inset-0
                    bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,.16),transparent_27%),radial-gradient(circle_at_15%_90%,rgba(158,223,240,.30),transparent_30%)]
                  "
                />

                <Heart
                  size={210}
                  fill="currentColor"
                  className="
                    absolute
                    -right-10
                    -top-16
                    text-white/[0.06]
                  "
                />
              </>
            )}

            {/* COVER BUTTON */}

            <label
              className="
                absolute
                right-4
                top-4
                z-20
                flex
                cursor-pointer
                items-center
                gap-2
                rounded-[16px]
                border
                border-white/20
                bg-black/20
                px-4
                py-2.5
                text-xs
                font-semibold
                text-white
                backdrop-blur-xl
                transition
                hover:bg-black/30
                sm:right-6
                sm:top-6
              "
            >
              <ImagePlus
                size={16}
              />

              {isUploading
                ? "Uploading..."
                : coverUrl
                  ? "Change Cover"
                  : "Add Cover"}

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

            {/* HERO CONTENT */}

            <div
              className="
                absolute
                inset-x-0
                bottom-0
                z-10
                p-6
                text-white
                sm:p-8
                lg:p-10
              "
            >
              <StatusBadge
                status={
                  plan.status
                }
              />

              <h1
                className="
                  mt-4
                  max-w-4xl
                  font-display
                  text-4xl
                  font-semibold
                  leading-tight
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                {plan.title}
              </h1>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <HeroPill
                  icon={
                    CalendarDays
                  }
                >
                  {formatDate(
                    plan.plan_date
                  )}
                </HeroPill>

                {plan.plan_time && (
                  <HeroPill
                    icon={
                      Clock3
                    }
                  >
                    {formatTime(
                      plan.plan_time
                    )}
                  </HeroPill>
                )}

                {plan.location_name && (
                  <HeroPill
                    icon={
                      MapPin
                    }
                  >
                    {
                      plan.location_name
                    }
                  </HeroPill>
                )}

                {plan.budget !==
                  null && (
                  <HeroPill
                    icon={
                      WalletCards
                    }
                  >
                    {formatRupiah(
                      Number(
                        plan.budget
                      )
                    )}
                  </HeroPill>
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              CONTENT GRID
          ====================================== */}

          <section
            className="
              mt-5
              grid
              gap-5
              xl:grid-cols-[1.35fr_0.65fr]
            "
          >
            {/* =====================================
                LEFT COLUMN
            ====================================== */}

            <div className="space-y-5">
              {/* DESCRIPTION */}

              <article
                className="
                  glass-card
                  rounded-[28px]
                  p-6
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-ocean-100
                      text-ocean-700
                    "
                  >
                    <Heart
                      size={19}
                    />
                  </div>

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
                      Our Plan
                    </p>

                    <h2
                      className="
                        mt-0.5
                        font-display
                        text-2xl
                        font-semibold
                        text-ocean-950
                      "
                    >
                      About this plan
                    </h2>
                  </div>
                </div>

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
                    "Belum ada deskripsi untuk plan ini."}
                </p>
              </article>

              {/* =====================================
                  CHECKLIST
              ====================================== */}

              <article
                className="
                  glass-card
                  rounded-[28px]
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
                      Preparation
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
                      Checklist
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleAddTask
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-[15px]
                      bg-ocean-100
                      px-4
                      py-2.5
                      text-xs
                      font-bold
                      text-ocean-700
                      transition
                      hover:bg-ocean-200
                    "
                  >
                    <Plus
                      size={16}
                    />

                    Add Task
                  </button>
                </div>

                {/* PROGRESS */}

                <div
                  className="
                    mt-6
                    rounded-[20px]
                    border
                    border-ocean-100
                    bg-ocean-50/70
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-sm
                          font-semibold
                          text-ocean-950
                        "
                      >
                        Preparation Progress
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-ink-soft
                        "
                      >
                        {completedTasks} of{" "}
                        {tasks.length} tasks
                        completed
                      </p>
                    </div>

                    <p
                      className="
                        font-display
                        text-2xl
                        font-semibold
                        text-ocean-700
                      "
                    >
                      {progress}%
                    </p>
                  </div>

                  <div
                    className="
                      mt-4
                      h-2
                      overflow-hidden
                      rounded-full
                      bg-white
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
                          `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                {/* TASKS */}

                <div
                  className="
                    mt-5
                    space-y-2.5
                  "
                >
                  {tasks.length >
                  0 ? (
                    tasks.map(
                      (task) => (
                        <div
                          key={
                            task.id
                          }
                          className="
                            group
                            flex
                            items-center
                            gap-3
                            rounded-[18px]
                            border
                            border-ocean-100
                            bg-white/60
                            p-3
                            transition
                            hover:border-ocean-200
                            hover:bg-white
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleTask(
                                task
                              )
                            }
                            aria-label={
                              task.is_completed
                                ? "Mark incomplete"
                                : "Mark completed"
                            }
                            className={`
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-[12px]
                              border
                              transition
                              ${
                                task.is_completed
                                  ? "border-ocean-600 bg-ocean-600 text-white"
                                  : "border-ocean-200 bg-white text-transparent hover:border-ocean-500"
                              }
                            `}
                          >
                            <Check
                              size={17}
                            />
                          </button>

                          <p
                            className={`
                              min-w-0
                              flex-1
                              text-sm
                              font-semibold
                              ${
                                task.is_completed
                                  ? "text-ink-soft line-through"
                                  : "text-ocean-950"
                              }
                            `}
                          >
                            {
                              task.title
                            }
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              handleEditTask(
                                task
                              )
                            }
                            aria-label="Edit checklist"
                            className="
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-[10px]
                              text-ocean-400
                              transition
                              hover:bg-ocean-50
                              hover:text-ocean-700
                            "
                          >
                            <Pencil
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTask(
                                task
                              )
                            }
                            aria-label="Delete checklist"
                            className="
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-[10px]
                              text-heart
                              transition
                              hover:bg-heart-soft
                            "
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      )
                    )
                  ) : (
                    <div
                      className="
                        rounded-[20px]
                        border
                        border-dashed
                        border-ocean-200
                        px-5
                        py-10
                        text-center
                      "
                    >
                      <CheckCircle2
                        className="
                          mx-auto
                          text-ocean-300
                        "
                        size={29}
                      />

                      <p
                        className="
                          mt-3
                          font-semibold
                          text-ocean-900
                        "
                      >
                        Belum ada checklist
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-ink-soft
                        "
                      >
                        Tambahkan hal-hal yang perlu
                        dipersiapkan.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* =====================================
                RIGHT COLUMN
            ====================================== */}

            <aside className="space-y-5">
              {/* COUNTDOWN */}

              <article
                className="
                  relative
                  overflow-hidden
                  rounded-[28px]
                  bg-gradient-to-br
                  from-ocean-900
                  via-ocean-700
                  to-ocean-500
                  p-6
                  text-white
                  shadow-love
                "
              >
                <div
                  className="
                    absolute
                    -right-12
                    -top-12
                    h-32
                    w-32
                    rounded-full
                    bg-white/10
                    blur-xl
                  "
                />

                <div
                  className="
                    relative
                    z-10
                  "
                >
                  <Sparkles
                    size={19}
                    className="
                      text-white/65
                    "
                  />

                  <p
                    className="
                      mt-5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.22em]
                      text-white/55
                    "
                  >
                    Countdown
                  </p>

                  {plan.status ===
                  "done" ? (
                    <>
                      <h2
                        className="
                          mt-2
                          font-display
                          text-3xl
                          font-semibold
                        "
                      >
                        Completed
                      </h2>

                      <p
                        className="
                          mt-3
                          text-sm
                          leading-6
                          text-white/65
                        "
                      >
                        Plan ini sudah
                        selesai.
                      </p>
                    </>
                  ) : plan.status ===
                    "cancelled" ? (
                    <>
                      <h2
                        className="
                          mt-2
                          font-display
                          text-3xl
                          font-semibold
                        "
                      >
                        Cancelled
                      </h2>

                      <p
                        className="
                          mt-3
                          text-sm
                          leading-6
                          text-white/65
                        "
                      >
                        Plan ini dibatalkan.
                      </p>
                    </>
                  ) : countdown.finished ? (
                    <>
                      <h2
                        className="
                          mt-2
                          font-display
                          text-3xl
                          font-semibold
                        "
                      >
                        It&apos;s time!
                      </h2>

                      <p
                        className="
                          mt-3
                          text-sm
                          text-white/65
                        "
                      >
                        Waktunya menjalankan
                        plan kalian.
                      </p>
                    </>
                  ) : (
                    <div
                      className="
                        mt-5
                        grid
                        grid-cols-2
                        gap-2
                      "
                    >
                      <CountdownBox
                        value={
                          countdown.days
                        }
                        label="Days"
                      />

                      <CountdownBox
                        value={
                          countdown.hours
                        }
                        label="Hours"
                      />

                      <CountdownBox
                        value={
                          countdown.minutes
                        }
                        label="Minutes"
                      />

                      <CountdownBox
                        value={
                          countdown.seconds
                        }
                        label="Seconds"
                      />
                    </div>
                  )}
                </div>
              </article>

              {/* =====================================
                  DATE INFORMATION
              ====================================== */}

              <article
                className="
                  glass-card
                  rounded-[28px]
                  p-6
                "
              >
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-ocean-500
                  "
                >
                  Information
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
                  Plan Details
                </h2>

                <div
                  className="
                    mt-5
                    space-y-4
                  "
                >
                  <DetailRow
                    icon={
                      CalendarDays
                    }
                    label="Date"
                    value={formatDate(
                      plan.plan_date
                    )}
                  />

                  <DetailRow
                    icon={
                      Clock3
                    }
                    label="Time"
                    value={
                      plan.plan_time
                        ? formatTime(
                            plan.plan_time
                          )
                        : "Belum ditentukan"
                    }
                  />

                  <DetailRow
                    icon={
                      MapPin
                    }
                    label="Location"
                    value={
                      plan.location_name ||
                      "Belum ditentukan"
                    }
                  />

                  <DetailRow
                    icon={
                      WalletCards
                    }
                    label="Budget"
                    value={
                      plan.budget !==
                      null
                        ? formatRupiah(
                            Number(
                              plan.budget
                            )
                          )
                        : "Belum ditentukan"
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
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-[16px]
                      bg-ocean-100
                      px-4
                      py-3.5
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

                    Open Google Maps

                    <ExternalLink
                      size={14}
                    />
                  </a>
                )}
              </article>

              {/* =====================================
                  STATUS / MEMORY
              ====================================== */}

              <article
                className="
                  glass-card
                  rounded-[28px]
                  p-6
                "
              >
                {plan.status ===
                "done" ? (
                  <>
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

                    <h2
                      className="
                        mt-4
                        font-display
                        text-2xl
                        font-semibold
                        text-ocean-950
                      "
                    >
                      Plan completed
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-ink-soft
                      "
                    >
                      Rencana ini sudah selesai.
                      Kamu bisa menyimpannya ke
                      Memories.
                    </p>

                    {memoryId ? (
                      <Link
                        href={`/memories/${memoryId}`}
                        className="
                          mt-5
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-[16px]
                          bg-ocean-700
                          px-5
                          py-3.5
                          text-sm
                          font-semibold
                          text-white
                          shadow-[0_10px_25px_rgba(17,107,145,0.16)]
                          transition
                          hover:bg-ocean-800
                        "
                      >
                        View in Memories

                        <ExternalLink
                          size={15}
                        />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          handleTurnIntoMemory
                        }
                        className="
                          love-button
                          mt-5
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-[16px]
                          px-5
                          py-3.5
                          text-sm
                          font-semibold
                        "
                      >
                        <Heart
                          size={16}
                        />

                        Turn into Memory
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={
                        handleRestorePlan
                      }
                      className="
                        mt-3
                        w-full
                        rounded-[16px]
                        border
                        border-ocean-200
                        bg-white/70
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-ocean-700
                        transition
                        hover:bg-white
                      "
                    >
                      Restore to Planned
                    </button>
                  </>
                ) : plan.status ===
                  "cancelled" ? (
                  <>
                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-[15px]
                        bg-heart-soft
                        text-heart
                      "
                    >
                      <CalendarDays
                        size={20}
                      />
                    </div>

                    <h2
                      className="
                        mt-4
                        font-display
                        text-2xl
                        font-semibold
                        text-ocean-950
                      "
                    >
                      Plan cancelled
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-ink-soft
                      "
                    >
                      Plan ini sedang berstatus
                      cancelled.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleRestorePlan
                      }
                      className="
                        mt-5
                        w-full
                        rounded-[16px]
                        bg-ocean-700
                        px-5
                        py-3.5
                        text-sm
                        font-semibold
                        text-white
                        transition
                        hover:bg-ocean-800
                      "
                    >
                      Restore to Planned
                    </button>
                  </>
                ) : (
                  <>
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

                    <h2
                      className="
                        mt-4
                        font-display
                        text-2xl
                        font-semibold
                        text-ocean-950
                      "
                    >
                      Finish this plan?
                    </h2>

                    <p
                      className="
                        mt-2
                        text-sm
                        leading-6
                        text-ink-soft
                      "
                    >
                      Tandai selesai ketika
                      rencana ini sudah benar-benar
                      terlaksana.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleMarkDone
                      }
                      className="
                        love-button
                        mt-5
                        flex
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-[16px]
                        px-5
                        py-3.5
                        text-sm
                        font-semibold
                      "
                    >
                      <CheckCircle2
                        size={17}
                      />

                      Mark as Done
                    </button>
                  </>
                )}
              </article>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * COPY PLAN COVER TO MEMORY COVER
 * =========================================================
 */

type CopyPlanCoverParams = {
  planCoverPath: string;
  coupleId: string;
  memoryId: string;
  userId: string;
};

async function copyPlanCoverToMemory({
  planCoverPath,
  coupleId,
  memoryId,
  userId,
}: CopyPlanCoverParams) {
  const supabase =
    createClient();

  /*
   * Download the private Plan cover.
   */
  const {
    data: coverBlob,
    error: downloadError,
  } =
    await supabase.storage
      .from("plan-covers")
      .download(planCoverPath);

  if (
    downloadError ||
    !coverBlob
  ) {
    throw new Error(
      downloadError?.message ||
        "Cover Plan tidak dapat dibaca."
    );
  }

  const extension =
    getExtension(planCoverPath);

  const fileName =
    `plan-cover-${crypto.randomUUID()}.${extension}`;

  const memoryStoragePath =
    `${coupleId}/${memoryId}/${fileName}`;

  /*
   * Upload a separate copy into the private Memory bucket.
   */
  const {
    error: uploadError,
  } =
    await supabase.storage
      .from("memory-photos")
      .upload(
        memoryStoragePath,
        coverBlob,
        {
          cacheControl: "3600",
          upsert: false,
          contentType:
            coverBlob.type ||
            "image/jpeg",
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message
    );
  }

  /*
   * Register the copied image as the Memory cover.
   */
  const {
    error: photoError,
  } =
    await supabase
      .from("memory_photos")
      .insert({
        memory_id: memoryId,
        uploaded_by: userId,
        storage_path:
          memoryStoragePath,
        caption: null,
        is_cover: true,
        sort_order: 0,
      });

  if (photoError) {
    /*
     * Avoid leaving an orphan object in Storage.
     */
    await supabase.storage
      .from("memory-photos")
      .remove([
        memoryStoragePath,
      ]);

    throw new Error(
      photoError.message
    );
  }

  return memoryStoragePath;
}

/*
 * =========================================================
 * HERO PILL
 * =========================================================
 */

function HeroPill({
  icon: Icon,
  children,
}: {
  icon:
    React.ElementType;

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
        border-white/20
        bg-black/15
        px-4
        py-2
        text-xs
        font-semibold
        backdrop-blur-xl
      "
    >
      <Icon
        size={14}
      />

      {children}
    </div>
  );
}

/*
 * =========================================================
 * COUNTDOWN BOX
 * =========================================================
 */

function CountdownBox({
  value,
  label,
}: {
  value: number;

  label: string;
}) {
  return (
    <div
      className="
        rounded-[18px]
        border
        border-white/15
        bg-white/10
        p-4
        text-center
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
        {String(
          value
        ).padStart(
          2,
          "0"
        )}
      </p>

      <p
        className="
          mt-1
          text-[9px]
          font-bold
          uppercase
          tracking-[0.15em]
          text-white/55
        "
      >
        {label}
      </p>
    </div>
  );
}

/*
 * =========================================================
 * DETAIL ROW
 * =========================================================
 */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label: string;

  value: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        gap-3
      "
    >
      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-[13px]
          bg-ocean-50
          text-ocean-600
        "
      >
        <Icon
          size={16}
        />
      </div>

      <div
        className="
          min-w-0
        "
      >
        <p
          className="
            text-[10px]
            font-medium
            uppercase
            tracking-[0.08em]
            text-ink-soft
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            break-words
            text-sm
            font-semibold
            text-ocean-950
          "
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * STATUS BADGE
 * =========================================================
 */

function StatusBadge({
  status,
}: {
  status:
    PlanStatus;
}) {
  const config = {
    planned: {
      text:
        "Planned",

      className:
        "bg-white/15 text-white",
    },

    done: {
      text:
        "Done",

      className:
        "bg-emerald-400/25 text-white",
    },

    cancelled: {
      text:
        "Cancelled",

      className:
        "bg-rose-400/25 text-white",
    },
  };

  const current =
    config[status];

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        border-white/20
        px-4
        py-2
        text-[10px]
        font-bold
        uppercase
        tracking-[0.16em]
        backdrop-blur-xl
        ${current.className}
      `}
    >
      {current.text}
    </span>
  );
}

/*
 * =========================================================
 * CALCULATE COUNTDOWN
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

  const now =
    new Date();

  const difference =
    target.getTime() -
    now.getTime();

  if (
    difference <= 0
  ) {
    return {
      days: 0,

      hours: 0,

      minutes: 0,

      seconds: 0,

      finished: true,
    };
  }

  const days =
    Math.floor(
      difference /
        (
          1000 *
          60 *
          60 *
          24
        )
    );

  const hours =
    Math.floor(
      (
        difference /
        (
          1000 *
          60 *
          60
        )
      ) %
        24
    );

  const minutes =
    Math.floor(
      (
        difference /
        (
          1000 *
          60
        )
      ) %
        60
    );

  const seconds =
    Math.floor(
      (
        difference /
        1000
      ) %
        60
    );

  return {
    days,

    hours,

    minutes,

    seconds,

    finished: false,
  };
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

/*
 * =========================================================
 * FORMAT RUPIAH
 * =========================================================
 */

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

/*
 * =========================================================
 * FILE EXTENSION
 * =========================================================
 */

function getExtension(
  fileName: string
) {
  const parts =
    fileName.split(
      "."
    );

  if (
    parts.length <
    2
  ) {
    return "jpg";
  }

  return (
    parts.pop() ||
    "jpg"
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

/*
 * =========================================================
 * ERROR ALERT
 * =========================================================
 */

async function showError(
  title: string,
  message: string
) {
  await Swal.fire({
    icon: "error",

    title,

    text:
      message,

    confirmButtonText:
      "Oke",

    confirmButtonColor:
      "#1688b5",
  });
}