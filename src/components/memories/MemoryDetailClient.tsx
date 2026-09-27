// src/components/memories/MemoryDetailClient.tsx



"use client";



import Image from "next/image";

import Link from "next/link";



import {

  type ChangeEvent,

  type ReactNode,

  useMemo,

  useState,

} from "react";



import {

  ArrowLeft,

  ChevronLeft,

  ChevronRight,

  ImagePlus,

  Pencil,

  Star,

  Trash2,

  X,

} from "lucide-react";



import Swal from "sweetalert2";



import AppSidebar from "@/components/layout/AppSidebar";

import MobileBottomNav from "@/components/layout/MobileBottomNav";



import { createClient } from "@/lib/supabase/client";

import {

  IMAGE_ACCEPT,

  normalizeImageFiles,

} from "@/utils/image";

/*

 * =========================================================

 * TYPES

 * =========================================================

 */



type MemoryDetail = {

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

};



type MemoryPhoto = {

  id: string;



  memory_id: string;



  uploaded_by:

    string;



  storage_path:

    string;



  caption:

    | string

    | null;



  is_cover:

    boolean;



  sort_order:

    number;



  created_at:

    string;



  signed_url:

    | string

    | null;

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



type MemoryDetailClientProps = {

  user:

    MemoryUser;



  initialMemory:

    MemoryDetail;



  initialPhotos:

    MemoryPhoto[];

};



/*

 * =========================================================

 * COMPONENT

 * =========================================================

 */



export default function MemoryDetailClient({

  user,

  initialMemory,

  initialPhotos,

}: MemoryDetailClientProps) {

  const [

    memory,

  ] =

    useState<MemoryDetail>(

      initialMemory

    );



  const [

    photos,

    setPhotos,

  ] =

    useState<MemoryPhoto[]>(

      initialPhotos

    );



  const [

    isUploading,

    setIsUploading,

  ] =

    useState(false);



  const [

    selectedPhotoId,

    setSelectedPhotoId,

  ] =

    useState<

      string | null

    >(null);



  /*

   * =========================================================

   * COVER

   * =========================================================

   */



  const coverPhoto =

    useMemo(() => {

      return (

        photos.find(

          (photo) =>

            photo.is_cover

        ) ??

        photos[0] ??

        null

      );

    }, [photos]);



  /*

   * =========================================================

   * LIGHTBOX

   * =========================================================

   */



  const selectedIndex =

    photos.findIndex(

      (photo) =>

        photo.id ===

        selectedPhotoId

    );



  const selectedPhoto =

    selectedIndex >= 0

      ? photos[

          selectedIndex

        ]

      : null;



  const showPrevious =

    () => {

      if (

        photos.length ===

        0

      ) {

        return;

      }



      const index =

        selectedIndex <= 0

          ? photos.length - 1

          : selectedIndex - 1;



      setSelectedPhotoId(

        photos[index].id

      );

    };



  const showNext =

    () => {

      if (

        photos.length ===

        0

      ) {

        return;

      }



      const index =

        selectedIndex >=

        photos.length - 1

          ? 0

          : selectedIndex + 1;



      setSelectedPhotoId(

        photos[index].id

      );

    };



  /*

   * =========================================================

   * UPLOAD

   * =========================================================

   */



  const handleUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const input =
        event.currentTarget;

      const selectedFiles =
        Array.from(
          input.files ??
            []
        );

      if (
        selectedFiles.length ===
        0
      ) {
        return;
      }

      setIsUploading(
        true
      );

      let files:
        File[];

      try {
        files =
          await normalizeImageFiles(
            selectedFiles,
            {
              maxSizeMB:
                8,

              heicQuality:
                0.88,
            }
          );
      } catch (error) {
        await showError(
          "Photo could not be used",

          error instanceof Error
            ? error.message
            : "One of the selected photos is invalid."
        );

        setIsUploading(
          false
        );

        input.value =
          "";

        return;
      }

      const supabase =
        createClient();

      const uploaded:
        MemoryPhoto[] = [];

      try {
        for (
          let index = 0;
          index <
          files.length;
          index++
        ) {
          const file =
            files[index];

          const extension =
            getExtension(
              file.name
            );

          const fileName =
            `${crypto.randomUUID()}.${extension}`;

          const storagePath =
            `${memory.couple_id}/${memory.id}/${fileName}`;

          /*
           * STORAGE
           */

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

          /*
           * FIRST PHOTO = COVER
           */

          const shouldBeCover =
            photos.length ===
              0 &&
            uploaded.length ===
              0;

          /*
           * DATABASE
           */

          const {
            data:
              photoRow,

            error:
              databaseError,
          } =
            await supabase
              .from(
                "memory_photos"
              )
              .insert({
                memory_id:
                  memory.id,

                uploaded_by:
                  user.id,

                storage_path:
                  storagePath,

                caption:
                  null,

                is_cover:
                  shouldBeCover,

                sort_order:
                  photos.length +
                  uploaded.length,
              })
              .select()
              .single();

          if (
            databaseError
          ) {
            await supabase.storage
              .from(
                "memory-photos"
              )
              .remove([
                storagePath,
              ]);

            throw new Error(
              databaseError.message
            );
          }

          /*
           * SIGNED URL
           */

          const {
            data:
              signedData,

            error:
              signedError,
          } =
            await supabase.storage
              .from(
                "memory-photos"
              )
              .createSignedUrl(
                storagePath,
                60 * 60
              );

          if (
            signedError
          ) {
            console.error(
              "Signed URL:",
              signedError
            );
          }

          uploaded.push({
            ...(photoRow as Omit<
              MemoryPhoto,
              "signed_url"
            >),

            signed_url:
              signedData
                ?.signedUrl ??
              null,
          });
        }

        setPhotos(
          (current) => [
            ...current,
            ...uploaded,
          ]
        );

        await showSuccess(
          files.length >
            1
            ? `${files.length} photos added`
            : "Photo added"
        );
      } catch (error) {
        await showError(
          "Upload failed",

          error instanceof
            Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setIsUploading(
          false
        );

        input.value =
          "";
      }
    };


  /*

   * =========================================================

   * COVER

   * =========================================================

   */



  const handleSetCover =

    async (

      photo:

        MemoryPhoto

    ) => {

      if (

        photo.is_cover

      ) {

        return;

      }



      const result =

        await Swal.fire({

          title:

            "Set as cover?",



          showCancelButton:

            true,



          confirmButtonText:

            "Set Cover",



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



      /*

       * RESET OLD COVER

       */



      const {

        error:

          resetError,

      } =

        await supabase

          .from(

            "memory_photos"

          )

          .update({

            is_cover:

              false,

          })

          .eq(

            "memory_id",

            memory.id

          )

          .eq(

            "is_cover",

            true

          );



      if (

        resetError

      ) {

        await showError(

          "Cover could not be changed",

          resetError.message

        );



        return;

      }



      /*

       * SET NEW

       */



      const {

        error,

      } =

        await supabase

          .from(

            "memory_photos"

          )

          .update({

            is_cover:

              true,

          })

          .eq(

            "id",

            photo.id

          );



      if (error) {

        await showError(

          "Cover could not be changed",

          error.message

        );



        return;

      }



      setPhotos(

        (current) =>

          current.map(

            (item) => ({

              ...item,



              is_cover:

                item.id ===

                photo.id,

            })

          )

      );



      await showSuccess(

        "Cover updated"

      );

    };



  /*

   * =========================================================

   * CAPTION

   * =========================================================

   */



  const handleEditCaption =

    async (

      photo:

        MemoryPhoto

    ) => {

      const result =

        await Swal.fire({

          title:

            "Caption",



          input:

            "text",



          inputValue:

            photo.caption ??

            "",



          inputPlaceholder:

            "Optional",



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



      const caption =

        String(

          result.value ??

          ""

        ).trim();



      const supabase =

        createClient();



      const {

        error,

      } =

        await supabase

          .from(

            "memory_photos"

          )

          .update({

            caption:

              caption ||

              null,

          })

          .eq(

            "id",

            photo.id

          );



      if (error) {

        await showError(

          "Caption could not be saved",

          error.message

        );



        return;

      }



      setPhotos(

        (current) =>

          current.map(

            (item) =>

              item.id ===

              photo.id

                ? {

                    ...item,



                    caption:

                      caption ||

                      null,

                  }

                : item

          )

      );

    };



  /*

   * =========================================================

   * DELETE PHOTO

   * =========================================================

   */



  const handleDeletePhoto =

    async (

      photo:

        MemoryPhoto

    ) => {

      const result =

        await Swal.fire({

          title:

            "Delete photo?",



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

        error:

          databaseError,

      } =

        await supabase

          .from(

            "memory_photos"

          )

          .delete()

          .eq(

            "id",

            photo.id

          );



      if (

        databaseError

      ) {

        await showError(

          "Photo could not be deleted",

          databaseError.message

        );



        return;

      }



      const {

        error:

          storageError,

      } =

        await supabase.storage

          .from(

            "memory-photos"

          )

          .remove([

            photo.storage_path,

          ]);



      if (

        storageError

      ) {

        console.error(

          "Photo storage cleanup:",

          storageError

        );

      }



      const remaining =

        photos.filter(

          (item) =>

            item.id !==

            photo.id

        );



      /*

       * REPLACE COVER

       */



      if (

        photo.is_cover &&

        remaining.length >

          0

      ) {

        const nextCover =

          remaining[0];



        const {

          error:

            coverError,

        } =

          await supabase

            .from(

              "memory_photos"

            )

            .update({

              is_cover:

                true,

            })

            .eq(

              "id",

              nextCover.id

            );



        if (

          !coverError

        ) {

          nextCover.is_cover =

            true;

        }

      }



      setPhotos([

        ...remaining,

      ]);



      if (

        selectedPhotoId ===

        photo.id

      ) {

        setSelectedPhotoId(

          null

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

          {/* BACK */}



          <Link

            href="/memories"

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



            Memories

          </Link>



          {/* HERO */}



          <section

            className="

              relative

              mt-5

              min-h-[400px]

              overflow-hidden

              rounded-[32px]

              bg-ocean-950

              shadow-[0_24px_65px_rgba(6,42,63,0.12)]

              sm:min-h-[500px]

            "

          >

            {coverPhoto

              ?.signed_url ? (

              <>

                <Image

                  src={

                    coverPhoto.signed_url

                  }

                  alt={

                    memory.title

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

                    bg-[linear-gradient(to_top,rgba(6,42,63,0.94)_0%,rgba(6,42,63,0.24)_58%,rgba(0,0,0,0.05)_100%)]

                  "

                />

              </>

            ) : (

              <div

                className="

                  absolute

                  inset-0

                  bg-[linear-gradient(145deg,#062a3f,#0b4f71_55%,#1688b5)]

                "

              />

            )}



            {/* ADD PHOTO */}



            <label

              className="

                absolute

                right-5

                top-5

                z-20

                cursor-pointer

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

              {isUploading

                ? "Uploading..."

                : "Add Photos"}



              <input

  type="file"

  accept={

    IMAGE_ACCEPT

  }

  multiple

  disabled={

    isUploading

  }

  onChange={

    handleUpload

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

              {memory.source_plan_id && (

                <p

                  className="

                    text-[10px]

                    font-medium

                    text-white/45

                  "

                >

                  From Planner

                </p>

              )}



              <h1

                className="

                  mt-2

                  max-w-5xl

                  font-display

                  text-[40px]

                  font-semibold

                  leading-[1.02]

                  tracking-[-0.045em]

                  sm:text-[56px]

                  lg:text-[66px]

                "

              >

                {memory.title}

              </h1>



              <div

                className="

                  mt-5

                  flex

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

                    memory.memory_date

                  )}

                </span>



                {memory.memory_time && (

                  <>

                    <MetaDot />



                    <span>

                      {formatTime(

                        memory.memory_time

                      )}

                    </span>

                  </>

                )}



                {memory.location_name && (

                  <>

                    <MetaDot />



                    <span>

                      {

                        memory.location_name

                      }

                    </span>

                  </>

                )}

              </div>

            </div>

          </section>



          {/* CONTENT */}



          <section

            className="

              mt-5

              grid

              gap-5

              xl:grid-cols-[0.72fr_1.28fr]

            "

          >

            {/* STORY + DETAILS */}



            <div

              className="

                space-y-5

              "

            >

              <Surface>

                <div

                  className="

                    p-6

                    sm:p-8

                  "

                >

                  <SectionTitle>

                    Story

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

                    {memory.story ||

                      "No story yet."}

                  </p>

                </div>

              </Surface>



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

                        memory.memory_date

                      )}

                    />



                    <DetailRow

                      label="Time"

                      value={

                        memory.memory_time

                          ? formatTime(

                              memory.memory_time

                            )

                          : "—"

                      }

                    />



                    <DetailRow

                      label="Location"

                      value={

                        memory.location_name ||

                        "—"

                      }

                    />

                  </div>



                  <div

                    className="

                      mt-6

                      flex

                      flex-wrap

                      gap-4

                    "

                  >

                    {memory.maps_url && (

                      <a

                        href={

                          memory.maps_url

                        }

                        target="_blank"

                        rel="noreferrer"

                        className="

                          text-sm

                          font-semibold

                          text-ocean-700

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

                          text-sm

                          font-semibold

                          text-ocean-700

                          transition

                          hover:text-ocean-950

                        "

                      >

                        Original Plan ↗

                      </Link>

                    )}

                  </div>

                </div>

              </Surface>

            </div>



            {/* PHOTOS */}



            <Surface>

              <div

                className="

                  p-5

                  sm:p-7

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

                  <div>

                    <SectionTitle>

                      Photos

                    </SectionTitle>



                    <p

                      className="

                        mt-1

                        text-xs

                        text-ink-soft

                      "

                    >

                      {photos.length}{" "}

                      {photos.length ===

                      1

                        ? "photo"

                        : "photos"}

                    </p>

                  </div>



                  <label

                    className="

                      inline-flex

                      cursor-pointer

                      items-center

                      gap-2

                      rounded-[13px]

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

                    <ImagePlus

                      size={14}

                    />



                    Add



                    <input

  type="file"

  accept={

    IMAGE_ACCEPT

  }

  multiple

  disabled={

    isUploading

  }

  onChange={

    handleUpload

  }

  className="hidden"

/>

                  </label>

                </div>



                {photos.length >

                0 ? (

                  <div

                    className="

                      mt-6

                      grid

                      grid-cols-2

                      gap-3

                      lg:grid-cols-3

                    "

                  >

                    {photos.map(

                      (photo) => (

                        <PhotoCard

                          key={

                            photo.id

                          }

                          photo={

                            photo

                          }

                          onOpen={() =>

                            setSelectedPhotoId(

                              photo.id

                            )

                          }

                          onSetCover={() =>

                            void handleSetCover(

                              photo

                            )

                          }

                          onEditCaption={() =>

                            void handleEditCaption(

                              photo

                            )

                          }

                          onDelete={() =>

                            void handleDeletePhoto(

                              photo

                            )

                          }

                        />

                      )

                    )}

                  </div>

                ) : (

                  <div

                    className="

                      flex

                      min-h-[330px]

                      items-center

                      justify-center

                      text-sm

                      text-ink-soft

                    "

                  >

                    No photos yet.

                  </div>

                )}

              </div>

            </Surface>

          </section>

        </div>

      </main>



      {/* LIGHTBOX */}



      {selectedPhoto && (

        <PhotoLightbox

          photo={

            selectedPhoto

          }

          index={

            selectedIndex

          }

          total={

            photos.length

          }

          onClose={() =>

            setSelectedPhotoId(

              null

            )

          }

          onPrevious={

            showPrevious

          }

          onNext={

            showNext

          }

        />

      )}

    </div>

  );

}



/*

 * =========================================================

 * PHOTO CARD

 * =========================================================

 */



function PhotoCard({

  photo,

  onOpen,

  onSetCover,

  onEditCaption,

  onDelete,

}: {

  photo:

    MemoryPhoto;



  onOpen:

    () => void;



  onSetCover:

    () => void;



  onEditCaption:

    () => void;



  onDelete:

    () => void;

}) {

  return (

    <article

      className="

        group

        relative

        aspect-[4/5]

        overflow-hidden

        rounded-[18px]

        bg-ocean-50

      "

    >

      <button

        type="button"

        onClick={

          onOpen

        }

        className="

          absolute

          inset-0

          z-0

        "

        aria-label="Open photo"

      >

        {photo.signed_url ? (

          <Image

            src={

              photo.signed_url

            }

            alt={

              photo.caption ||

              "Memory photo"

            }

            fill

            unoptimized

            className="

              object-cover

              transition

              duration-700

              group-hover:scale-[1.025]

            "

          />

        ) : (

          <div

            className="

              h-full

              w-full

              bg-ocean-100

            "

          />

        )}

      </button>



      <div

        className="

          pointer-events-none

          absolute

          inset-0

          bg-gradient-to-t

          from-ocean-950/70

          via-transparent

          to-black/5

        "

      />



      {photo.is_cover && (

        <span

          className="

            absolute

            left-3

            top-3

            z-10

            rounded-full

            bg-white/90

            px-2.5

            py-1

            text-[9px]

            font-semibold

            text-ocean-900

            backdrop-blur-md

          "

        >

          Cover

        </span>

      )}



      <div

        className="

          absolute

          inset-x-0

          bottom-0

          z-10

          p-3

        "

      >

        {photo.caption && (

          <p

            className="

              mb-3

              line-clamp-2

              text-xs

              leading-5

              text-white/90

            "

          >

            {photo.caption}

          </p>

        )}



        <div

          className="

            flex

            gap-1.5

            opacity-100

            transition

            sm:opacity-0

            sm:group-hover:opacity-100

          "

        >

          {!photo.is_cover && (

            <PhotoAction

              title="Set cover"

              onClick={

                onSetCover

              }

            >

              <Star

                size={13}

              />

            </PhotoAction>

          )}



          <PhotoAction

            title="Edit caption"

            onClick={

              onEditCaption

            }

          >

            <Pencil

              size={13}

            />

          </PhotoAction>



          <PhotoAction

            title="Delete photo"

            destructive

            onClick={

              onDelete

            }

          >

            <Trash2

              size={13}

            />

          </PhotoAction>

        </div>

      </div>

    </article>

  );

}



function PhotoAction({

  title,

  destructive = false,

  onClick,

  children,

}: {

  title: string;

  destructive?: boolean;



  onClick:

    () => void;



  children:

    ReactNode;

}) {

  return (

    <button

      type="button"

      title={

        title

      }

      onClick={

        onClick

      }

      className={`

        flex

        h-8

        w-8

        items-center

        justify-center

        rounded-full

        bg-white/90

        backdrop-blur-md

        transition

        hover:bg-white



        ${

          destructive

            ? "text-heart"

            : "text-ocean-800"

        }

      `}

    >

      {children}

    </button>

  );

}



/*

 * =========================================================

 * LIGHTBOX

 * =========================================================

 */



function PhotoLightbox({

  photo,

  index,

  total,

  onClose,

  onPrevious,

  onNext,

}: {

  photo:

    MemoryPhoto;



  index:

    number;



  total:

    number;



  onClose:

    () => void;



  onPrevious:

    () => void;



  onNext:

    () => void;

}) {

  return (

    <div

      className="

        fixed

        inset-0

        z-[1600]

        flex

        items-center

        justify-center

        bg-[#04141f]/95

        p-4

        backdrop-blur-sm

      "

    >

      <div

        className="

          relative

          h-full

          w-full

          max-w-[1300px]

        "

      >

        <div

          className="

            absolute

            left-5

            top-5

            z-30

            rounded-full

            bg-black/25

            px-3

            py-1.5

            text-[10px]

            text-white/65

            backdrop-blur-md

          "

        >

          {index + 1} /{" "}

          {total}

        </div>



        <button

          type="button"

          onClick={

            onClose

          }

          aria-label="Close"

          className="

            absolute

            right-5

            top-5

            z-30

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



        {total > 1 && (

          <>

            <button

              type="button"

              onClick={

                onPrevious

              }

              aria-label="Previous"

              className="

                absolute

                left-3

                top-1/2

                z-30

                flex

                h-11

                w-11

                -translate-y-1/2

                items-center

                justify-center

                rounded-full

                bg-black/25

                text-white

                backdrop-blur-md

                sm:left-6

              "

            >

              <ChevronLeft

                size={22}

              />

            </button>



            <button

              type="button"

              onClick={

                onNext

              }

              aria-label="Next"

              className="

                absolute

                right-3

                top-1/2

                z-30

                flex

                h-11

                w-11

                -translate-y-1/2

                items-center

                justify-center

                rounded-full

                bg-black/25

                text-white

                backdrop-blur-md

                sm:right-6

              "

            >

              <ChevronRight

                size={22}

              />

            </button>

          </>

        )}



        <div

          className="

            absolute

            inset-8

            sm:inset-12

          "

        >

          {photo.signed_url && (

            <Image

              src={

                photo.signed_url

              }

              alt={

                photo.caption ||

                "Memory photo"

              }

              fill

              unoptimized

              priority

              className="

                object-contain

              "

            />

          )}

        </div>



        {photo.caption && (

          <p

            className="

              absolute

              bottom-5

              left-1/2

              z-30

              max-w-xl

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

            {photo.caption}

          </p>

        )}

      </div>

    </div>

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

        tracking-[-0.025em]

        text-ocean-950

      "

    >

      {children}

    </h2>

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

  label: string;

  value: string;

}) {

  return (

    <div

      className="

        grid

        grid-cols-[90px_1fr]

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