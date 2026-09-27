// src/components/search/GlobalSearchClient.tsx

"use client";

import Link from "next/link";

import {
  type ElementType,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowUpRight,
  CalendarDays,
  Image as ImageIcon,
  LoaderCircle,
  MapPinned,
  MessageCircleHeart,
  Music2,
  NotebookPen,
  Search,
  X,
} from "lucide-react";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { createClient } from "@/lib/supabase/client";

type SearchUser = {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  avatarUrl: string | null;
};

type GlobalSearchClientProps = {
  user: SearchUser;
  coupleId: string;
};

type SearchType =
  | "memory"
  | "plan"
  | "note"
  | "gallery"
  | "music"
  | "message";

type SearchFilter =
  | "all"
  | SearchType;

type SearchResult = {
  id: string;
  type: SearchType;
  title: string;
  excerpt: string | null;
  meta: string | null;
  href: string;
  sortAt: string;
};

type MemoryRow = {
  id: string;
  title: string;
  story: string | null;
  memory_date: string;
  location_name: string | null;
  updated_at: string;
};

type PlanRow = {
  id: string;
  title: string;
  description: string | null;
  plan_date: string;
  location_name: string | null;
  status: string;
  updated_at: string;
};

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  category: string;
  updated_at: string;
};

type GalleryRow = {
  id: string;
  title: string | null;
  caption: string | null;
  visibility: string;
  created_at: string;
};

type MusicRow = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  source_type: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
};

const filters: {
  value: SearchFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "memory", label: "Memories" },
  { value: "plan", label: "Planner" },
  { value: "note", label: "Notes" },
  { value: "gallery", label: "Gallery" },
  { value: "music", label: "Music" },
  { value: "message", label: "Messages" },
];

const typeConfig: Record<
  SearchType,
  {
    label: string;
    icon: ElementType;
  }
> = {
  memory: {
    label: "Memory",
    icon: MapPinned,
  },
  plan: {
    label: "Plan",
    icon: CalendarDays,
  },
  note: {
    label: "Note",
    icon: NotebookPen,
  },
  gallery: {
    label: "Photo",
    icon: ImageIcon,
  },
  music: {
    label: "Music",
    icon: Music2,
  },
  message: {
    label: "Message",
    icon: MessageCircleHeart,
  },
};

export default function GlobalSearchClient({
  user,
  coupleId,
}: GlobalSearchClientProps) {
  const [supabase] = useState(
    () => createClient()
  );

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<SearchFilter>("all");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [partialError, setPartialError] =
    useState(false);

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const target =
        event.target as HTMLElement | null;

      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (
        event.key === "/" &&
        !typing
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (
        event.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        setQuery("");
        setResults([]);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  useEffect(() => {
    const raw = query.trim();

    if (raw.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      setPartialError(false);
      return;
    }

    const timer =
      window.setTimeout(() => {
        const requestId =
          requestIdRef.current + 1;

        requestIdRef.current =
          requestId;

        setIsSearching(true);

        void runSearch({
          supabase,
          coupleId,
          userId: user.id,
          query: raw,
        }).then(
          ({
            items,
            hadError,
          }) => {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            setResults(items);
            setPartialError(hadError);
            setIsSearching(false);
          }
        );
      }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    coupleId,
    query,
    supabase,
    user.id,
  ]);

  const visibleResults =
    useMemo(() => {
      if (filter === "all") {
        return results;
      }

      return results.filter(
        (result) =>
          result.type === filter
      );
    }, [
      filter,
      results,
    ]);

  const counts =
    useMemo(() => {
      const map: Partial<
        Record<
          SearchType,
          number
        >
      > = {};

      for (
        const result of results
      ) {
        map[result.type] =
          (map[result.type] ?? 0) +
          1;
      }

      return map;
    }, [
      results,
    ]);

  const hasQuery =
    query.trim().length >= 2;

  return (
    <div className="min-h-[100svh] bg-[#f7f7f4]">
      <AppSidebar user={user} />
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
        <div className="mx-auto w-full max-w-[980px]">
          <header className="border-b border-ocean-100/80 pb-7">
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-ink-soft/55
              "
            >
              Love4ever
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
              Search
            </h1>
          </header>

          <div className="mt-8">
            <div
              className="
                relative
                flex
                items-center
                rounded-[18px]
                border
                border-ocean-100
                bg-white
                shadow-[0_10px_30px_rgba(8,59,89,0.045)]
                transition
                focus-within:border-ocean-300
                focus-within:ring-4
                focus-within:ring-ocean-100/35
              "
            >
              <Search
                size={19}
                strokeWidth={1.8}
                className="
                  ml-4
                  shrink-0
                  text-ink-soft/50
                "
              />

              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Search memories, plans, notes..."
                autoComplete="off"
                className="
                  h-[58px]
                  min-w-0
                  flex-1
                  bg-transparent
                  px-3
                  text-[15px]
                  text-ocean-950
                  outline-none
                  placeholder:text-ink-soft/35
                "
              />

              {isSearching ? (
                <LoaderCircle
                  size={17}
                  className="
                    mr-4
                    shrink-0
                    animate-spin
                    text-ocean-500
                  "
                />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="
                    mr-3
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-ink-soft/55
                    transition
                    hover:bg-ocean-50
                    hover:text-ocean-900
                  "
                >
                  <X size={15} />
                </button>
              ) : (
                <span
                  className="
                    mr-4
                    hidden
                    rounded-[7px]
                    border
                    border-ocean-100
                    bg-[#fafafa]
                    px-2
                    py-1
                    text-[9px]
                    font-medium
                    text-ink-soft/50
                    sm:block
                  "
                >
                  /
                </span>
              )}
            </div>
          </div>

          <div
            className="
              mt-5
              flex
              gap-1
              overflow-x-auto
              pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {filters.map(
              (item) => {
                const active =
                  filter === item.value;

                const count =
                  item.value === "all"
                    ? results.length
                    : counts[item.value] ??
                      0;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        item.value
                      )
                    }
                    className={`
                      shrink-0
                      rounded-full
                      px-3.5
                      py-2
                      text-[11px]
                      font-medium
                      transition

                      ${
                        active
                          ? "bg-ocean-950 text-white"
                          : "text-ink-soft hover:bg-white hover:text-ocean-900"
                      }
                    `}
                  >
                    {item.label}

                    {hasQuery &&
                      count > 0 && (
                        <span
                          className={`
                            ml-1.5
                            text-[9px]

                            ${
                              active
                                ? "text-white/55"
                                : "text-ink-soft/45"
                            }
                          `}
                        >
                          {count}
                        </span>
                      )}
                  </button>
                );
              }
            )}
          </div>

          <section className="mt-7">
            {!hasQuery ? (
              <SearchIdle />
            ) : isSearching &&
              results.length === 0 ? (
              <SearchLoading />
            ) : visibleResults.length > 0 ? (
              <div
                className="
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-ocean-100/75
                  bg-white
                "
              >
                {visibleResults.map(
                  (
                    result,
                    index
                  ) => (
                    <SearchResultRow
                      key={`${result.type}-${result.id}`}
                      result={result}
                      last={
                        index ===
                        visibleResults.length -
                          1
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <NoResults
                query={query.trim()}
              />
            )}

            {partialError &&
              hasQuery && (
                <p className="mt-4 text-center text-[10px] text-ink-soft/55">
                  Some sections could not be searched.
                </p>
              )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SearchResultRow({
  result,
  last,
}: {
  result: SearchResult;
  last: boolean;
}) {
  const config =
    typeConfig[result.type];

  const Icon =
    config.icon;

  return (
    <Link
      href={result.href}
      className={`
        group
        flex
        items-start
        gap-3.5
        px-4
        py-4
        transition
        hover:bg-ocean-50/45
        sm:px-5

        ${
          last
            ? ""
            : "border-b border-ocean-100/65"
        }
      `}
    >
      <span
        className="
          mt-0.5
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-[11px]
          bg-ocean-50
          text-ocean-700
        "
      >
        <Icon
          size={16}
          strokeWidth={1.8}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-ocean-950">
            {result.title}
          </p>

          <span className="shrink-0 text-[9px] text-ink-soft/45">
            {config.label}
          </span>
        </div>

        {result.excerpt && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-soft">
            {result.excerpt}
          </p>
        )}

        {result.meta && (
          <p className="mt-1.5 truncate text-[9px] text-ink-soft/45">
            {result.meta}
          </p>
        )}
      </div>

      <ArrowUpRight
        size={14}
        className="
          mt-1
          shrink-0
          text-ink-soft/25
          transition
          group-hover:text-ocean-700
        "
      />
    </Link>
  );
}

function SearchIdle() {
  return (
    <div className="py-24 text-center">
      <Search
        size={23}
        strokeWidth={1.5}
        className="mx-auto text-ocean-300"
      />

      <p className="mt-4 text-sm text-ink-soft">
        Type at least 2 characters.
      </p>
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-ink-soft">
      <LoaderCircle
        size={16}
        className="animate-spin"
      />

      Searching
    </div>
  );
}

function NoResults({
  query,
}: {
  query: string;
}) {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-[26px] font-semibold tracking-[-0.03em] text-ocean-950">
        No results
      </p>

      <p className="mt-2 text-sm text-ink-soft">
        Nothing found for “{query}”.
      </p>
    </div>
  );
}

async function runSearch({
  supabase,
  coupleId,
  userId,
  query,
}: {
  supabase: ReturnType<
    typeof createClient
  >;
  coupleId: string;
  userId: string;
  query: string;
}): Promise<{
  items: SearchResult[];
  hadError: boolean;
}> {
  const needle =
    sanitizeSearchTerm(
      query
    );

  if (!needle) {
    return {
      items: [],
      hadError: false,
    };
  }

  const pattern =
    `*${needle}*`;

  const [
    memoriesResponse,
    plansResponse,
    notesResponse,
    galleryResponse,
    musicResponse,
    messagesResponse,
  ] =
    await Promise.all([
      supabase
        .from("memories")
        .select(`
          id,
          title,
          story,
          memory_date,
          location_name,
          updated_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .or(
          [
            `title.ilike.${pattern}`,
            `story.ilike.${pattern}`,
            `location_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(8),

      supabase
        .from("plans")
        .select(`
          id,
          title,
          description,
          plan_date,
          location_name,
          status,
          updated_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .or(
          [
            `title.ilike.${pattern}`,
            `description.ilike.${pattern}`,
            `location_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(8),

      supabase
        .from("notes")
        .select(`
          id,
          title,
          content,
          category,
          updated_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .or(
          [
            `title.ilike.${pattern}`,
            `content.ilike.${pattern}`,
            `category.ilike.${pattern}`,
          ].join(",")
        )
        .limit(8),

      supabase
        .from("gallery_photos")
        .select(`
          id,
          title,
          caption,
          visibility,
          created_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .or(
          [
            `title.ilike.${pattern}`,
            `caption.ilike.${pattern}`,
          ].join(",")
        )
        .limit(8),

      supabase
        .from("music_tracks")
        .select(`
          id,
          title,
          artist,
          album,
          source_type,
          updated_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .or(
          [
            `title.ilike.${pattern}`,
            `artist.ilike.${pattern}`,
            `album.ilike.${pattern}`,
          ].join(",")
        )
        .limit(8),

      supabase
        .from("messages")
        .select(`
          id,
          content,
          sender_id,
          created_at
        `)
        .eq(
          "couple_id",
          coupleId
        )
        .ilike(
          "content",
          `%${needle}%`
        )
        .neq(
          "content",
          ""
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(8),
    ]);

  const responses = [
    memoriesResponse,
    plansResponse,
    notesResponse,
    galleryResponse,
    musicResponse,
    messagesResponse,
  ];

  const hadError =
    responses.some(
      (response) =>
        Boolean(
          response.error
        )
    );

  for (
    const response of responses
  ) {
    if (response.error) {
      console.error(
        "Global search:",
        response.error
      );
    }
  }

  const items:
    SearchResult[] =
    [];

  for (
    const memory of
    (memoriesResponse.data ??
      []) as MemoryRow[]
  ) {
    items.push({
      id: memory.id,
      type: "memory",
      title: memory.title,
      excerpt:
        firstText(
          memory.story,
          memory.location_name
        ),
      meta:
        joinMeta(
          formatDate(
            memory.memory_date
          ),
          memory.location_name
        ),
      href:
        `/memories/${memory.id}`,
      sortAt:
        memory.updated_at ||
        memory.memory_date,
    });
  }

  for (
    const plan of
    (plansResponse.data ??
      []) as PlanRow[]
  ) {
    items.push({
      id: plan.id,
      type: "plan",
      title: plan.title,
      excerpt:
        firstText(
          plan.description,
          plan.location_name
        ),
      meta:
        joinMeta(
          formatDate(
            plan.plan_date
          ),
          capitalize(
            plan.status
          )
        ),
      href:
        `/planner/${plan.id}`,
      sortAt:
        plan.updated_at ||
        plan.plan_date,
    });
  }

  for (
    const note of
    (notesResponse.data ??
      []) as NoteRow[]
  ) {
    items.push({
      id: note.id,
      type: "note",
      title: note.title,
      excerpt:
        firstText(
          note.content
        ),
      meta:
        note.category ||
        null,
      href: "/notes",
      sortAt:
        note.updated_at,
    });
  }

  for (
    const photo of
    (galleryResponse.data ??
      []) as GalleryRow[]
  ) {
    items.push({
      id: photo.id,
      type: "gallery",
      title:
        photo.title?.trim() ||
        "Photo",
      excerpt:
        firstText(
          photo.caption
        ),
      meta:
        photo.visibility ===
        "private"
          ? "Private Vault"
          : "Gallery",
      href: "/gallery",
      sortAt:
        photo.created_at,
    });
  }

  for (
    const track of
    (musicResponse.data ??
      []) as MusicRow[]
  ) {
    items.push({
      id: track.id,
      type: "music",
      title: track.title,
      excerpt:
        joinMeta(
          track.artist,
          track.album
        ),
      meta:
        capitalize(
          track.source_type
        ),
      href: "/music",
      sortAt:
        track.updated_at,
    });
  }

  for (
    const message of
    (messagesResponse.data ??
      []) as MessageRow[]
  ) {
    items.push({
      id: message.id,
      type: "message",
      title:
        message.sender_id ===
        userId
          ? "You"
          : "Partner",
      excerpt:
        firstText(
          message.content
        ),
      meta:
        formatDateTime(
          message.created_at
        ),
      href: "/messages",
      sortAt:
        message.created_at,
    });
  }

  return {
    items:
      items
        .sort(
          (
            a,
            b
          ) =>
            new Date(
              b.sortAt
            ).getTime() -
            new Date(
              a.sortAt
            ).getTime()
        )
        .slice(
          0,
          32
        ),

    hadError,
  };
}

function sanitizeSearchTerm(
  value: string
) {
  return value
    .trim()
    .replace(
      /[%_,()."'\\]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .slice(
      0,
      80
    );
}

function firstText(
  ...values: (
    | string
    | null
    | undefined
  )[]
) {
  const value =
    values.find(
      (item) =>
        item?.trim()
    )
      ?.trim() ??
    "";

  if (!value) {
    return null;
  }

  return value.length > 180
    ? `${value.slice(
        0,
        177
      )}...`
    : value;
}

function joinMeta(
  ...values: (
    | string
    | null
    | undefined
  )[]
) {
  const items =
    values.filter(
      (
        value
      ): value is string =>
        Boolean(
          value?.trim()
        )
    );

  return items.length > 0
    ? items.join(" · ")
    : null;
}

function capitalize(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function parseDateOnly(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    parseDateOnly(
      value
    )
  );
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  ).format(
    new Date(
      value
    )
  );
}
