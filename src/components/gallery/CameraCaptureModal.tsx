// src/components/gallery/CameraCaptureModal.tsx

"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type CameraSide =
  | "user"
  | "environment";

type CameraCaptureModalProps = {
  onClose: () => void;

  onCapture: (
    file: File
  ) => void;
};

export default function CameraCaptureModal({
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const [
    cameraSide,
    setCameraSide,
  ] =
    useState<CameraSide>(
      "environment"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  /*
   * =========================================================
   * STOP CAMERA
   * =========================================================
   */

  const stopCamera =
    () => {
      streamRef.current
        ?.getTracks()
        .forEach(
          (track) => {
            track.stop();
          }
        );

      streamRef.current =
        null;
    };

  /*
   * =========================================================
   * START CAMERA
   * =========================================================
   */

  const startCamera =
    async (
      side:
        CameraSide
    ) => {
      stopCamera();

      setLoading(
        true
      );

      setError(
        null
      );

      try {
        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices
            .getUserMedia
        ) {
          throw new Error(
            "Browser ini tidak mendukung akses kamera."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio:
                false,

              video: {
                facingMode: {
                  ideal:
                    side,
                },

                width: {
                  ideal:
                    1920,
                },

                height: {
                  ideal:
                    1080,
                },
              },
            }
          );

        streamRef.current =
          stream;

        if (
          videoRef.current
        ) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();
        }
      } catch (cameraError) {
        console.error(
          "Camera error:",
          cameraError
        );

        setError(
          cameraError instanceof
            Error
            ? cameraError.message
            : "Kamera tidak dapat dibuka."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /*
   * =========================================================
   * CAMERA SIDE
   * =========================================================
   */

  useEffect(() => {
    void startCamera(
      cameraSide
    );

    return () => {
      stopCamera();
    };
  }, [cameraSide]);

  /*
   * =========================================================
   * SWITCH CAMERA
   * =========================================================
   */

  const handleSwitchCamera =
    (
      side:
        CameraSide
    ) => {
      if (
        cameraSide ===
        side
      ) {
        return;
      }

      setCameraSide(
        side
      );
    };

  /*
   * =========================================================
   * CAPTURE
   * =========================================================
   */

  const handleCapture =
    () => {
      const video =
        videoRef.current;

      const canvas =
        canvasRef.current;

      if (
        !video ||
        !canvas ||
        video.videoWidth ===
          0 ||
        video.videoHeight ===
          0
      ) {
        return;
      }

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;

      const context =
        canvas.getContext(
          "2d"
        );

      if (!context) {
        return;
      }

      /*
       * Selfie dibuat mirror agar
       * hasilnya sama seperti preview.
       */

      if (
        cameraSide ===
        "user"
      ) {
        context.translate(
          canvas.width,
          0
        );

        context.scale(
          -1,
          1
        );
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return;
          }

          const file =
            new File(
              [
                blob,
              ],
              `camera-${Date.now()}.jpg`,
              {
                type:
                  "image/jpeg",
              }
            );

          stopCamera();

          onCapture(
            file
          );
        },
        "image/jpeg",
        0.92
      );
    };

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

  return (
    <div
      className="
        fixed
        inset-0
        z-[1600]
        flex
        items-center
        justify-center
        bg-black
        p-0
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
          max-w-[900px]
          flex-col
          overflow-hidden
          bg-black
          sm:h-auto
          sm:max-h-[92svh]
          sm:rounded-[26px]
        "
      >
        {/* HEADER */}

        <div
          className="
            absolute
            inset-x-0
            top-0
            z-20
            flex
            items-center
            justify-between
            bg-gradient-to-b
            from-black/70
            to-transparent
            px-5
            pb-10
            pt-5
          "
        >
          <div
            className="
              flex
              rounded-full
              bg-black/35
              p-1
              backdrop-blur-xl
            "
          >
            <button
              type="button"
              onClick={() =>
                handleSwitchCamera(
                  "user"
                )
              }
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-semibold
                transition
                ${
                  cameraSide ===
                  "user"
                    ? "bg-white text-black"
                    : "text-white"
                }
              `}
            >
              Depan
            </button>

            <button
              type="button"
              onClick={() =>
                handleSwitchCamera(
                  "environment"
                )
              }
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-semibold
                transition
                ${
                  cameraSide ===
                  "environment"
                    ? "bg-white text-black"
                    : "text-white"
                }
              `}
            >
              Belakang
            </button>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-black/35
              text-xl
              text-white
              backdrop-blur-xl
            "
            aria-label="Close camera"
          >
            ×
          </button>
        </div>

        {/* CAMERA */}

        <div
          className="
            relative
            flex
            min-h-0
            flex-1
            items-center
            justify-center
            overflow-hidden
            bg-black
            sm:aspect-[4/3]
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

          {loading && (
            <div
              className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                bg-black
                text-sm
                text-white/70
              "
            >
              Membuka kamera...
            </div>
          )}

          {error && (
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
              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Kamera tidak dapat dibuka
                </p>

                <p
                  className="
                    mt-2
                    text-xs
                    leading-6
                    text-white/55
                  "
                >
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SHUTTER */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-center
            bg-black
            px-5
            py-7
          "
        >
          <button
            type="button"
            onClick={
              handleCapture
            }
            disabled={
              loading ||
              Boolean(
                error
              )
            }
            aria-label="Take photo"
            className="
              flex
              h-[74px]
              w-[74px]
              items-center
              justify-center
              rounded-full
              border-[4px]
              border-white
              disabled:opacity-40
            "
          >
            <span
              className="
                h-[58px]
                w-[58px]
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