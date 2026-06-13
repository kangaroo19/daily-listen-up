import { getAdminIdToken } from '../config/firebase';

export type SpeakerGender = 'female' | 'male';

const apiBaseUrl = import.meta.env.VITE_ADMIN_API_BASE_URL ?? '';

export async function generateTtsPreview(script: string, speakerGender: SpeakerGender) {
  const idToken = await getAdminIdToken();

  if (!idToken) {
    throw new Error('관리자 로그인 토큰을 확인할 수 없습니다.');
  }

  const response = await fetch(`${apiBaseUrl}/api/admin/tts-preview`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ script, speakerGender }),
  });

  if (!response.ok) {
    throw new Error('TTS 미리듣기 생성에 실패했습니다. 직접 mp3 업로드로 진행할 수 있습니다.');
  }

  return response.blob();
}
