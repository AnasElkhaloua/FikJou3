export type StoredImage = Readonly<{
  deliveryUrl: string;
  storageKey: string;
}>;

export type PutImageInput = Readonly<{
  buffer: Buffer;
  storageKey: string;
}>;

export interface ImageStorage {
  delete(storageKey: string): Promise<void>;
  put(input: PutImageInput): Promise<StoredImage>;
}

export interface LocalImageStorage extends ImageStorage {
  read(storageKey: string): Promise<Buffer>;
}
