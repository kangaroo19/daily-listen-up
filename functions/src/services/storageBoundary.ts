export type AudioUrlRequest = {
  audioStoragePath: string;
};

export async function createAudioUrl({ audioStoragePath }: AudioUrlRequest): Promise<string> {
  throw new Error(`Storage audio URL generation is implemented after this boundary: ${audioStoragePath}`);
}
