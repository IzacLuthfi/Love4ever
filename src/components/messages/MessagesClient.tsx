// src/components/messages/MessagesClient.tsx

"use client";

import Link from "next/link";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  Wifi,
  WifiOff,
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

type MessageItem = {
  id: string;

  couple_id: string;

  sender_id: string;

  content: string;

  edited_at:
    | string
    | null;

  created_at: string;

  updated_at: string;
};

type MessageUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type PartnerUser = {
  id: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

type CoupleInfo = {
  id: string;

  name: string;
};

type MessagesClientProps = {
  user: MessageUser;

  partner:
    | PartnerUser
    | null;

  couple: CoupleInfo;

  initialMessages:
    MessageItem[];
};

type RealtimeStatus =
  | "connecting"
  | "connected"
  | "error";

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function MessagesClient({
  user,
  partner,
  couple,
  initialMessages,
}: MessagesClientProps) {
  /*
   * Satu instance browser client
   * selama component hidup.
   */

  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      MessageItem[]
    >(
      initialMessages
    );

  const [
    messageText,
    setMessageText,
  ] =
    useState("");

  const [
    isSending,
    setIsSending,
  ] =
    useState(false);

  const [
    realtimeStatus,
    setRealtimeStatus,
  ] =
    useState<RealtimeStatus>(
      "connecting"
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  /*
   * =========================================================
   * REALTIME
   * =========================================================
   */

  useEffect(() => {
    const channel =
      supabase
        .channel(
          `love4ever-messages-${couple.id}`
        )
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",

            schema:
              "public",

            table:
              "messages",

            filter:
              `couple_id=eq.${couple.id}`,
          },
          (payload) => {
            const incoming =
              payload.new as MessageItem;

            setMessages(
              (current) =>
                upsertMessage(
                  current,
                  incoming
                )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event:
              "UPDATE",

            schema:
              "public",

            table:
              "messages",

            filter:
              `couple_id=eq.${couple.id}`,
          },
          (payload) => {
            const updated =
              payload.new as MessageItem;

            setMessages(
              (current) =>
                upsertMessage(
                  current,
                  updated
                )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event:
              "DELETE",

            schema:
              "public",

            table:
              "messages",

            filter:
              `couple_id=eq.${couple.id}`,
          },
          (payload) => {
            const deleted =
              payload.old as Partial<MessageItem>;

            if (
              !deleted.id
            ) {
              return;
            }

            setMessages(
              (current) =>
                current.filter(
                  (message) =>
                    message.id !==
                    deleted.id
                )
            );
          }
        )
        .subscribe(
          (
            status
          ) => {
            if (
              status ===
              "SUBSCRIBED"
            ) {
              setRealtimeStatus(
                "connected"
              );

              return;
            }

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT"
            ) {
              setRealtimeStatus(
                "error"
              );

              return;
            }

            setRealtimeStatus(
              "connecting"
            );
          }
        );

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [
    couple.id,
    supabase,
  ]);

  /*
   * =========================================================
   * AUTO SCROLL
   * =========================================================
   */

  useEffect(() => {
    messagesEndRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "end",
      });
  }, [
    messages.length,
  ]);

  /*
   * =========================================================
   * SEND
   * =========================================================
   */

  const handleSend =
    async (
      event?:
        FormEvent<HTMLFormElement>
    ) => {
      event?.preventDefault();

      const content =
        messageText.trim();

      if (
        !content ||
        isSending
      ) {
        return;
      }

      if (
        content.length >
        5000
      ) {
        await Swal.fire({
          icon:
            "warning",

          title:
            "Pesan terlalu panjang",

          text:
            "Maksimal 5000 karakter.",

          confirmButtonColor:
            "#1688b5",
        });

        return;
      }

      setIsSending(
        true
      );

      const draft =
        messageText;

      /*
       * Bersihkan input lebih awal
       * supaya composer terasa cepat.
       */

      setMessageText("");

      try {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "messages"
            )
            .insert({
              couple_id:
                couple.id,

              sender_id:
                user.id,

              content,
            })
            .select()
            .single();

        if (error) {
          setMessageText(
            draft
          );

          await showError(
            "Pesan gagal dikirim",
            error.message
          );

          return;
        }

        /*
         * Realtime biasanya juga akan
         * mengirim INSERT event.
         * upsertMessage mencegah duplicate.
         */

        setMessages(
          (current) =>
            upsertMessage(
              current,
              data as MessageItem
            )
        );

        requestAnimationFrame(
          () => {
            textareaRef.current
              ?.focus();
          }
        );
      } finally {
        setIsSending(
          false
        );
      }
    };

  /*
   * =========================================================
   * KEYBOARD SEND
   * =========================================================
   */

  const handleComposerKeyDown =
    (
      event:
        KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        void handleSend();
      }
    };

  /*
   * =========================================================
   * EDIT
   * =========================================================
   */

  const handleEdit =
    async (
      message:
        MessageItem
    ) => {
      if (
        message.sender_id !==
        user.id
      ) {
        return;
      }

      const result =
        await Swal.fire({
          title:
            "Edit Message",

          input:
            "textarea",

          inputValue:
            message.content,

          inputPlaceholder:
            "Tulis pesan...",

          showCancelButton:
            true,

          confirmButtonText:
            "Save",

          cancelButtonText:
            "Batal",

          confirmButtonColor:
            "#1688b5",

          inputAttributes: {
            maxlength:
              "5000",
          },

          inputValidator:
            (value) => {
              if (
                !value.trim()
              ) {
                return "Pesan tidak boleh kosong.";
              }

              if (
                value.length >
                5000
              ) {
                return "Maksimal 5000 karakter.";
              }

              return undefined;
            },
        });

      if (
        !result.isConfirmed ||
        typeof result.value !==
          "string"
      ) {
        return;
      }

      const content =
        result.value.trim();

      const {
        data,
        error,
      } =
        await supabase
          .from("messages")
          .update({
            content,

            edited_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            message.id
          )
          .eq(
            "sender_id",
            user.id
          )
          .select()
          .single();

      if (error) {
        await showError(
          "Pesan gagal diedit",
          error.message
        );

        return;
      }

      setMessages(
        (current) =>
          upsertMessage(
            current,
            data as MessageItem
          )
      );
    };

  /*
   * =========================================================
   * DELETE
   * =========================================================
   */

  const handleDelete =
    async (
      message:
        MessageItem
    ) => {
      if (
        message.sender_id !==
        user.id
      ) {
        return;
      }

      const result =
        await Swal.fire({
          icon:
            "warning",

          title:
            "Hapus pesan?",

          text:
            "Pesan ini akan dihapus permanen.",

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

      const {
        error,
      } =
        await supabase
          .from("messages")
          .delete()
          .eq(
            "id",
            message.id
          )
          .eq(
            "sender_id",
            user.id
          );

      if (error) {
        await showError(
          "Pesan gagal dihapus",
          error.message
        );

        return;
      }

      setMessages(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              message.id
          )
      );
    };

  /*
   * =========================================================
   * GROUP WITH DATE SEPARATOR
   * =========================================================
   */

  const renderedMessages =
    useMemo(() => {
      let previousDate =
        "";

      return messages.map(
        (
          message
        ) => {
          const date =
            getLocalDateKey(
              message.created_at
            );

          const showDate =
            date !==
            previousDate;

          previousDate =
            date;

          return {
            message,
            showDate,
          };
        }
      );
    }, [
      messages,
    ]);

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
          px-3
          pb-24
          pt-3
          sm:px-6
          sm:pt-6
          lg:ml-[290px]
          lg:px-7
          lg:pb-6
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[calc(100svh-108px)]
            w-full
            max-w-[1450px]
            flex-col
            overflow-hidden
            rounded-[28px]
            border
            border-white/80
            bg-white/60
            shadow-[0_20px_70px_rgba(17,76,104,0.10)]
            backdrop-blur-xl
            sm:h-[calc(100svh-48px)]
          "
        >
          {/* =====================================
              CHAT HEADER
          ====================================== */}

          <header
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-4
              border-b
              border-ocean-100
              bg-white/70
              px-4
              py-4
              backdrop-blur-xl
              sm:px-6
            "
          >
            <div
              className="
                flex
                min-w-0
                items-center
                gap-3
              "
            >
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
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
                  transition
                  hover:bg-ocean-100
                "
              >
                <ChevronLeft
                  size={18}
                />
              </Link>

              <Avatar
                name={
                  partner?.nickname ||
                  "Partner"
                }
                avatarUrl={
                  partner?.avatarUrl ??
                  null
                }
              />

              <div
                className="
                  min-w-0
                "
              >
                <h1
                  className="
                    truncate
                    font-display
                    text-xl
                    font-semibold
                    text-ocean-950
                    sm:text-2xl
                  "
                >
                  {partner?.nickname ||
                    "Messages"}
                </h1>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[11px]
                    text-ink-soft
                  "
                >
                  {couple.name}
                </p>
              </div>
            </div>

            <RealtimeBadge
              status={
                realtimeStatus
              }
            />
          </header>

          {/* =====================================
              MESSAGES
          ====================================== */}

          <section
            className="
              min-h-0
              flex-1
              overflow-y-auto
              px-3
              py-5
              sm:px-6
              sm:py-6
              lg:px-8
            "
          >
            {messages.length >
            0 ? (
              <div
                className="
                  mx-auto
                  w-full
                  max-w-[900px]
                "
              >
                {renderedMessages.map(
                  ({
                    message,
                    showDate,
                  }) => {
                    const mine =
                      message.sender_id ===
                      user.id;

                    return (
                      <div
                        key={
                          message.id
                        }
                      >
                        {showDate && (
                          <DateSeparator
                            value={
                              message.created_at
                            }
                          />
                        )}

                        <MessageBubble
                          message={
                            message
                          }
                          mine={
                            mine
                          }
                          senderName={
                            mine
                              ? user.nickname
                              : partner?.nickname ||
                                "Partner"
                          }
                          onEdit={() =>
                            handleEdit(
                              message
                            )
                          }
                          onDelete={() =>
                            handleDelete(
                              message
                            )
                          }
                        />
                      </div>
                    );
                  }
                )}

                <div
                  ref={
                    messagesEndRef
                  }
                />
              </div>
            ) : (
              <EmptyChat
                partnerName={
                  partner?.nickname ||
                  "Partner"
                }
              />
            )}
          </section>

          {/* =====================================
              COMPOSER
          ====================================== */}

          <div
            className="
              shrink-0
              border-t
              border-ocean-100
              bg-white/80
              p-3
              backdrop-blur-xl
              sm:p-4
            "
          >
            <form
              onSubmit={
                handleSend
              }
              className="
                mx-auto
                flex
                max-w-[900px]
                items-end
                gap-2
                rounded-[20px]
                border
                border-ocean-100
                bg-white
                p-2
                shadow-[0_8px_30px_rgba(17,76,104,0.06)]
              "
            >
              <textarea
                ref={
                  textareaRef
                }
                value={
                  messageText
                }
                onChange={(
                  event
                ) =>
                  setMessageText(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleComposerKeyDown
                }
                maxLength={
                  5000
                }
                rows={1}
                placeholder={
                  partner
                    ? `Message ${partner.nickname}...`
                    : "Type a message..."
                }
                className="
                  max-h-36
                  min-h-[46px]
                  min-w-0
                  flex-1
                  resize-none
                  bg-transparent
                  px-3
                  py-3
                  text-sm
                  leading-5
                  text-ocean-950
                  outline-none
                  placeholder:text-ink-soft/60
                "
              />

              <button
                type="submit"
                disabled={
                  isSending ||
                  !messageText.trim()
                }
                aria-label="Send message"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-[14px]
                  bg-ocean-700
                  text-white
                  shadow-[0_8px_20px_rgba(17,107,145,0.20)]
                  transition
                  hover:bg-ocean-800
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <Send
                  size={17}
                />
              </button>
            </form>

            <div
              className="
                mx-auto
                mt-2
                flex
                max-w-[900px]
                items-center
                justify-between
                gap-3
                px-2
              "
            >
              <p
                className="
                  hidden
                  text-[10px]
                  text-ink-soft/60
                  sm:block
                "
              >
                Enter to send • Shift + Enter for new line
              </p>

              <p
                className="
                  ml-auto
                  text-[10px]
                  text-ink-soft/60
                "
              >
                {messageText.length}/5000
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/*
 * =========================================================
 * MESSAGE BUBBLE
 * =========================================================
 */

function MessageBubble({
  message,
  mine,
  senderName,
  onEdit,
  onDelete,
}: {
  message:
    MessageItem;

  mine:
    boolean;

  senderName:
    string;

  onEdit:
    () => void;

  onDelete:
    () => void;
}) {
  return (
    <div
      className={`
        group
        mb-2.5
        flex
        w-full
        ${
          mine
            ? "justify-end"
            : "justify-start"
        }
      `}
    >
      <div
        className={`
          flex
          max-w-[86%]
          items-end
          gap-2
          sm:max-w-[72%]
        `}
      >
        {/* OWN ACTIONS */}

        {mine && (
          <div
            className="
              mb-1
              hidden
              shrink-0
              items-center
              gap-1
              opacity-0
              transition
              group-hover:flex
              group-hover:opacity-100
            "
          >
            <MessageActionButton
              label="Edit message"
              onClick={
                onEdit
              }
            >
              <Pencil
                size={12}
              />
            </MessageActionButton>

            <MessageActionButton
              label="Delete message"
              onClick={
                onDelete
              }
              danger
            >
              <Trash2
                size={12}
              />
            </MessageActionButton>
          </div>
        )}

        <div
          className={`
            min-w-0
            rounded-[20px]
            px-4
            py-3
            ${
              mine
                ? "rounded-br-[6px] bg-gradient-to-br from-ocean-700 to-ocean-600 text-white shadow-[0_8px_22px_rgba(17,107,145,0.14)]"
                : "rounded-bl-[6px] border border-ocean-100 bg-white/85 text-ocean-950 shadow-[0_5px_18px_rgba(17,76,104,0.05)]"
            }
          `}
        >
          {!mine && (
            <p
              className="
                mb-1.5
                text-[10px]
                font-bold
                text-ocean-500
              "
            >
              {senderName}
            </p>
          )}

          <p
            className="
              whitespace-pre-wrap
              break-words
              text-sm
              leading-6
            "
          >
            {message.content}
          </p>

          <div
            className={`
              mt-1.5
              flex
              items-center
              justify-end
              gap-1.5
              text-[9px]
              ${
                mine
                  ? "text-white/55"
                  : "text-ink-soft/55"
              }
            `}
          >
            {message.edited_at && (
              <span>
                edited
              </span>
            )}

            <span>
              {formatTime(
                message.created_at
              )}
            </span>
          </div>

          {/* MOBILE ACTIONS */}

          {mine && (
            <div
              className="
                mt-2
                flex
                justify-end
                gap-1
                sm:hidden
              "
            >
              <button
                type="button"
                onClick={
                  onEdit
                }
                className="
                  rounded-lg
                  bg-white/10
                  p-1.5
                  text-white/70
                "
                aria-label="Edit message"
              >
                <Pencil
                  size={11}
                />
              </button>

              <button
                type="button"
                onClick={
                  onDelete
                }
                className="
                  rounded-lg
                  bg-white/10
                  p-1.5
                  text-white/70
                "
                aria-label="Delete message"
              >
                <Trash2
                  size={11}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * MESSAGE ACTION
 * =========================================================
 */

function MessageActionButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label:
    string;

  onClick:
    () => void;

  danger?:
    boolean;

  children:
    React.ReactNode;
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
        h-7
        w-7
        items-center
        justify-center
        rounded-[9px]
        border
        bg-white
        transition
        ${
          danger
            ? "border-heart-soft text-heart hover:bg-heart-soft"
            : "border-ocean-100 text-ocean-500 hover:bg-ocean-50"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * DATE SEPARATOR
 * =========================================================
 */

function DateSeparator({
  value,
}: {
  value:
    string;
}) {
  return (
    <div
      className="
        my-6
        flex
        items-center
        gap-3
      "
    >
      <div
        className="
          h-px
          flex-1
          bg-ocean-100
        "
      />

      <span
        className="
          rounded-full
          border
          border-ocean-100
          bg-white/70
          px-3
          py-1.5
          text-[9px]
          font-bold
          uppercase
          tracking-[0.1em]
          text-ink-soft
          backdrop-blur-xl
        "
      >
        {formatDateLabel(
          value
        )}
      </span>

      <div
        className="
          h-px
          flex-1
          bg-ocean-100
        "
      />
    </div>
  );
}

/*
 * =========================================================
 * AVATAR
 * =========================================================
 */

function Avatar({
  name,
  avatarUrl,
}: {
  name:
    string;

  avatarUrl:
    | string
    | null;
}) {
  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "?";

  return (
    <div
      className="
        relative
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-[15px]
        bg-gradient-to-br
        from-ocean-700
        to-ocean-400
        text-sm
        font-bold
        text-white
        shadow-sm
      "
      style={
        avatarUrl
          ? {
              backgroundImage:
                `url("${avatarUrl}")`,

              backgroundSize:
                "cover",

              backgroundPosition:
                "center",
            }
          : undefined
      }
    >
      {!avatarUrl &&
        initial}
    </div>
  );
}

/*
 * =========================================================
 * REALTIME BADGE
 * =========================================================
 */

function RealtimeBadge({
  status,
}: {
  status:
    RealtimeStatus;
}) {
  if (
    status ===
    "connected"
  ) {
    return (
      <div
        className="
          flex
          shrink-0
          items-center
          gap-2
          rounded-full
          bg-emerald-50
          px-3
          py-2
          text-[10px]
          font-bold
          text-emerald-700
        "
      >
        <Wifi
          size={12}
        />

        <span
          className="
            hidden
            sm:inline
          "
        >
          Realtime
        </span>
      </div>
    );
  }

  if (
    status ===
    "error"
  ) {
    return (
      <div
        className="
          flex
          shrink-0
          items-center
          gap-2
          rounded-full
          bg-heart-soft
          px-3
          py-2
          text-[10px]
          font-bold
          text-heart
        "
      >
        <WifiOff
          size={12}
        />

        <span
          className="
            hidden
            sm:inline
          "
        >
          Reconnecting
        </span>
      </div>
    );
  }

  return (
    <div
      className="
        flex
        shrink-0
        items-center
        gap-2
        rounded-full
        bg-ocean-50
        px-3
        py-2
        text-[10px]
        font-bold
        text-ocean-600
      "
    >
      <span
        className="
          h-2
          w-2
          animate-pulse
          rounded-full
          bg-ocean-500
        "
      />

      <span
        className="
          hidden
          sm:inline
        "
      >
        Connecting
      </span>
    </div>
  );
}

/*
 * =========================================================
 * EMPTY CHAT
 * =========================================================
 */

function EmptyChat({
  partnerName,
}: {
  partnerName:
    string;
}) {
  return (
    <div
      className="
        flex
        h-full
        min-h-[350px]
        items-center
        justify-center
      "
    >
      <div
        className="
          max-w-sm
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
          <MessageCircle
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
          Start a conversation
        </h2>

        <p
          className="
            mt-2
            text-sm
            leading-7
            text-ink-soft
          "
        >
          Belum ada pesan dengan{" "}
          {partnerName}. Pesan
          pertama bisa dikirim dari
          kolom di bawah.
        </p>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * UPSERT MESSAGE
 * =========================================================
 */

function upsertMessage(
  current:
    MessageItem[],

  incoming:
    MessageItem
) {
  const exists =
    current.some(
      (message) =>
        message.id ===
        incoming.id
    );

  const updated =
    exists
      ? current.map(
          (message) =>
            message.id ===
            incoming.id
              ? incoming
              : message
        )
      : [
          ...current,
          incoming,
        ];

  return updated.sort(
    (a, b) =>
      new Date(
        a.created_at
      ).getTime() -
      new Date(
        b.created_at
      ).getTime()
  );
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

function getLocalDateKey(
  value:
    string
) {
  const date =
    new Date(
      value
    );

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
    date
  );
}

function formatTime(
  value:
    string
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    new Date(
      value
    )
  );
}

function formatDateLabel(
  value:
    string
) {
  const date =
    new Date(
      value
    );

  const targetKey =
    getLocalDateKey(
      value
    );

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() -
      1
  );

  const todayKey =
    new Intl.DateTimeFormat(
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
      today
    );

  const yesterdayKey =
    new Intl.DateTimeFormat(
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
      yesterday
    );

  if (
    targetKey ===
    todayKey
  ) {
    return "Today";
  }

  if (
    targetKey ===
    yesterdayKey
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    date
  );
}

/*
 * =========================================================
 * ERROR
 * =========================================================
 */

async function showError(
  title:
    string,

  message:
    string
) {
  await Swal.fire({
    icon:
      "error",

    title,

    text:
      message,

    confirmButtonColor:
      "#1688b5",
  });
}