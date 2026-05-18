import { getFirebaseStorage } from '../firebase/admin'

export type AudioUrlSigner = {
  createReadUrl(audioStoragePath: string): Promise<string>
}

export class FirebaseStorageAudioUrlSigner implements AudioUrlSigner {
  async createReadUrl(audioStoragePath: string): Promise<string> {
    const [audioUrl] = await getFirebaseStorage()
      .bucket()
      .file(audioStoragePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000,
      })

    return audioUrl
  }
}
