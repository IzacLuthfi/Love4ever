// src/components/gallery/CameraCaptureModal.tsx

"use client";

import {
  X,
} from "lucide-react";

import { useCamera } from "@/hooks/useCamera";

type CameraCaptureModalProps = {
  onClose:
    () => void;

  onCapture: (
    file:
      File
  ) => void;
};

export default function CameraCaptureModal({
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const {
    videoRef,
    canvasRef,
    cameraSide,
    loading,
    error,
    isSupported,
    setCameraSide,
    stopCamera,
    capturePhoto,
  } =
    useCamera({
      initialSide:
        "environment",

      autoStart:
        true,

      idealWidth:
        1920,

      idealHeight:
        1080,

      jpegQuality:
        0.92,
    });

  /*
   * =========================================================
   * CLOSE
   * =========================================================
   */

  const handleClose =
    () => {
      stopCamera();

      onClose();
    };

  /*
   * =========================================================
   * CAPTURE
   * =========================================================
   */

  const handleCapture =
    async () => {
      const file =
        await capturePhoto();

      if (!file) {
        return;
      }

      stopCamera();

      onCapture(
        file
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
        fixed
        inset-0
        z-[1800]
        flex
        items-center
        justify-center
        bg-black
        sm:bg-black/90
        sm:p-5
      "
    >
      <div
        className="
          relative
          flex
          h-[100svh]
          w-full
          max-w-[960px]
          flex-col
          overflow-hidden
          bg-black
          sm:h-[92svh]
          sm:rounded-[30px]
          sm:shadow-[0_30px_100px_rgba(0,0,0,0.45)]
        "
      >
        {/* =================================================
            TOP
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            z-30
            flex
            items-center
            justify-between
            bg-gradient-to-b
            from-black/65
            via-black/20
            to-transparent
            px-4
            pb-16
            pt-4
            sm:px-5
            sm:pt-5
          "
        >
          {/* CAMERA SIDE */}

          <div
            className="
              pointer-events-auto
              flex
              rounded-full
              border
              border-white/10
              bg-black/25
              p-1
              backdrop-blur-xl
            "
          >
            <CameraSideButton
              active={
                cameraSide ===
                "user"
              }
              onClick={() =>
                setCameraSide(
                  "user"
                )
              }
            >
              Front
            </CameraSideButton>

            <CameraSideButton
              active={
                cameraSide ===
                "environment"
              }
              onClick={() =>
                setCameraSide(
                  "environment"
                )
              }
            >
              Back
            </CameraSideButton>
          </div>

          {/* CLOSE */}

          <button
            type="button"
            onClick={
              handleClose
            }
            aria-label="Close camera"
            className="
              pointer-events-auto
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-black/25
              text-white
              backdrop-blur-xl
              transition
              hover:bg-black/45
            "
          >
            <X
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>

        {/* =================================================
            VIEW
        ================================================= */}

        <div
          className="
            relative
            min-h-0
            flex-1
            overflow-hidden
            bg-black
          "
        >
          <video
            ref={
              videoRef
            }
            autoPlay
            muted
            playsInline
            className={`
              h-full
              w-full
              object-cover

              ${
                cameraSide ===
                "user"
                  ? "-scale-x-100"
                  : ""
              }
            `}
          />

          {/* LOADING */}

          {loading && (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black
              "
            >
              <div
                className="
                  h-7
                  w-7
                  animate-spin
                  rounded-full
                  border-2
                  border-white/20
                  border-t-white/80
                "
              />
            </div>
          )}

          {/* UNSUPPORTED */}

          {!isSupported && (
            <CameraMessage>
              Camera unavailable.
            </CameraMessage>
          )}

          {/* ERROR */}

          {error && (
            <CameraMessage>
              {error}
            </CameraMessage>
          )}

          {/* SUBTLE FRAME */}

          {!loading &&
            !error &&
            isSupported && (
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-5
                  rounded-[24px]
                  border
                  border-white/[0.06]
                  sm:inset-8
                "
              />
            )}
        </div>

        {/* =================================================
            SHUTTER
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-center
            bg-black
            px-5
            py-7
            sm:py-8
          "
        >
          <button
            type="button"
            onClick={() =>
              void handleCapture()
            }
            disabled={
              loading ||
              Boolean(
                error
              ) ||
              !isSupported
            }
            aria-label="Take photo"
            className="
              flex
              h-[76px]
              w-[76px]
              items-center
              justify-center
              rounded-full
              border-[3px]
              border-white
              transition
              duration-150
              active:scale-95
              disabled:opacity-25
            "
          >
            <span
              className="
                h-[62px]
                w-[62px]
                rounded-full
                bg-white
                transition
                active:scale-90
              "
            />
          </button>
        </div>

        <canvas
          ref={
            canvasRef
          }
          className="hidden"
        />
      </div>
    </div>
  );
}

/*
 * =========================================================
 * CAMERA SIDE
 * =========================================================
 */

function CameraSideButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        rounded-full
        px-4
        py-2
        text-xs
        font-medium
        transition
        duration-200

        ${
          active
            ? "bg-white text-black"
            : "text-white/60 hover:text-white"
        }
      `}
    >
      {children}
    </button>
  );
}

/*
 * =========================================================
 * MESSAGE
 * =========================================================
 */

function CameraMessage({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        absolute
        inset-0
        flex
        items-center
        justify-center
        bg-black
        px-8
        text-center
      "
    >
      <p
        className="
          max-w-sm
          text-sm
          leading-6
          text-white/60
        "
      >
        {children}
      </p>
    </div>
  );
}