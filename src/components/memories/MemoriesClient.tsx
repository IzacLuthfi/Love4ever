// src/components/memories/MemoriesClient.tsx



"use client";



import Image from "next/image";

import Link from "next/link";

import dynamic from "next/dynamic";



import {

  type Dispatch,

  type FormEvent,

  type ReactNode,

  type SetStateAction,

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import {

  ArrowRight,

  MapPin,

  Pencil,

  Plus,

  Trash2,

  X,

} from "lucide-react";



import Swal from "sweetalert2";



import AppSidebar from "@/components/layout/AppSidebar";

import MobileBottomNav from "@/components/layout/MobileBottomNav";

import MemoryLocationPicker from "@/components/memories/MemoryLocationPicker";



import { createClient } from "@/lib/supabase/client";

import {

  IMAGE_ACCEPT,

  normalizeImageFiles,

} from "@/utils/image";

const MEMORY_BATCH_SIZE = 20;

const MemoryMap = dynamic(
  () =>
    import(
      "@/components/memories/MemoryMap"
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="
          flex
          min-h-[360px]
          items-center
          justify-center
          bg-ocean-50/55
          text-xs
          font-medium
          text-ink-soft/65
        "
      >
        Loading map…
      </div>
    ),
  }
);

/*

 * =========================================================

 * TYPES

 * =========================================================

 */



type MemoryItem = {

  id: string;



  couple_id: string;

  created_by: string;



  source_plan_id:

    | string

    | null;



  title: string;



  story:

    | string

    | null;



  memory_date: string;



  memory_time:

    | string

    | null;



  location_name:

    | string

    | null;



  maps_url:

    | string

    | null;



  latitude:

    | number

    | null;



  longitude:

    | number

    | null;



  created_at: string;

  updated_at: string;



  cover_url:

    | string

    | null;



  photo_count: number;

};



type MemoryUser = {

  id: string;

  email: string;

  fullName: string;

  nickname: string;



  avatarUrl:

    | string

    | null;

};



type MemoriesClientProps = {

  user: MemoryUser;



  coupleId: string;



  initialMemories:

    MemoryItem[];

};



type MemoryFormState = {

  title: string;

  story: string;



  memoryDate: string;

  memoryTime: string;



  locationName: string;

  mapsUrl: string;



  latitude:

    | number

    | null;



  longitude:

    | number

    | null;

};



/*

 * =========================================================

 * COMPONENT

 * =========================================================

 */



export default function MemoriesClient({

  user,

  coupleId,

  initialMemories,

}: MemoriesClientProps) {

  const [

    memories,

    setMemories,

  ] =

    useState<MemoryItem[]>(

      sortMemories(

        initialMemories

      )

    );



  const [

    selectedYear,

    setSelectedYear,

  ] =

    useState("all");

  const [
    visibleMemoryCount,
    setVisibleMemoryCount,
  ] =
    useState(
      MEMORY_BATCH_SIZE
    );



  const [

    formOpen,

    setFormOpen,

  ] =

    useState(false);



  const [

    editingMemory,

    setEditingMemory,

  ] =

    useState<

      MemoryItem | null

    >(null);



  const [

    form,

    setForm,

  ] =

    useState<MemoryFormState>(

      createEmptyForm()

    );



  const [

    isSaving,

    setIsSaving,

  ] =

    useState(false);



  /*

   * =========================================================

   * FILTER

   * =========================================================

   */



  const availableYears =

    useMemo(() => {

      const years =

        new Set(

          memories.map(

            (memory) =>

              getYear(

                memory.memory_date

              )

          )

        );



      return Array.from(

        years

      ).sort(

        (a, b) =>

          Number(b) -

          Number(a)

      );

    }, [memories]);



  const filteredMemories =

    useMemo(() => {

      if (

        selectedYear ===

        "all"

      ) {

        return memories;

      }



      return memories.filter(

        (memory) =>

          getYear(

            memory.memory_date

          ) ===

          selectedYear

      );

    }, [

      memories,

      selectedYear,

    ]);



  /*
   * =========================================================
   * LAZY RENDER / INFINITE SCROLL
   * =========================================================
   */

  useEffect(() => {
    setVisibleMemoryCount(
      MEMORY_BATCH_SIZE
    );
  }, [selectedYear]);

  const visibleMemories =
    useMemo(
      () =>
        filteredMemories.slice(
          0,
          visibleMemoryCount
        ),
      [
        filteredMemories,
        visibleMemoryCount,
      ]
    );

  const hasMoreMemories =
    visibleMemoryCount <
    filteredMemories.length;

  const loadMoreMemories =
    useCallback(() => {
      setVisibleMemoryCount(
        (current) =>
          Math.min(
            current +
              MEMORY_BATCH_SIZE,
            filteredMemories.length
          )
      );
    }, [
      filteredMemories.length,
    ]);


  /*

   * =========================================================

   * STATS

   * =========================================================

   */



  const currentYear =

    getTodayInputValue().slice(

      0,

      4

    );



  const thisYearCount =

    memories.filter(

      (memory) =>

        getYear(

          memory.memory_date

        ) ===

        currentYear

    ).length;



  const locationCount =

    useMemo(() => {

      const locations =

        memories

          .map(

            (memory) =>

              memory.location_name

                ?.trim()

                .toLowerCase()

          )

          .filter(

            (

              value

            ): value is string =>

              Boolean(value)

          );



      return new Set(

        locations

      ).size;

    }, [memories]);



  const mappedCount =

    filteredMemories.filter(

      (memory) =>

        memory.latitude !==

          null &&

        memory.longitude !==

          null

    ).length;



  /*

   * =========================================================

   * CREATE

   * =========================================================

   */



  const handleOpenCreate =

    () => {

      setEditingMemory(

        null

      );



      setForm(

        createEmptyForm()

      );



      setFormOpen(

        true

      );

    };



  /*

   * =========================================================

   * EDIT

   * =========================================================

   */



  const handleOpenEdit =

    (

      memory:

        MemoryItem

    ) => {

      setEditingMemory(

        memory

      );



      setForm({

        title:

          memory.title,



        story:

          memory.story ??

          "",



        memoryDate:

          memory.memory_date,



        memoryTime:

          normalizeTime(

            memory.memory_time

          ),



        locationName:

          memory.location_name ??

          "",



        mapsUrl:

          memory.maps_url ??

          "",



        latitude:

          memory.latitude,



        longitude:

          memory.longitude,

      });



      setFormOpen(

        true

      );

    };



  /*

   * =========================================================

   * CLOSE

   * =========================================================

   */



  const handleCloseForm =

    () => {

      if (

        isSaving

      ) {

        return;

      }



      setFormOpen(

        false

      );



      setEditingMemory(

        null

      );

    };



  /*

   * =========================================================

   * SAVE

   * =========================================================

   */



  const handleSaveMemory =

    async (

      event:

        FormEvent<HTMLFormElement>

    ) => {

      event.preventDefault();



      const title =

        form.title.trim();



      if (!title) {

        await showWarning(

          "Title required",

          "Add a title first."

        );



        return;

      }



      if (

        !form.memoryDate

      ) {

        await showWarning(

          "Date required",

          "Choose a date first."

        );



        return;

      }



      const mapsUrl =

        form.mapsUrl.trim();



      if (

        mapsUrl &&

        !isValidUrl(

          mapsUrl

        )

      ) {

        await showWarning(

          "Invalid link",

          "Enter a valid Maps URL."

        );



        return;

      }



      if (

        (

          form.latitude ===

          null

        ) !==

        (

          form.longitude ===

          null

        )

      ) {

        await showWarning(

          "Location incomplete",

          "Choose the location again."

        );



        return;

      }



      setIsSaving(

        true

      );



      try {

        const supabase =

          createClient();



        const payload = {

          title,



          story:

            form.story.trim() ||

            null,



          memory_date:

            form.memoryDate,



          memory_time:

            form.memoryTime ||

            null,



          location_name:

            form.locationName.trim() ||

            null,



          maps_url:

            mapsUrl ||

            null,



          latitude:

            form.latitude,



          longitude:

            form.longitude,

        };



        /*

         * UPDATE

         */



        if (

          editingMemory

        ) {

          const {

            data,

            error,

          } =

            await supabase

              .from(

                "memories"

              )

              .update(

                payload

              )

              .eq(

                "id",

                editingMemory.id

              )

              .select()

              .single();



          if (error) {

            throw new Error(

              error.message

            );

          }



          setMemories(

            (current) =>

              sortMemories(

                current.map(

                  (item) =>

                    item.id ===

                    editingMemory.id

                      ? {

                          ...item,

                          ...data,



                          cover_url:

                            editingMemory.cover_url,



                          photo_count:

                            editingMemory.photo_count,

                        }

                      : item

                )

              )

          );



          setFormOpen(

            false

          );



          setEditingMemory(

            null

          );



          await showSuccess(

            "Memory updated"

          );



          return;

        }



        /*

         * CREATE

         */



        const {

          data,

          error,

        } =

          await supabase

            .from(

              "memories"

            )

            .insert({

              couple_id:

                coupleId,



              created_by:

                user.id,



              source_plan_id:

                null,



              ...payload,

            })

            .select()

            .single();



        if (error) {

          throw new Error(

            error.message

          );

        }



        const newMemory:

          MemoryItem = {

          ...(data as MemoryItem),



          cover_url:

            null,



          photo_count:

            0,

        };



        setMemories(

          (current) =>

            sortMemories([

              newMemory,

              ...current,

            ])

        );



        setSelectedYear(

          "all"

        );



        setFormOpen(

          false

        );



        await showSuccess(

          "Memory added"

        );

      } catch (error) {

        await showError(

          editingMemory

            ? "Memory could not be updated"

            : "Memory could not be created",



          error instanceof

            Error

            ? error.message

            : "Something went wrong."

        );

      } finally {

        setIsSaving(

          false

        );

      }

    };



  /*

   * =========================================================

   * DELETE

   * =========================================================

   */



  const handleDelete =

    async (

      memory:

        MemoryItem

    ) => {

      const result =

        await Swal.fire({

          title:

            "Delete memory?",



          text:

            memory.title,



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

            "memories"

          )

          .delete()

          .eq(

            "id",

            memory.id

          );



      if (error) {

        await showError(

          "Memory could not be deleted",

          error.message

        );



        return;

      }



      setMemories(

        (current) =>

          current.filter(

            (item) =>

              item.id !==

              memory.id

          )

      );

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

          {/* HEADER */}



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

              Memories

            </h1>



            <button

              type="button"

              onClick={

                handleOpenCreate

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



              Add Memory

            </button>

          </header>



          {/* SUMMARY */}



          <section

            className="

              mt-8

              grid

              overflow-hidden

              rounded-[28px]

              border

              border-ocean-100/70

              bg-white/75

              shadow-[0_14px_45px_rgba(8,59,89,0.035)]

              backdrop-blur-xl

              sm:grid-cols-3

            "

          >

            <SummaryItem

              value={

                memories.length

              }

              label="Memories"

            />



            <SummaryItem

              value={

                thisYearCount

              }

              label={

                currentYear

              }

            />



            <SummaryItem

              value={

                locationCount

              }

              label="Places"

            />

          </section>



          {/* MAP */}



          <section

            className="

              mt-5

              overflow-hidden

              rounded-[30px]

              border

              border-ocean-100/70

              bg-white/75

              shadow-[0_14px_45px_rgba(8,59,89,0.04)]

              backdrop-blur-xl

            "

          >

            <div

              className="

                flex

                items-end

                justify-between

                gap-5

                px-5

                py-5

                sm:px-7

              "

            >

              <div>

                <h2

                  className="

                    font-display

                    text-[24px]

                    font-semibold

                    tracking-[-0.025em]

                    text-ocean-950

                  "

                >

                  Memory Map

                </h2>



                <p

                  className="

                    mt-1

                    text-xs

                    text-ink-soft

                  "

                >

                  {mappedCount} pinned

                </p>

              </div>



              <p

                className="

                  text-xs

                  font-medium

                  text-ink-soft

                "

              >

                {selectedYear ===

                "all"

                  ? "All years"

                  : selectedYear}

              </p>

            </div>



            <LazyMemoryMap
              memories={
                filteredMemories
              }
            />

          </section>



          {/* YEAR FILTER */}



          <nav

            className="

              mt-8

              flex

              gap-7

              overflow-x-auto

              border-b

              border-ocean-100/80

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden

            "

          >

            <YearFilterButton

              active={

                selectedYear ===

                "all"

              }

              onClick={() =>

                setSelectedYear(

                  "all"

                )

              }

            >

              All

            </YearFilterButton>



            {availableYears.map(

              (year) => (

                <YearFilterButton

                  key={

                    year

                  }

                  active={

                    selectedYear ===

                    year

                  }

                  onClick={() =>

                    setSelectedYear(

                      year

                    )

                  }

                >

                  {year}

                </YearFilterButton>

              )

            )}

          </nav>



          {/* MEMORIES */}



          {filteredMemories.length >

          0 ? (

            <section

              className="

                mt-6

                space-y-5

              "

            >

              {visibleMemories.map(

                (memory) => (

                  <MemoryCard

                    key={

                      memory.id

                    }

                    memory={

                      memory

                    }

                    onEdit={() =>

                      handleOpenEdit(

                        memory

                      )

                    }

                    onDelete={() =>

                      void handleDelete(

                        memory

                      )

                    }

                  />

                )
              )}

              <MemoryLoadMoreSentinel
                hasMore={
                  hasMoreMemories
                }
                loaded={
                  visibleMemories.length
                }
                total={
                  filteredMemories.length
                }
                onLoadMore={
                  loadMoreMemories
                }
              />

            </section>

          ) : (

            <EmptyMemories

              filtered={

                selectedYear !==

                "all"

              }

              onCreate={

                handleOpenCreate

              }

            />

          )}

        </div>

      </main>



      {/* FORM */}



      {formOpen && (

        <MemoryFormModal

          form={

            form

          }

          setForm={

            setForm

          }

          editing={

            Boolean(

              editingMemory

            )

          }

          isSaving={

            isSaving

          }

          onClose={

            handleCloseForm

          }

          onSubmit={

            handleSaveMemory

          }

        />

      )}

    </div>

  );

}



/*
 * =========================================================
 * LAZY MEMORY MAP
 * =========================================================
 */

function LazyMemoryMap({
  memories,
}: {
  memories: MemoryItem[];
}) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [shouldRender, setShouldRender] =
    useState(false);

  useEffect(() => {
    if (shouldRender) {
      return;
    }

    const node =
      containerRef.current;

    if (!node) {
      return;
    }

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      setShouldRender(true);
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry?.isIntersecting
          ) {
            setShouldRender(true);
            observer.disconnect();
          }
        },
        {
          rootMargin:
            "280px 0px",
          threshold: 0.01,
        }
      );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [shouldRender]);

  return (
    <div
      ref={containerRef}
      className="
        min-h-[360px]
      "
    >
      {shouldRender ? (
        <MemoryMap
          memories={memories}
        />
      ) : (
        <div
          className="
            flex
            min-h-[360px]
            items-center
            justify-center
            bg-ocean-50/55
            text-xs
            font-medium
            text-ink-soft/65
          "
        >
          Map loads when needed
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * INFINITE SCROLL SENTINEL
 * =========================================================
 */

function MemoryLoadMoreSentinel({
  hasMore,
  loaded,
  total,
  onLoadMore,
}: {
  hasMore: boolean;
  loaded: number;
  total: number;
  onLoadMore: () => void;
}) {
  const sentinelRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node =
      sentinelRef.current;

    if (!node) {
      return;
    }

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry?.isIntersecting
          ) {
            onLoadMore();
          }
        },
        {
          root: null,
          rootMargin:
            "600px 0px",
          threshold: 0.01,
        }
      );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [
    hasMore,
    onLoadMore,
  ]);

  if (total === 0) {
    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className="
        flex
        min-h-16
        items-center
        justify-center
        py-5
      "
    >
      <p
        className="
          text-[11px]
          font-medium
          text-ink-soft/65
        "
      >
        {hasMore
          ? `${loaded} of ${total} memories`
          : `${total} memories`}
      </p>
    </div>
  );
}

/*

 * =========================================================

 * SUMMARY

 * =========================================================

 */



function SummaryItem({

  value,

  label,

}: {

  value: number;

  label: string;

}) {

  return (

    <div

      className="

        border-b

        border-ocean-100/70

        px-6

        py-6

        last:border-b-0

        sm:border-b-0

        sm:border-r

        sm:last:border-r-0

      "

    >

      <p

        className="

          font-display

          text-[34px]

          font-semibold

          leading-none

          tracking-[-0.04em]

          text-ocean-950

        "

      >

        {value}

      </p>



      <p

        className="

          mt-2

          text-xs

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

 * MEMORY CARD

 * =========================================================

 */



function MemoryCard({

  memory,

  onEdit,

  onDelete,

}: {

  memory:

    MemoryItem;



  onEdit:

    () => void;



  onDelete:

    () => void;

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

      <div

        className="

          grid

          md:grid-cols-[320px_1fr]

          xl:grid-cols-[370px_1fr]

        "

      >

        {/* IMAGE */}



        <Link

          href={`/memories/${memory.id}`}

          className="

            group

            relative

            min-h-[280px]

            overflow-hidden

            bg-ocean-100

          "

        >

          {memory.cover_url ? (

            <Image

              src={

                memory.cover_url

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

                bg-[linear-gradient(145deg,#0b4f71,#67c5e2)]

              "

            />

          )}



          <div

            className="

              absolute

              inset-0

              bg-gradient-to-t

              from-ocean-950/45

              via-transparent

              to-transparent

            "

          />



          {memory.photo_count >

            0 && (

            <span

              className="

                absolute

                bottom-4

                left-4

                rounded-full

                bg-black/25

                px-3

                py-1.5

                text-[10px]

                font-medium

                text-white

                backdrop-blur-md

              "

            >

              {memory.photo_count}{" "}

              {memory.photo_count ===

              1

                ? "photo"

                : "photos"}

            </span>

          )}

        </Link>



        {/* CONTENT */}



        <div

          className="

            flex

            min-h-[280px]

            flex-col

            p-6

            sm:p-7

            lg:p-8

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

            <div

              className="

                min-w-0

              "

            >

              <p

                className="

                  text-xs

                  text-ink-soft

                "

              >

                {formatDate(

                  memory.memory_date

                )}



                {memory.memory_time

                  ? ` · ${formatTime(

                      memory.memory_time

                    )}`

                  : ""}

              </p>



              <h2

                className="

                  mt-2

                  font-display

                  text-[30px]

                  font-semibold

                  leading-[1.1]

                  tracking-[-0.03em]

                  text-ocean-950

                "

              >

                {memory.title}

              </h2>

            </div>



            <div

              className="

                flex

                shrink-0

                gap-1

              "

            >

              <IconButton

                label="Edit memory"

                onClick={

                  onEdit

                }

              >

                <Pencil

                  size={14}

                />

              </IconButton>



              <IconButton

                label="Delete memory"

                destructive

                onClick={

                  onDelete

                }

              >

                <Trash2

                  size={14}

                />

              </IconButton>

            </div>

          </div>



          {memory.location_name && (

            <p

              className="

                mt-4

                text-sm

                font-medium

                text-ocean-700

              "

            >

              {

                memory.location_name

              }

            </p>

          )}



          {memory.story && (

            <p

              className="

                mt-5

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

              flex

              flex-wrap

              items-center

              gap-4

              pt-7

            "

          >

            <PrimaryLink

              href={`/memories/${memory.id}`}

            >

              Open

            </PrimaryLink>



            {memory.maps_url && (

              <a

                href={

                  memory.maps_url

                }

                target="\_blank"

                rel="noreferrer"

                className="

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



            {memory.source_plan_id && (

              <Link

                href={`/planner/${memory.source_plan_id}`}

                className="

                  text-xs

                  font-medium

                  text-ocean-600

                  transition

                  hover:text-ocean-950

                "

              >

                Plan ↗

              </Link>

            )}

          </div>

        </div>

      </div>

    </article>

  );

}



/*

 * =========================================================

 * FORM

 * =========================================================

 */



function MemoryFormModal({

  form,

  setForm,

  editing,

  isSaving,

  onClose,

  onSubmit,

}: {

  form:

    MemoryFormState;



  setForm:

    Dispatch<

      SetStateAction<

        MemoryFormState

      >

    >;



  editing: boolean;



  isSaving: boolean;



  onClose:

    () => void;



  onSubmit: (

    event:

      FormEvent<HTMLFormElement>

  ) => void;

}) {

  const [

    showMap,

    setShowMap,

  ] =

    useState(

      form.latitude !==

        null &&

      form.longitude !==

        null

    );



  const handleMapsBlur =

    () => {

      if (

        form.latitude !==

          null ||

        form.longitude !==

          null ||

        !form.mapsUrl.trim()

      ) {

        return;

      }



      const coordinates =

        extractCoordinatesFromMapsUrl(

          form.mapsUrl.trim()

        );



      if (

        !coordinates

      ) {

        return;

      }



      setForm(

        (current) => ({

          ...current,



          latitude:

            coordinates.latitude,



          longitude:

            coordinates.longitude,

        })

      );

    };



  return (

    <div

      className="

        fixed

        inset-0

        z-[1400]

        flex

        items-center

        justify-center

        bg-ocean-950/45

        p-3

        backdrop-blur-[6px]

        sm:p-5

      "

      onMouseDown={(

        event

      ) => {

        if (

          !isSaving &&

          event.target ===

            event.currentTarget

        ) {

          onClose();

        }

      }}

    >

      <div

        className="

          max-h-[94svh]

          w-full

          max-w-[760px]

          overflow-y-auto

          rounded-[28px]

          border

          border-white/60

          bg-[#fffdf9]

          shadow-[0_30px_100px_rgba(6,42,63,0.24)]

        "

      >

        {/* HEADER */}



        <div

          className="

            sticky

            top-0

            z-20

            flex

            items-center

            justify-between

            border-b

            border-ocean-100/80

            bg-[#fffdf9]/95

            px-5

            py-4

            backdrop-blur-xl

            sm:px-6

          "

        >

          <h2

            className="

              font-display

              text-[25px]

              font-semibold

              tracking-[-0.025em]

              text-ocean-950

            "

          >

            {editing

              ? "Edit Memory"

              : "New Memory"}

          </h2>



          <button

            type="button"

            onClick={

              onClose

            }

            disabled={

              isSaving

            }

            aria-label="Close"

            className="

              flex

              h-9

              w-9

              items-center

              justify-center

              rounded-full

              text-ink-soft

              transition

              hover:bg-ocean-50

              hover:text-ocean-950

              disabled:opacity-40

            "

          >

            <X

              size={16}

            />

          </button>

        </div>



        {/* FORM */}



        <form

          onSubmit={

            onSubmit

          }

          className="

            p-5

            sm:p-6

          "

        >

          <div

            className="

              grid

              gap-5

            "

          >

            <FormField

              label="Title"

              required

            >

              <input

                type="text"

                value={

                  form.title

                }

                onChange={(

                  event

                ) =>

                  setForm(

                    (

                      current

                    ) => ({

                      ...current,



                      title:

                        event.target

                          .value,

                    })

                  )

                }

                className={

                  inputClass

                }

              />

            </FormField>



            <FormField

              label="Story"

            >

              <textarea

                value={

                  form.story

                }

                onChange={(

                  event

                ) =>

                  setForm(

                    (

                      current

                    ) => ({

                      ...current,



                      story:

                        event.target

                          .value,

                    })

                  )

                }

                rows={5}

                className={`

                  ${inputClass}

                  resize-none

                `}

              />

            </FormField>



            <div

              className="

                grid

                gap-4

                sm:grid-cols-2

              "

            >

              <FormField

                label="Date"

                required

              >

                <input

                  type="date"

                  value={

                    form.memoryDate

                  }

                  onChange={(

                    event

                  ) =>

                    setForm(

                      (

                        current

                      ) => ({

                        ...current,



                        memoryDate:

                          event.target

                            .value,

                      })

                    )

                  }

                  className={

                    inputClass

                  }

                />

              </FormField>



              <FormField

                label="Time"

              >

                <input

                  type="time"

                  value={

                    form.memoryTime

                  }

                  onChange={(

                    event

                  ) =>

                    setForm(

                      (

                        current

                      ) => ({

                        ...current,



                        memoryTime:

                          event.target

                            .value,

                      })

                    )

                  }

                  className={

                    inputClass

                  }

                />

              </FormField>

            </div>



            <FormField

              label="Location"

            >

              <input

                type="text"

                value={

                  form.locationName

                }

                onChange={(

                  event

                ) =>

                  setForm(

                    (

                      current

                    ) => ({

                      ...current,



                      locationName:

                        event.target

                          .value,

                    })

                  )

                }

                className={

                  inputClass

                }

              />

            </FormField>



            <FormField

              label="Google Maps"

            >

              <input

                type="url"

                value={

                  form.mapsUrl

                }

                onChange={(

                  event

                ) =>

                  setForm(

                    (

                      current

                    ) => ({

                      ...current,



                      mapsUrl:

                        event.target

                          .value,

                    })

                  )

                }

                onBlur={

                  handleMapsBlur

                }

                placeholder="https\://..."

                className={

                  inputClass

                }

              />

            </FormField>



            {/* LOCATION */}



            <div

              className="

                overflow-hidden

                rounded-[20px]

                border

                border-ocean-100/80

              "

            >

              <div

                className="

                  flex

                  items-center

                  justify-between

                  gap-4

                  bg-white/60

                  px-4

                  py-3.5

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

                    Map Location

                  </p>



                  {form.latitude !==

                    null &&

                  form.longitude !==

                    null && (

                    <p

                      className="

                        mt-1

                        text-[10px]

                        text-ink-soft

                      "

                    >

                      {form.latitude.toFixed(

                        5

                      )}

                      ,{" "}

                      {form.longitude.toFixed(

                        5

                      )}

                    </p>

                  )}

                </div>



                <button

                  type="button"

                  onClick={() =>

                    setShowMap(

                      (

                        current

                      ) =>

                        !current

                    )

                  }

                  className="

                    text-xs

                    font-semibold

                    text-ocean-700

                    transition

                    hover:text-ocean-950

                  "

                >

                  {showMap

                    ? "Hide"

                    : form.latitude !==

                          null

                      ? "Change"

                      : "Choose"}

                </button>

              </div>



              {showMap && (

                <MemoryLocationPicker

                  latitude={

                    form.latitude

                  }

                  longitude={

                    form.longitude

                  }

                  onChange={(

                    latitude,

                    longitude

                  ) =>

                    setForm(

                      (

                        current

                      ) => ({

                        ...current,



                        latitude,

                        longitude,

                      })

                    )

                  }

                  onClear={() =>

                    setForm(

                      (

                        current

                      ) => ({

                        ...current,



                        latitude:

                          null,



                        longitude:

                          null,

                      })

                    )

                  }

                />

              )}

            </div>

          </div>



          {/* ACTIONS */}



          <div

            className="

              mt-7

              flex

              justify-end

              gap-2

            "

          >

            <button

              type="button"

              onClick={

                onClose

              }

              disabled={

                isSaving

              }

              className="

                rounded-[13px]

                border

                border-ocean-100

                bg-white

                px-5

                py-2.5

                text-sm

                font-semibold

                text-ink-soft

                transition

                hover:bg-ocean-50

                disabled:opacity-40

              "

            >

              Cancel

            </button>



            <button

              type="submit"

              disabled={

                isSaving

              }

              className="

                rounded-[13px]

                bg-ocean-950

                px-5

                py-2.5

                text-sm

                font-semibold

                text-white

                shadow-[0_8px_20px_rgba(8,59,89,0.12)]

                transition

                hover:bg-ocean-800

                disabled:opacity-45

              "

            >

              {isSaving

                ? "Saving..."

                : "Save"}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}



/*

 * =========================================================

 * FORM FIELD

 * =========================================================

 */



const inputClass = `

  w-full

  rounded-[13px]

  border

  border-ocean-100

  bg-white/75

  px-4

  py-3

  text-sm

  text-ocean-950

  outline-none

  transition

  placeholder:text-ink-soft/50

  focus:border-ocean-300

  focus:bg-white

  focus:ring-4

  focus:ring-ocean-100/45

`;



function FormField({

  label,

  required = false,

  children,

}: {

  label: string;

  required?: boolean;



  children:

    ReactNode;

}) {

  return (

    <div>

      <label

        className="

          mb-2

          block

          text-xs

          font-medium

          text-ocean-900

        "

      >

        {label}



        {required

          ? " *"

          : ""}

      </label>



      {children}

    </div>

  );

}



/*

 * =========================================================

 * FILTER

 * =========================================================

 */



function YearFilterButton({

  active,

  onClick,

  children,

}: {

  active:

    boolean;



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

 * BUTTONS

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



function IconButton({

  label,

  destructive = false,

  onClick,

  children,

}: {

  label: string;



  destructive?: boolean;



  onClick:

    () => void;



  children:

    ReactNode;

}) {

  return (

    <button

      type="button"

      aria-label={

        label

      }

      onClick={

        onClick

      }

      className={`

        flex

        h-9

        w-9

        items-center

        justify-center

        rounded-full

        transition



        ${

          destructive

            ? "text-ink-soft hover:bg-heart-soft hover:text-heart"

            : "text-ink-soft hover:bg-ocean-50 hover:text-ocean-900"

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



function EmptyMemories({

  onCreate,

  filtered,

}: {

  onCreate:

    () => void;



  filtered:

    boolean;

}) {

  return (

    <section

      className="

        flex

        min-h-[380px]

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

        {filtered

          ? "No memories here."

          : "No memories yet."}

      </h2>



      {!filtered && (

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

          Add Memory

        </button>

      )}

    </section>

  );

}



/*

 * =========================================================

 * EMPTY FORM

 * =========================================================

 */



function createEmptyForm():

  MemoryFormState {

  return {

    title:

      "",



    story:

      "",



    memoryDate:

      getTodayInputValue(),



    memoryTime:

      "",



    locationName:

      "",



    mapsUrl:

      "",



    latitude:

      null,



    longitude:

      null,

  };

}



/*

 * =========================================================

 * MAP COORDINATES

 * =========================================================

 */



function extractCoordinatesFromMapsUrl(

  value: string

): {

  latitude: number;

  longitude: number;

} | null {

  let decoded =

    value;



  try {

    decoded =

      decodeURIComponent(

        value

      );

  } catch {

    decoded =

      value;

  }



 const patterns = [
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|$)/,

  /[?&](?:q|query|ll|center)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,

  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
];



  for (

    const pattern of

    patterns

  ) {

    const match =

      decoded.match(

        pattern

      );



    if (!match) {

      continue;

    }



    const latitude =

      Number(

        match[1]

      );



    const longitude =

      Number(

        match[2]

      );



    if (

      Number.isFinite(

        latitude

      ) &&

      Number.isFinite(

        longitude

      )

    ) {

      return {

        latitude,

        longitude,

      };

    }

  }



  return null;

}



/*

 * =========================================================

 * HELPERS

 * =========================================================

 */



function sortMemories(

  memories:

    MemoryItem[]

) {

  return [

    ...memories,

  ].sort(

    (

      a,

      b

    ) => {

      const first =

        new Date(

          `${a.memory_date}T${a.memory_time || "00:00"}`

        ).getTime();



      const second =

        new Date(

          `${b.memory_date}T${b.memory_time || "00:00"}`

        ).getTime();



      return (

        second -

        first

      );

    }

  );

}



function getTodayInputValue() {

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



function getYear(

  value: string

) {

  return value.slice(

    0,

    4

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

        "http:" ||

      url.protocol ===

        "https:"

    );

  } catch {

    return false;

  }

}



/*

 * =========================================================

 * ALERTS

 * =========================================================

 */



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



async function showWarning(

  title: string,

  message: string

) {

  await Swal.fire({

    icon:

      "warning",



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