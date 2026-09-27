// src/types/gallery.ts

export type Visibility =
  | "shared"
  | "private";

export type GalleryTab =
  | "photos"
  | "albums"
  | "favorites"
  | "vault";

export type UploadDestination =
  Visibility;

export type GallerySourceType =
  | "upload"
  | "memory";

export type CameraSide =
  | "user"
  | "environment";

/*
 * =========================================================
 * USER
 * =========================================================
 */

export type GalleryUser = {
  id: string;

  email: string;

  fullName: string;

  nickname: string;

  avatarUrl:
    | string
    | null;
};

/*
 * =========================================================
 * ALBUM
 * =========================================================
 */

export type GalleryAlbum = {
  id: string;

  couple_id: string;

  created_by: string;

  owner_id: string;

  name: string;

  description:
    | string
    | null;

  visibility:
    Visibility;

  created_at: string;

  updated_at: string;
};

/*
 * =========================================================
 * PHOTO
 * =========================================================
 */

export type GalleryPhoto = {
  id: string;

  couple_id: string;

  album_id:
    | string
    | null;

  uploaded_by: string;

  owner_id: string;

  storage_bucket: string;

  storage_path: string;

  title:
    | string
    | null;

  caption:
    | string
    | null;

  visibility:
    Visibility;

  source_type:
    GallerySourceType;

  source_memory_photo_id:
    | string
    | null;

  is_favorite: boolean;

  created_at: string;

  updated_at: string;

  signed_url:
    | string
    | null;
};

/*
 * =========================================================
 * GALLERY CLIENT
 * =========================================================
 */

export type GalleryClientProps = {
  user:
    GalleryUser;

  coupleId:
    string;

  initialAlbums:
    GalleryAlbum[];

  initialPhotos:
    GalleryPhoto[];
};

/*
 * =========================================================
 * UPLOAD
 * =========================================================
 */

export type UploadGalleryFileOptions = {
  file: File;

  userId: string;

  coupleId: string;

  visibility:
    Visibility;

  albumId:
    | string
    | null;

  title?:
    | string
    | null;

  note?:
    | string
    | null;
};