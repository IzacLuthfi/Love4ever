// src/hooks/useCamera.ts

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  CameraSide,
} from "@/types/gallery";

type UseCameraOptions = {
  initialSide?: CameraSide;
  autoStart?: boolean;
  idealWidth?: number;
  idealHeight?: number;
  jpegQuality?: number;
};

type UseCameraReturn = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;

  cameraSide: CameraSide;

  loading: boolean;
  error: string | null;
  isSupported: boolean;

  setCameraSide: (
    side: CameraSide
  ) => void;

  switchCamera:
    () => void;

  startCamera: (
    side?: CameraSide
  ) => Promise<void>;

  stopCamera:
    () => void;

  capturePhoto:
    () => Promise<File | null>;
};

export function useCamera(
  options: UseCameraOptions = {}
): UseCameraReturn {
  const {
    initialSide = "environment",
    autoStart = true,
    idealWidth = 1920,
    idealHeight = 1080,
    jpegQuality = 0.92,
  } = options;

  /*
   * =========================================================
   * REFS
   * =========================================================
   */

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

  /*
   * Digunakan untuk membedakan request kamera terbaru
   * dengan request lama yang masih menunggu getUserMedia().
   */
  const requestIdRef =
    useRef(0);

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [
    cameraSide,
    setCameraSideState,
  ] =
    useState<CameraSide>(
      initialSide
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  /*
   * =========================================================
   * SUPPORT
   * =========================================================
   */

  const isSupported =
    typeof navigator !==
      "undefined" &&
    Boolean(
      navigator
        .mediaDevices
        ?.getUserMedia
    );

  /*
   * =========================================================
   * RELEASE CURRENT STREAM
   * =========================================================
   */

  const releaseCurrentStream =
    useCallback(() => {
      const stream =
        streamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );
      }

      streamRef.current =
        null;

      const video =
        videoRef.current;

      if (video) {
        /*
         * pause() dulu sebelum srcObject dilepas
         * supaya browser tidak meninggalkan play request.
         */
        try {
          video.pause();
        } catch {
          // Ignore.
        }

        video.srcObject =
          null;
      }
    }, []);

  /*
   * =========================================================
   * STOP CAMERA
   * =========================================================
   */

  const stopCamera =
    useCallback(() => {
      /*
       * Membatalkan semua request startCamera sebelumnya.
       */
      requestIdRef.current +=
        1;

      releaseCurrentStream();

      setLoading(false);
    }, [
      releaseCurrentStream,
    ]);

  /*
   * =========================================================
   * CAMERA ERROR
   * =========================================================
   */

  const getCameraErrorMessage =
    useCallback(
      (
        cameraError:
          unknown
      ) => {
        if (
          cameraError instanceof
          DOMException
        ) {
          switch (
            cameraError.name
          ) {
            /*
             * AbortError biasanya cuma terjadi karena
             * stream diganti saat play() masih berjalan.
             * Bukan error kamera sebenarnya.
             */
            case "AbortError":
              return null;

            case "NotAllowedError":
              return "Izin kamera ditolak.";

            case "NotFoundError":
              return "Kamera tidak ditemukan.";

            case "NotReadableError":
              return "Kamera sedang digunakan aplikasi lain.";

            case "OverconstrainedError":
              return "Kamera yang dipilih tidak tersedia.";

            case "SecurityError":
              return "Akses kamera diblokir browser.";

            default:
              return "Kamera tidak dapat dibuka.";
          }
        }

        if (
          cameraError instanceof
          Error
        ) {
          return cameraError.message;
        }

        return "Kamera tidak dapat dibuka.";
      },
      []
    );

  /*
   * =========================================================
   * REQUEST STREAM
   * =========================================================
   */

  const requestCameraStream =
    useCallback(
      async (
        side:
          CameraSide
      ) => {
        if (
          !navigator
            .mediaDevices
            ?.getUserMedia
        ) {
          throw new Error(
            "Browser ini tidak mendukung akses kamera."
          );
        }

        /*
         * Coba exact dulu supaya HP memilih
         * kamera depan / belakang yang benar.
         */
        try {
          return await navigator.mediaDevices.getUserMedia(
            {
              audio:
                false,

              video: {
                facingMode: {
                  exact:
                    side,
                },

                width: {
                  ideal:
                    idealWidth,
                },

                height: {
                  ideal:
                    idealHeight,
                },
              },
            }
          );
        } catch (
          exactError
        ) {
          /*
           * Permission error jangan dicoba ulang.
           */
          if (
            exactError instanceof
              DOMException &&
            (
              exactError.name ===
                "NotAllowedError" ||
              exactError.name ===
                "SecurityError"
            )
          ) {
            throw exactError;
          }

          /*
           * Laptop / browser tertentu tidak mendukung
           * facingMode exact. Gunakan ideal.
           */
          return await navigator.mediaDevices.getUserMedia(
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
                    idealWidth,
                },

                height: {
                  ideal:
                    idealHeight,
                },
              },
            }
          );
        }
      },
      [
        idealHeight,
        idealWidth,
      ]
    );

  /*
   * =========================================================
   * START CAMERA
   * =========================================================
   */

  const startCamera =
    useCallback(
      async (
        side:
          CameraSide =
          cameraSide
      ) => {
        /*
         * Setiap start mendapatkan ID baru.
         */
        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        /*
         * Tutup stream yang sedang aktif,
         * tapi jangan memanggil stopCamera()
         * karena stopCamera menaikkan request id lagi.
         */
        releaseCurrentStream();

        setLoading(true);
        setError(null);

        try {
          const stream =
            await requestCameraStream(
              side
            );

          /*
           * Kalau selama menunggu getUserMedia()
           * user pindah kamera / menutup modal,
           * request ini sudah basi.
           */
          if (
            requestId !==
            requestIdRef.current
          ) {
            stream
              .getTracks()
              .forEach(
                (track) => {
                  track.stop();
                }
              );

            return;
          }

          const video =
            videoRef.current;

          if (!video) {
            stream
              .getTracks()
              .forEach(
                (track) => {
                  track.stop();
                }
              );

            return;
          }

          streamRef.current =
            stream;

          video.srcObject =
            stream;

          /*
           * play() bisa selesai setelah kamera diganti.
           * Tangani AbortError tanpa menjadikannya error UI.
           */
          try {
            await video.play();
          } catch (
            playError
          ) {
            if (
              requestId !==
              requestIdRef.current
            ) {
              return;
            }

            if (
              playError instanceof
                DOMException &&
              playError.name ===
                "AbortError"
            ) {
              return;
            }

            throw playError;
          }
        } catch (
          cameraError
        ) {
          /*
           * Jangan tampilkan error dari request lama.
           */
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          console.error(
            "Camera error:",
            cameraError
          );

          releaseCurrentStream();

          const message =
            getCameraErrorMessage(
              cameraError
            );

          if (message) {
            setError(
              message
            );
          }
        } finally {
          /*
           * Request lama juga tidak boleh
           * mengubah loading milik request baru.
           */
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        cameraSide,
        getCameraErrorMessage,
        releaseCurrentStream,
        requestCameraStream,
      ]
    );

  /*
   * =========================================================
   * CAMERA SIDE
   * =========================================================
   */

  const setCameraSide =
    useCallback(
      (
        side:
          CameraSide
      ) => {
        setCameraSideState(
          side
        );
      },
      []
    );

  const switchCamera =
    useCallback(() => {
      setCameraSideState(
        (current) =>
          current ===
          "user"
            ? "environment"
            : "user"
      );
    }, []);

  /*
   * =========================================================
   * AUTO START
   * =========================================================
   */

  useEffect(() => {
    if (
      !autoStart
    ) {
      return;
    }

    void startCamera(
      cameraSide
    );

    return () => {
      /*
       * Cleanup React Strict Mode juga aman.
       */
      stopCamera();
    };
  }, [
    autoStart,
    cameraSide,
    startCamera,
    stopCamera,
  ]);

  /*
   * =========================================================
   * CAPTURE
   * =========================================================
   */

  const capturePhoto =
    useCallback(
      async (): Promise<File | null> => {
        const video =
          videoRef.current;

        const canvas =
          canvasRef.current;

        if (
          !video ||
          !canvas ||
          video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth ===
            0 ||
          video.videoHeight ===
            0
        ) {
          return null;
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
          return null;
        }

        context.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.save();

        /*
         * Selfie mengikuti mirror preview.
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

        context.restore();

        const blob =
          await new Promise<
            Blob | null
          >(
            (
              resolve
            ) => {
              canvas.toBlob(
                resolve,
                "image/jpeg",
                jpegQuality
              );
            }
          );

        if (!blob) {
          return null;
        }

        const timestamp =
          Date.now();

        return new File(
          [
            blob,
          ],
          `camera-${timestamp}.jpg`,
          {
            type:
              "image/jpeg",

            lastModified:
              timestamp,
          }
        );
      },
      [
        cameraSide,
        jpegQuality,
      ]
    );

  /*
   * =========================================================
   * RETURN
   * =========================================================
   */

  return {
    videoRef,
    canvasRef,

    cameraSide,

    loading,
    error,

    isSupported,

    setCameraSide,
    switchCamera,

    startCamera,
    stopCamera,

    capturePhoto,
  };
}