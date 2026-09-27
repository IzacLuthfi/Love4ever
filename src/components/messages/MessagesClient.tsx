// src/components/messages/MessagesClient.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ImagePlus,
  MoreHorizontal,
  Reply,
  Send,
  Smile,
  X,
} from "lucide-react";

import Swal from "sweetalert2";

import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_ACCEPT,
  normalizeImageFile,
} from "@/utils/image";

/* =========================================================
   TYPES
========================================================= */

type MessageItem = {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  image_path: string | null;
  image_url?: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageReaction = {
  id: string;
  couple_id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

type MessageUser = {
  id: string;
  email: string;
  fullName: string;
  nickname: string;
  avatarUrl: string | null;
};

type PartnerUser = {
  id: string;
  fullName: string;
  nickname: string;
  avatarUrl: string | null;
};

type CoupleInfo = {
  id: string;
  name: string;
};

type MessagesClientProps = {
  user: MessageUser;
  partner: PartnerUser | null;
  couple: CoupleInfo;
  initialMessages: MessageItem[];
};

type PresenceStatus =
  | "online"
  | "offline";

/* =========================================================
   EMOJI
========================================================= */

const MESSAGE_EMOJIS = [
  "😀",
  "😊",
  "😂",
  "😍",
  "😘",
  "🥰",
  "😢",
  "😭",
  "😡",
  "😮",
  "👍",
  "❤️",
] as const;

const REACTION_EMOJIS = [
  "❤️",
  "👍",
  "😂",
  "😢",
  "😡",
  "😮",
] as const;

/* =========================================================
   COMPONENT
========================================================= */

export default function MessagesClient({
  user,
  partner,
  couple,
  initialMessages,
}: MessagesClientProps) {
  const [supabase] =
    useState(
      () =>
        createClient()
    );

  const [
    messages,
    setMessages,
  ] =
    useState<MessageItem[]>(
      sortMessages(
        initialMessages
      )
    );

  const [
    reactions,
    setReactions,
  ] =
    useState<MessageReaction[]>(
      []
    );

  const [
    messageText,
    setMessageText,
  ] =
    useState("");

  const [
    replyTo,
    setReplyTo,
  ] =
    useState<MessageItem | null>(
      null
    );

  const [
    imageFile,
    setImageFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    imagePreviewUrl,
    setImagePreviewUrl,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedImageMessage,
    setSelectedImageMessage,
  ] =
    useState<MessageItem | null>(
      null
    );

  const [
    emojiOpen,
    setEmojiOpen,
  ] =
    useState(false);

  const [
    reactionTargetId,
    setReactionTargetId,
  ] =
    useState<string | null>(
      null
    );

  const [
    isPreparingImage,
    setIsPreparingImage,
  ] =
    useState(false);

  const [
    isSending,
    setIsSending,
  ] =
    useState(false);

  const [
    partnerStatus,
    setPartnerStatus,
  ] =
    useState<PresenceStatus>(
      "offline"
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  const partnerName =
    partner?.nickname?.trim() ||
    partner?.fullName?.trim() ||
    "Messages";

  /* =========================================================
     IMAGE SIGNED URL
  ========================================================= */

  const hydrateMessageImage =
    useCallback(
      async (
        message:
          MessageItem
      ): Promise<MessageItem> => {
        if (
          !message.image_path
        ) {
          return {
            ...message,
            image_url:
              null,
          };
        }

        const {
          data,
          error,
        } =
          await supabase.storage
            .from(
              "message-media"
            )
            .createSignedUrl(
              message.image_path,
              60 * 60 * 6
            );

        if (error) {
          console.error(
            "Message image signed URL:",
            error
          );

          return {
            ...message,
            image_url:
              null,
          };
        }

        return {
          ...message,
          image_url:
            data.signedUrl,
        };
      },
      [
        supabase,
      ]
    );

  /* =========================================================
     INITIAL IMAGE HYDRATION
  ========================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const hydrate =
      async () => {
        const hydrated =
          await Promise.all(
            initialMessages.map(
              (
                message
              ) =>
                hydrateMessageImage(
                  message
                )
            )
          );

        if (
          cancelled
        ) {
          return;
        }

        setMessages(
          sortMessages(
            hydrated
          )
        );
      };

    void hydrate();

    return () => {
      cancelled =
        true;
    };
  }, [
    initialMessages,
    hydrateMessageImage,
  ]);

  /* =========================================================
     LOAD REACTIONS
  ========================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        const {
          data,
          error,
        } =
          await supabase
            .from(
              "message_reactions"
            )
            .select(
              `
              id,
              couple_id,
              message_id,
              user_id,
              emoji,
              created_at
              `
            )
            .eq(
              "couple_id",
              couple.id
            );

        if (
          cancelled
        ) {
          return;
        }

        if (error) {
          console.error(
            "Reaction query:",
            error
          );

          return;
        }

        setReactions(
          (data ??
            []) as MessageReaction[]
        );
      };

    void load();

    return () => {
      cancelled =
        true;
    };
  }, [
    couple.id,
    supabase,
  ]);

  /* =========================================================
     LOCAL IMAGE PREVIEW
  ========================================================= */

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(
        null
      );

      return;
    }

    const url =
      URL.createObjectURL(
        imageFile
      );

    setImagePreviewUrl(
      url
    );

    return () => {
      URL.revokeObjectURL(
        url
      );
    };
  }, [
    imageFile,
  ]);

  /* =========================================================
     REALTIME + PRESENCE
  ========================================================= */

  useEffect(() => {
    const channel =
      supabase
        .channel(
          `love4ever-messages-${couple.id}`,
          {
            config: {
              presence: {
                key:
                  user.id,
              },
            },
          }
        )

        .on(
          "presence",
          {
            event:
              "sync",
          },
          () => {
            if (
              !partner?.id
            ) {
              setPartnerStatus(
                "offline"
              );

              return;
            }

            const state =
              channel.presenceState();

            const online =
              Object.values(
                state
              )
                .flat()
                .some(
                  (
                    presence
                  ) => {
                    const item =
                      presence as {
                        user_id?:
                          string;
                      };

                    return (
                      item.user_id ===
                      partner.id
                    );
                  }
                );

            setPartnerStatus(
              online
                ? "online"
                : "offline"
            );
          }
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

            void hydrateMessageImage(
              incoming
            ).then(
              (
                hydrated
              ) => {
                setMessages(
                  (current) =>
                    upsertMessage(
                      current,
                      hydrated
                    )
                );
              }
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

            void hydrateMessageImage(
              updated
            ).then(
              (
                hydrated
              ) => {
                setMessages(
                  (current) =>
                    upsertMessage(
                      current,
                      hydrated
                    )
                );
              }
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

            setReactions(
              (current) =>
                current.filter(
                  (reaction) =>
                    reaction.message_id !==
                    deleted.id
                )
            );
          }
        )

        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table:
              "message_reactions",

            filter:
              `couple_id=eq.${couple.id}`,
          },
          (payload) => {
            if (
              payload.eventType ===
              "DELETE"
            ) {
              const deleted =
                payload.old as Partial<MessageReaction>;

              if (
                !deleted.id
              ) {
                return;
              }

              setReactions(
                (current) =>
                  current.filter(
                    (reaction) =>
                      reaction.id !==
                      deleted.id
                  )
              );

              return;
            }

            const reaction =
              payload.new as MessageReaction;

            setReactions(
              (current) =>
                upsertReaction(
                  current,
                  reaction
                )
            );
          }
        )

        .subscribe(
          async (
            status
          ) => {
            if (
              status ===
              "SUBSCRIBED"
            ) {
              await channel.track({
                user_id:
                  user.id,

                online_at:
                  new Date()
                    .toISOString(),
              });

              return;
            }

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT" ||
              status ===
                "CLOSED"
            ) {
              setPartnerStatus(
                "offline"
              );
            }
          }
        );

    return () => {
      void channel.untrack();

      void supabase.removeChannel(
        channel
      );
    };
  }, [
    couple.id,
    hydrateMessageImage,
    partner?.id,
    supabase,
    user.id,
  ]);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

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

  /* =========================================================
     TEXTAREA HEIGHT
  ========================================================= */

  useEffect(() => {
    const textarea =
      textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height =
      "0px";

    textarea.style.height =
      `${Math.min(
        textarea.scrollHeight,
        144
      )}px`;
  }, [
    messageText,
  ]);

  /* =========================================================
     REACTION MAP
  ========================================================= */

  const reactionsByMessage =
    useMemo(() => {
      const map =
        new Map<
          string,
          MessageReaction[]
        >();

      for (
        const reaction
        of reactions
      ) {
        const current =
          map.get(
            reaction.message_id
          ) ?? [];

        current.push(
          reaction
        );

        map.set(
          reaction.message_id,
          current
        );
      }

      return map;
    }, [
      reactions,
    ]);

  /* =========================================================
     IMAGE SELECT
  ========================================================= */

  const handleImageSelected =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const input =
        event.currentTarget;

      const rawFile =
        input.files?.[0];

      input.value =
        "";

      if (!rawFile) {
        return;
      }

      setIsPreparingImage(
        true
      );

      try {
        const normalized =
          await normalizeImageFile(
            rawFile,
            {
              maxSizeMB:
                8,

              heicQuality:
                0.88,
            }
          );

        setImageFile(
          normalized
        );
      } catch (error) {
        await showError(
          "Photo could not be used",

          error instanceof
            Error
            ? error.message
            : "Invalid image."
        );
      } finally {
        setIsPreparingImage(
          false
        );
      }
    };

  /* =========================================================
     INSERT EMOJI
  ========================================================= */

  const handleInsertEmoji =
    (
      emoji:
        string
    ) => {
      const textarea =
        textareaRef.current;

      const start =
        textarea
          ?.selectionStart ??
        messageText.length;

      const end =
        textarea
          ?.selectionEnd ??
        messageText.length;

      const next =
        (
          messageText.slice(
            0,
            start
          ) +
          emoji +
          messageText.slice(
            end
          )
        ).slice(
          0,
          5000
        );

      setMessageText(
        next
      );

      setEmojiOpen(
        false
      );

      requestAnimationFrame(
        () => {
          const target =
            textareaRef.current;

          if (!target) {
            return;
          }

          const cursor =
            Math.min(
              start +
                emoji.length,
              next.length
            );

          target.focus();

          target.setSelectionRange(
            cursor,
            cursor
          );
        }
      );
    };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const handleSend =
    async (
      event?:
        FormEvent<HTMLFormElement>
    ) => {
      event?.preventDefault();

      const content =
        messageText.trim();

      if (
        (
          !content &&
          !imageFile
        ) ||
        isSending ||
        isPreparingImage
      ) {
        return;
      }

      if (
        content.length >
        5000
      ) {
        await showWarning(
          "Message too long",
          "Maximum 5000 characters."
        );

        return;
      }

      setIsSending(
        true
      );

      const draft =
        messageText;

      const pendingImage =
        imageFile;

      const pendingReply =
        replyTo;

      setMessageText(
        ""
      );

      setImageFile(
        null
      );

      setReplyTo(
        null
      );

      setEmojiOpen(
        false
      );

      let uploadedPath:
        | string
        | null =
        null;

      try {
        const messageId =
          crypto.randomUUID();

        if (
          pendingImage
        ) {
          const extension =
            getFileExtension(
              pendingImage.name
            );

          uploadedPath =
            `${couple.id}/${messageId}/${crypto.randomUUID()}.${extension}`;

          const {
            error:
              uploadError,
          } =
            await supabase.storage
              .from(
                "message-media"
              )
              .upload(
                uploadedPath,
                pendingImage,
                {
                  upsert:
                    false,

                  cacheControl:
                    "3600",

                  contentType:
                    pendingImage.type ||
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
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "messages"
            )
            .insert({
              id:
                messageId,

              couple_id:
                couple.id,

              sender_id:
                user.id,

              content,

              image_path:
                uploadedPath,

              reply_to_id:
                pendingReply?.id ??
                null,
            })
            .select()
            .single();

        if (error) {
          if (
            uploadedPath
          ) {
            const {
              error:
                cleanupError,
            } =
              await supabase.storage
                .from(
                  "message-media"
                )
                .remove([
                  uploadedPath,
                ]);

            if (
              cleanupError
            ) {
              console.error(
                "Message image rollback:",
                cleanupError
              );
            }
          }

          setMessageText(
            draft
          );

          setImageFile(
            pendingImage
          );

          setReplyTo(
            pendingReply
          );

          throw new Error(
            error.message
          );
        }

        const hydrated =
          await hydrateMessageImage(
            data as MessageItem
          );

        setMessages(
          (current) =>
            upsertMessage(
              current,
              hydrated
            )
        );

        requestAnimationFrame(
          () => {
            textareaRef.current
              ?.focus();
          }
        );
      } catch (error) {
        await showError(
          "Message could not be sent",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsSending(
          false
        );
      }
    };

  /* =========================================================
     KEYBOARD
  ========================================================= */

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

  /* =========================================================
     EDIT
  ========================================================= */

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
            message.image_path
              ? "Optional caption"
              : "Message",

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

          inputAttributes: {
            maxlength:
              "5000",
          },

          inputValidator:
            (
              value
            ) => {
              if (
                !value.trim() &&
                !message.image_path
              ) {
                return "Message cannot be empty.";
              }

              if (
                value.length >
                5000
              ) {
                return "Maximum 5000 characters.";
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
          .from(
            "messages"
          )
          .update({
            content,

            edited_at:
              new Date()
                .toISOString(),
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
          "Message could not be edited",
          error.message
        );

        return;
      }

      const hydrated =
        await hydrateMessageImage(
          data as MessageItem
        );

      setMessages(
        (current) =>
          upsertMessage(
            current,
            hydrated
          )
      );
    };

  /* =========================================================
     DELETE
  ========================================================= */

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
          title:
            "Delete message?",

          text:
            message.image_path
              ? "The attached photo will also be removed."
              : undefined,

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

      const {
        error,
      } =
        await supabase
          .from(
            "messages"
          )
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
          "Message could not be deleted",
          error.message
        );

        return;
      }

      if (
        message.image_path
      ) {
        const {
          error:
            storageError,
        } =
          await supabase.storage
            .from(
              "message-media"
            )
            .remove([
              message.image_path,
            ]);

        if (
          storageError
        ) {
          console.error(
            "Message image cleanup:",
            storageError
          );
        }
      }

      setMessages(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              message.id
          )
      );

      setReactions(
        (current) =>
          current.filter(
            (reaction) =>
              reaction.message_id !==
              message.id
          )
      );

      if (
        replyTo?.id ===
        message.id
      ) {
        setReplyTo(
          null
        );
      }

      if (
        selectedImageMessage?.id ===
        message.id
      ) {
        setSelectedImageMessage(
          null
        );
      }

      if (
        reactionTargetId ===
        message.id
      ) {
        setReactionTargetId(
          null
        );
      }
    };

  /* =========================================================
     OPTIONS
  ========================================================= */

  const handleMessageOptions =
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
          message
        );
      }

      if (
        result.isDenied
      ) {
        await handleDelete(
          message
        );
      }
    };

  /* =========================================================
     REPLY
  ========================================================= */

  const handleReply =
    (
      message:
        MessageItem
    ) => {
      setReplyTo(
        message
      );

      setReactionTargetId(
        null
      );

      requestAnimationFrame(
        () => {
          textareaRef.current
            ?.focus();
        }
      );
    };

  /* =========================================================
     REACTION
  ========================================================= */

  const handleReaction =
    async (
      message:
        MessageItem,

      emoji:
        string
    ) => {
      setReactionTargetId(
        null
      );

      const existing =
        reactions.find(
          (
            reaction
          ) =>
            reaction.message_id ===
              message.id &&
            reaction.user_id ===
              user.id
        ) ??
        null;

      try {
        if (
          existing?.emoji ===
          emoji
        ) {
          const {
            error,
          } =
            await supabase
              .from(
                "message_reactions"
              )
              .delete()
              .eq(
                "id",
                existing.id
              )
              .eq(
                "user_id",
                user.id
              );

          if (error) {
            throw new Error(
              error.message
            );
          }

          setReactions(
            (current) =>
              current.filter(
                (
                  reaction
                ) =>
                  reaction.id !==
                  existing.id
              )
          );

          return;
        }

        if (existing) {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "message_reactions"
              )
              .update({
                emoji,
              })
              .eq(
                "id",
                existing.id
              )
              .eq(
                "user_id",
                user.id
              )
              .select()
              .single();

          if (error) {
            throw new Error(
              error.message
            );
          }

          setReactions(
            (current) =>
              upsertReaction(
                current,
                data as MessageReaction
              )
          );

          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "message_reactions"
            )
            .insert({
              couple_id:
                couple.id,

              message_id:
                message.id,

              user_id:
                user.id,

              emoji,
            })
            .select()
            .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        setReactions(
          (current) =>
            upsertReaction(
              current,
              data as MessageReaction
            )
        );
      } catch (error) {
        await showError(
          "Reaction failed",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      }
    };

  /* =========================================================
     RENDER DATA
  ========================================================= */

  const renderedMessages =
    useMemo(() => {
      return messages.map(
        (
          message,
          index
        ) => {
          const previous =
            index > 0
              ? messages[
                  index - 1
                ]
              : null;

          const currentDate =
            getLocalDateKey(
              message.created_at
            );

          const previousDate =
            previous
              ? getLocalDateKey(
                  previous.created_at
                )
              : null;

          const showDate =
            currentDate !==
            previousDate;

          const groupedWithPrevious =
            !showDate &&
            previous?.sender_id ===
              message.sender_id;

          const repliedMessage =
            message.reply_to_id
              ? messages.find(
                  (
                    item
                  ) =>
                    item.id ===
                    message.reply_to_id
                ) ??
                null
              : null;

          return {
            message,
            repliedMessage,
            showDate,
            groupedWithPrevious,
          };
        }
      );
    }, [
      messages,
    ]);

  /* =========================================================
     UI
  ========================================================= */

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
          px-3
          pb-24
          pt-3
          sm:px-6
          sm:pb-6
          sm:pt-6
          lg:ml-[290px]
          lg:px-8
          lg:pt-7
          xl:px-10
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[calc(100svh-108px)]
            w-full
            max-w-[1220px]
            flex-col
            overflow-hidden
            rounded-[28px]
            border
            border-ocean-100/70
            bg-white/78
            shadow-[0_18px_55px_rgba(8,59,89,0.06)]
            backdrop-blur-xl
            sm:h-[calc(100svh-48px)]
          "
        >
          {/* HEADER */}

          <header
            className="
              flex
              shrink-0
              items-center
              justify-between
              gap-4
              border-b
              border-ocean-100/70
              bg-white/70
              px-4
              py-3.5
              sm:px-6
              sm:py-4
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
                aria-label="Back"
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
                  lg:hidden
                "
              >
                <ArrowLeft
                  size={17}
                  strokeWidth={1.8}
                />
              </Link>

              <Avatar
                name={
                  partnerName
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
                    text-[20px]
                    font-semibold
                    leading-tight
                    tracking-[-0.02em]
                    text-ocean-950
                    sm:text-[22px]
                  "
                >
                  {partnerName}
                </h1>

                <PresenceLabel
                  status={
                    partnerStatus
                  }
                />
              </div>
            </div>

            <p
              className="
                hidden
                max-w-[220px]
                truncate
                text-[10px]
                text-ink-soft/55
                sm:block
              "
            >
              {couple.name}
            </p>
          </header>

          {/* MESSAGES */}

          <section
            className="
              min-h-0
              flex-1
              overflow-y-auto
              px-3
              py-5
              [scrollbar-width:thin]
              [scrollbar-color:#cbeef7_transparent]
              sm:px-6
              sm:py-7
              lg:px-10
            "
            onClick={() => {
              if (
                reactionTargetId
              ) {
                setReactionTargetId(
                  null
                );
              }
            }}
          >
            {messages.length >
            0 ? (
              <div
                className="
                  mx-auto
                  w-full
                  max-w-[820px]
                "
              >
                {renderedMessages.map(
                  ({
                    message,
                    repliedMessage,
                    showDate,
                    groupedWithPrevious,
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
                          repliedMessage={
                            repliedMessage
                          }
                          reactions={
                            reactionsByMessage.get(
                              message.id
                            ) ??
                            []
                          }
                          mine={
                            mine
                          }
                          grouped={
                            groupedWithPrevious
                          }
                          partnerName={
                            partnerName
                          }
                          currentUserId={
                            user.id
                          }
                          reactionPickerOpen={
                            reactionTargetId ===
                            message.id
                          }
                          onToggleReactionPicker={() => {
                            setReactionTargetId(
                              (
                                current
                              ) =>
                                current ===
                                message.id
                                  ? null
                                  : message.id
                            );
                          }}
                          onReact={(
                            emoji
                          ) =>
                            void handleReaction(
                              message,
                              emoji
                            )
                          }
                          onReply={() =>
                            handleReply(
                              message
                            )
                          }
                          onOpenImage={() =>
                            setSelectedImageMessage(
                              message
                            )
                          }
                          onOptions={() =>
                            void handleMessageOptions(
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
                  partnerName
                }
              />
            )}
          </section>

          {/* COMPOSER */}

          <footer
            className="
              shrink-0
              border-t
              border-ocean-100/70
              bg-white/80
              px-3
              py-3
              sm:px-5
              sm:py-4
            "
          >
            <div
              className="
                mx-auto
                w-full
                max-w-[820px]
              "
            >
              {replyTo && (
                <div
                  className="
                    mb-2
                    flex
                    items-center
                    gap-3
                    rounded-[14px]
                    border
                    border-ocean-100
                    bg-ocean-50/60
                    px-4
                    py-2.5
                  "
                >
                  <div
                    className="
                      min-w-0
                      flex-1
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        font-semibold
                        text-ocean-700
                      "
                    >
                      Replying to{" "}
                      {replyTo.sender_id ===
                      user.id
                        ? "yourself"
                        : partnerName}
                    </p>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-xs
                        text-ink-soft
                      "
                    >
                      {getMessagePreviewText(
                        replyTo
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setReplyTo(
                        null
                      )
                    }
                    aria-label="Cancel reply"
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-ink-soft
                      transition
                      hover:bg-white
                      hover:text-ocean-950
                    "
                  >
                    <X
                      size={13}
                    />
                  </button>
                </div>
              )}

              {imagePreviewUrl && (
                <div
                  className="
                    mb-2
                    flex
                    items-end
                    gap-3
                  "
                >
                  <div
                    className="
                      relative
                      h-24
                      w-24
                      overflow-hidden
                      rounded-[14px]
                      border
                      border-ocean-100
                      bg-ocean-50
                    "
                  >
                    <Image
                      src={
                        imagePreviewUrl
                      }
                      alt="Selected photo"
                      fill
                      unoptimized
                      className="
                        object-cover
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setImageFile(
                          null
                        )
                      }
                      aria-label="Remove photo"
                      className="
                        absolute
                        right-1.5
                        top-1.5
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-full
                        bg-black/45
                        text-white
                        backdrop-blur-md
                      "
                    >
                      <X
                        size={12}
                      />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={
                  handleSend
                }
                className="
                  flex
                  w-full
                  items-end
                  gap-2
                "
              >
                {/* PHOTO */}

                <label
                  className={`
                    flex
                    h-[48px]
                    w-[48px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[15px]
                    border
                    border-ocean-100
                    bg-white
                    text-ocean-700
                    transition

                    ${
                      isSending ||
                      isPreparingImage
                        ? "cursor-not-allowed opacity-40"
                        : "cursor-pointer hover:bg-ocean-50 hover:text-ocean-950"
                    }
                  `}
                  aria-label="Add photo"
                >
                  <ImagePlus
                    size={17}
                    strokeWidth={1.8}
                  />

                  <input
                    type="file"
                    accept={
                      IMAGE_ACCEPT
                    }
                    disabled={
                      isSending ||
                      isPreparingImage
                    }
                    onChange={
                      handleImageSelected
                    }
                    className="hidden"
                  />
                </label>

                {/* EMOJI */}

                <div
                  className="
                    relative
                    shrink-0
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setEmojiOpen(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    aria-label="Emoji"
                    className="
                      flex
                      h-[48px]
                      w-[48px]
                      items-center
                      justify-center
                      rounded-[15px]
                      border
                      border-ocean-100
                      bg-white
                      text-ocean-700
                      transition
                      hover:bg-ocean-50
                      hover:text-ocean-950
                    "
                  >
                    <Smile
                      size={17}
                    />
                  </button>

                  {emojiOpen && (
                    <EmojiPicker
                      emojis={[
                        ...MESSAGE_EMOJIS,
                      ]}
                      onSelect={
                        handleInsertEmoji
                      }
                    />
                  )}
                </div>

                {/* TEXT */}

                <div
                  className="
                    relative
                    flex
                    min-h-[48px]
                    min-w-0
                    flex-1
                    items-end
                    rounded-[16px]
                    border
                    border-ocean-100
                    bg-white
                    transition
                    focus-within:border-ocean-200
                    focus-within:ring-4
                    focus-within:ring-ocean-100/35
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
                    rows={1}
                    maxLength={
                      5000
                    }
                    placeholder={
                      isPreparingImage
                        ? "Preparing photo..."
                        : "Message"
                    }
                    className="
                      max-h-36
                      min-h-[46px]
                      min-w-0
                      flex-1
                      resize-none
                      overflow-y-auto
                      bg-transparent
                      px-4
                      py-[13px]
                      text-sm
                      leading-5
                      text-ocean-950
                      outline-none
                      placeholder:text-ink-soft/40
                    "
                  />

                  {messageText.length >
                    4500 && (
                    <span
                      className="
                        mb-[15px]
                        mr-1
                        shrink-0
                        text-[9px]
                        text-ink-soft/50
                      "
                    >
                      {
                        messageText.length
                      }
                      /5000
                    </span>
                  )}
                </div>

                {/* SEND */}

                <button
                  type="submit"
                  disabled={
                    isSending ||
                    isPreparingImage ||
                    (
                      !messageText.trim() &&
                      !imageFile
                    )
                  }
                  aria-label="Send message"
                  className="
                    flex
                    h-[48px]
                    w-[48px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-[15px]
                    bg-ocean-950
                    text-white
                    transition
                    hover:bg-ocean-800
                    active:scale-[0.97]
                    disabled:pointer-events-none
                    disabled:opacity-30
                  "
                >
                  <Send
                    size={16}
                    strokeWidth={1.9}
                  />
                </button>
              </form>
            </div>
          </footer>
        </div>
      </main>

      {/* IMAGE VIEWER */}

      {selectedImageMessage?.image_url && (
        <ImageViewer
          src={
            selectedImageMessage.image_url
          }
          caption={
            selectedImageMessage.content
          }
          onClose={() =>
            setSelectedImageMessage(
              null
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function MessageBubble({
  message,
  repliedMessage,
  reactions,
  mine,
  grouped,
  partnerName,
  currentUserId,
  reactionPickerOpen,
  onToggleReactionPicker,
  onReact,
  onReply,
  onOpenImage,
  onOptions,
}: {
  message: MessageItem;
  repliedMessage:
    MessageItem | null;
  reactions:
    MessageReaction[];
  mine: boolean;
  grouped: boolean;
  partnerName: string;
  currentUserId: string;
  reactionPickerOpen:
    boolean;
  onToggleReactionPicker:
    () => void;
  onReact:
    (
      emoji:
        string
    ) => void;
  onReply:
    () => void;
  onOpenImage:
    () => void;
  onOptions:
    () => void;
}) {
  const summaries =
    summarizeReactions(
      reactions,
      currentUserId
    );

  return (
    <div
      className={`
        group
        flex
        w-full

        ${
          mine
            ? "justify-end"
            : "justify-start"
        }

        ${
          grouped
            ? "mt-1"
            : "mt-3"
        }
      `}
    >
      <div
        className={`
          relative
          flex
          max-w-[92%]
          items-end
          gap-1.5
          sm:max-w-[76%]

          ${
            mine
              ? "flex-row"
              : "flex-row-reverse"
          }
        `}
      >
        {/* DESKTOP ACTIONS */}

        <div
          className="
            mb-1
            hidden
            items-center
            gap-0.5
            opacity-0
            transition
            group-hover:opacity-100
            sm:flex
          "
        >
          <button
            type="button"
            onClick={(
              event
            ) => {
              event.stopPropagation();
              onToggleReactionPicker();
            }}
            aria-label="React"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              text-ink-soft/55
              transition
              hover:bg-white
              hover:text-ocean-900
            "
          >
            <Smile
              size={15}
            />
          </button>

          <button
            type="button"
            onClick={
              onReply
            }
            aria-label="Reply"
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              text-ink-soft/55
              transition
              hover:bg-white
              hover:text-ocean-900
            "
          >
            <Reply
              size={15}
            />
          </button>

          {mine && (
            <button
              type="button"
              onClick={
                onOptions
              }
              aria-label="Message options"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                text-ink-soft/55
                transition
                hover:bg-white
                hover:text-ocean-900
              "
            >
              <MoreHorizontal
                size={16}
              />
            </button>
          )}
        </div>

        {/* REACTION PICKER */}

        {reactionPickerOpen && (
          <div
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className={`
              absolute
              bottom-[calc(100%+8px)]
              z-40
              flex
              items-center
              gap-1
              rounded-full
              border
              border-ocean-100
              bg-white
              p-1.5
              shadow-[0_12px_35px_rgba(6,42,63,0.14)]

              ${
                mine
                  ? "right-0"
                  : "left-0"
              }
            `}
          >
            {REACTION_EMOJIS.map(
              (
                emoji
              ) => (
                <button
                  key={
                    emoji
                  }
                  type="button"
                  onClick={() =>
                    onReact(
                      emoji
                    )
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    text-[17px]
                    transition
                    hover:bg-ocean-50
                    hover:scale-110
                  "
                >
                  {emoji}
                </button>
              )
            )}
          </div>
        )}

        {/* CONTENT */}

        <div
          className="
            min-w-0
          "
        >
          <div
            className={`
              relative
              min-w-0
              py-3

              ${
                message.image_url
                  ? "w-full px-3 sm:min-w-[280px]"
                  : "px-4"
              }

              ${
                mine
                  ? `
                    rounded-[18px]
                    rounded-br-[6px]
                    bg-ocean-950
                    text-white
                  `
                  : `
                    rounded-[18px]
                    rounded-bl-[6px]
                    border
                    border-ocean-100/70
                    bg-white
                    text-ocean-950
                  `
              }
            `}
          >
            {/* REPLY */}

            {message.reply_to_id && (
              <div
                className={`
                  mb-2.5
                  overflow-hidden
                  rounded-[10px]
                  border-l-[3px]
                  px-3
                  py-2

                  ${
                    mine
                      ? "border-sky bg-white/[0.08]"
                      : "border-ocean-400 bg-ocean-50"
                  }
                `}
              >
                <p
                  className={`
                    text-[9px]
                    font-semibold

                    ${
                      mine
                        ? "text-sky"
                        : "text-ocean-700"
                    }
                  `}
                >
                  {repliedMessage
                    ? repliedMessage.sender_id ===
                      currentUserId
                      ? "You"
                      : partnerName
                    : "Reply"}
                </p>

                <p
                  className={`
                    mt-0.5
                    line-clamp-2
                    text-[11px]
                    leading-4

                    ${
                      mine
                        ? "text-white/55"
                        : "text-ink-soft"
                    }
                  `}
                >
                  {repliedMessage
                    ? getMessagePreviewText(
                        repliedMessage
                      )
                    : "Message unavailable"}
                </p>
              </div>
            )}

            {/* IMAGE */}

            {message.image_url && (
              <button
                type="button"
                onClick={
                  onOpenImage
                }
                className="
                  relative
                  mb-2
                  block
                  aspect-[4/3]
                  w-full
                  min-w-[220px]
                  overflow-hidden
                  rounded-[13px]
                  bg-ocean-100
                  sm:min-w-[280px]
                "
              >
                <Image
                  src={
                    message.image_url
                  }
                  alt="Message photo"
                  fill
                  unoptimized
                  className="
                    object-cover
                    transition
                    duration-300
                    hover:scale-[1.015]
                  "
                />
              </button>
            )}

            {/* TEXT */}

            {message.content && (
              <p
                className="
                  whitespace-pre-wrap
                  break-words
                  px-1
                  text-[14px]
                  leading-[1.6]
                "
              >
                {message.content}
              </p>
            )}

            {/* META */}

            <div
              className={`
                mt-1.5
                flex
                items-center
                justify-end
                gap-1.5
                px-1
                text-[9px]

                ${
                  mine
                    ? "text-white/42"
                    : "text-ink-soft/50"
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
          </div>

          {/* REACTIONS */}

          {summaries.length >
            0 && (
            <div
              className={`
                mt-1.5
                flex
                flex-wrap
                gap-1

                ${
                  mine
                    ? "justify-end"
                    : "justify-start"
                }
              `}
            >
              {summaries.map(
                (
                  reaction
                ) => (
                  <button
                    key={
                      reaction.emoji
                    }
                    type="button"
                    onClick={() =>
                      onReact(
                        reaction.emoji
                      )
                    }
                    className={`
                      inline-flex
                      h-7
                      items-center
                      gap-1
                      rounded-full
                      border
                      px-2
                      text-[12px]
                      transition

                      ${
                        reaction.mine
                          ? "border-ocean-300 bg-ocean-50"
                          : "border-ocean-100 bg-white"
                      }
                    `}
                    title={
                      reaction.mine
                        ? "Remove or change your reaction"
                        : "React with this emoji"
                    }
                  >
                    <span>
                      {
                        reaction.emoji
                      }
                    </span>

                    {reaction.count >
                      1 && (
                      <span
                        className="
                          text-[9px]
                          text-ink-soft
                        "
                      >
                        {
                          reaction.count
                        }
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          )}

          {/* MOBILE ACTIONS */}

          <div
            className={`
              mt-1
              flex
              items-center
              gap-1
              sm:hidden

              ${
                mine
                  ? "justify-end"
                  : "justify-start"
              }
            `}
          >
            <button
              type="button"
              onClick={(
                event
              ) => {
                event.stopPropagation();
                onToggleReactionPicker();
              }}
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                text-ink-soft/55
              "
              aria-label="React"
            >
              <Smile
                size={14}
              />
            </button>

            <button
              type="button"
              onClick={
                onReply
              }
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                text-ink-soft/55
              "
              aria-label="Reply"
            >
              <Reply
                size={14}
              />
            </button>

            {mine && (
              <button
                type="button"
                onClick={
                  onOptions
                }
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-full
                  text-ink-soft/55
                "
                aria-label="Options"
              >
                <MoreHorizontal
                  size={14}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMOJI PICKER
========================================================= */

function EmojiPicker({
  emojis,
  onSelect,
}: {
  emojis:
    string[];

  onSelect:
    (
      emoji:
        string
    ) => void;
}) {
  return (
    <div
      className="
        absolute
        bottom-[58px]
        left-0
        z-50
        grid
        w-[190px]
        grid-cols-4
        gap-1
        rounded-[16px]
        border
        border-ocean-100
        bg-white
        p-2
        shadow-[0_16px_40px_rgba(6,42,63,0.14)]
      "
    >
      {emojis.map(
        (
          emoji
        ) => (
          <button
            key={
              emoji
            }
            type="button"
            onClick={() =>
              onSelect(
                emoji
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-[10px]
              text-[20px]
              transition
              hover:bg-ocean-50
              hover:scale-105
            "
          >
            {emoji}
          </button>
        )
      )}
    </div>
  );
}

/* =========================================================
   IMAGE VIEWER
========================================================= */

function ImageViewer({
  src,
  caption,
  onClose,
}: {
  src:
    string;

  caption:
    string;

  onClose:
    () => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[1700]
        flex
        items-center
        justify-center
        bg-[#03121c]/95
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Close photo"
        className="
          absolute
          right-5
          top-5
          z-20
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-black/25
          text-white
          backdrop-blur-md
        "
      >
        <X
          size={18}
        />
      </button>

      <div
        className="
          relative
          h-[82svh]
          w-full
          max-w-[1200px]
        "
      >
        <Image
          src={
            src
          }
          alt={
            caption ||
            "Message photo"
          }
          fill
          unoptimized
          priority
          className="
            object-contain
          "
        />
      </div>

      {caption && (
        <p
          className="
            absolute
            bottom-5
            left-1/2
            max-w-[80vw]
            -translate-x-1/2
            rounded-full
            bg-black/30
            px-5
            py-2.5
            text-center
            text-xs
            text-white/80
            backdrop-blur-md
          "
        >
          {caption}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   DATE
========================================================= */

function DateSeparator({
  value,
}: {
  value:
    string;
}) {
  return (
    <div
      className="
        my-7
        flex
        justify-center
      "
    >
      <span
        className="
          rounded-full
          bg-ocean-50/80
          px-3
          py-1.5
          text-[9px]
          font-medium
          text-ink-soft/70
        "
      >
        {formatDateLabel(
          value
        )}
      </span>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

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
        rounded-[14px]
        bg-ocean-950
        font-display
        text-base
        font-semibold
        text-white
        ring-1
        ring-ocean-100
      "
    >
      {avatarUrl ? (
        <Image
          src={
            avatarUrl
          }
          alt={
            name
          }
          fill
          unoptimized
          className="
            object-cover
          "
        />
      ) : (
        initial
      )}
    </div>
  );
}

/* =========================================================
   PRESENCE
========================================================= */

function PresenceLabel({
  status,
}: {
  status:
    PresenceStatus;
}) {
  const online =
    status ===
    "online";

  return (
    <div
      className="
        mt-1
        flex
        items-center
        gap-1.5
      "
    >
      <span
        className={`
          h-[6px]
          w-[6px]
          rounded-full

          ${
            online
              ? "bg-emerald-500"
              : "bg-ink-soft/30"
          }
        `}
      />

      <span
        className="
          text-[10px]
          text-ink-soft/65
        "
      >
        {online
          ? "Online"
          : "Offline"}
      </span>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

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
        px-6
      "
    >
      <div
        className="
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
          No messages yet.
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-ink-soft
          "
        >
          Say hi to{" "}
          {partnerName}.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getMessagePreviewText(
  message:
    MessageItem
) {
  if (
    message.content
      ?.trim()
  ) {
    return message.content.trim();
  }

  if (
    message.image_path
  ) {
    return "Photo";
  }

  return "Message";
}

function summarizeReactions(
  reactions:
    MessageReaction[],

  currentUserId:
    string
) {
  const map =
    new Map<
      string,
      {
        emoji:
          string;
        count:
          number;
        mine:
          boolean;
      }
    >();

  for (
    const reaction
    of reactions
  ) {
    const current =
      map.get(
        reaction.emoji
      ) ?? {
        emoji:
          reaction.emoji,

        count:
          0,

        mine:
          false,
      };

    current.count +=
      1;

    if (
      reaction.user_id ===
      currentUserId
    ) {
      current.mine =
        true;
    }

    map.set(
      reaction.emoji,
      current
    );
  }

  return [
    ...map.values(),
  ];
}

function upsertMessage(
  current:
    MessageItem[],

  incoming:
    MessageItem
) {
  const exists =
    current.some(
      (
        message
      ) =>
        message.id ===
        incoming.id
    );

  const updated =
    exists
      ? current.map(
          (
            message
          ) =>
            message.id ===
            incoming.id
              ? incoming
              : message
        )
      : [
          ...current,
          incoming,
        ];

  return sortMessages(
    updated
  );
}

function upsertReaction(
  current:
    MessageReaction[],

  incoming:
    MessageReaction
) {
  const sameUserOnMessage =
    current.find(
      (
        reaction
      ) =>
        reaction.message_id ===
          incoming.message_id &&
        reaction.user_id ===
          incoming.user_id
    );

  if (
    sameUserOnMessage &&
    sameUserOnMessage.id !==
    incoming.id
  ) {
    return [
      ...current.filter(
        (
          reaction
        ) =>
          !(
            reaction.message_id ===
              incoming.message_id &&
            reaction.user_id ===
              incoming.user_id
          )
      ),
      incoming,
    ];
  }

  const exists =
    current.some(
      (
        reaction
      ) =>
        reaction.id ===
        incoming.id
    );

  if (!exists) {
    return [
      ...current,
      incoming,
    ];
  }

  return current.map(
    (
      reaction
    ) =>
      reaction.id ===
      incoming.id
        ? incoming
        : reaction
  );
}

function sortMessages(
  messages:
    MessageItem[]
) {
  return [
    ...messages,
  ].sort(
    (
      a,
      b
    ) =>
      new Date(
        a.created_at
      ).getTime() -
      new Date(
        b.created_at
      ).getTime()
  );
}

function getFileExtension(
  fileName:
    string
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

/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDateKey(
  value:
    string
) {
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
    new Date(
      value
    )
  );
}

function getCurrentDateKey(
  offsetDays = 0
) {
  const formatter =
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
    );

  const jakartaToday =
    formatter.format(
      new Date()
    );

  const [
    year,
    month,
    day,
  ] =
    jakartaToday
      .split("-")
      .map(Number);

  const utcAnchor =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + offsetDays,
        12,
        0,
        0
      )
    );

  return formatter.format(
    utcAnchor
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

      hourCycle:
        "h23",
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

  const todayKey =
    getCurrentDateKey();

  const yesterdayKey =
    getCurrentDateKey(
      -1
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

/* =========================================================
   ALERTS
========================================================= */

async function showWarning(
  title:
    string,

  message:
    string
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
      "#083b59",

    background:
      "#fffdf9",

    color:
      "#123d59",
  });
}
