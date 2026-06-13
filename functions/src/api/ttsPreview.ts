import { getAuth } from 'firebase-admin/auth';
import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { setCorsHeaders, sendJson } from './responses.js';

type SpeakerGender = 'female' | 'male';

type TtsPreviewDependencies = {
  fetchImpl?: typeof fetch;
  verifyIdToken?: (idToken: string) => Promise<{ uid: string }>;
  env?: NodeJS.ProcessEnv;
};

type TtsPreviewBody = {
  script?: unknown;
  speakerGender?: unknown;
};

const elevenLabsModelId = 'eleven_multilingual_v2';

export function createHandleTtsPreview(dependencies: TtsPreviewDependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const verifyIdToken = dependencies.verifyIdToken ?? ((idToken: string) => getAuth().verifyIdToken(idToken));
  const env = dependencies.env ?? process.env;

  return async function handleTtsPreview(req: Request, res: Response): Promise<void> {
    if (req.method !== 'POST') {
      sendJson(res, 405, { code: 'method_not_allowed' });
      return;
    }

    const idToken = readBearerToken(req);

    if (!idToken) {
      sendJson(res, 401, { code: 'missing_auth_token' });
      return;
    }

    let uid = '';

    try {
      uid = (await verifyIdToken(idToken)).uid;
    } catch {
      sendJson(res, 401, { code: 'invalid_auth_token' });
      return;
    }

    if (!isAllowedAdmin(uid, env.ADMIN_UID_ALLOWLIST)) {
      sendJson(res, 403, { code: 'admin_forbidden' });
      return;
    }

    const body = (req.body ?? {}) as TtsPreviewBody;
    const script = typeof body.script === 'string' ? body.script.trim() : '';
    const speakerGender = body.speakerGender;

    if (!script) {
      sendJson(res, 400, { code: 'invalid_script' });
      return;
    }

    if (speakerGender !== 'female' && speakerGender !== 'male') {
      sendJson(res, 400, { code: 'invalid_speaker_gender' });
      return;
    }

    const apiKey = env.ELEVENLABS_API_KEY;
    const voiceId = getVoiceId(speakerGender, env);

    if (!apiKey || !voiceId) {
      sendJson(res, 500, { code: 'tts_not_configured' });
      return;
    }

    const response = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: elevenLabsModelId,
      }),
    });

    if (!response.ok) {
      sendJson(res, 502, { code: 'tts_generation_failed' });
      return;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    setCorsHeaders(res);
    res.status(200).set('content-type', 'audio/mpeg').send(audioBuffer);
  };
}

export const handleTtsPreview = createHandleTtsPreview();

function readBearerToken(req: Request) {
  const authorization = req.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');

  return scheme.toLowerCase() === 'bearer' ? token : '';
}

function isAllowedAdmin(uid: string, allowlist = '') {
  return allowlist
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(uid);
}

function getVoiceId(speakerGender: SpeakerGender, env: NodeJS.ProcessEnv) {
  return speakerGender === 'female' ? env.ELEVENLABS_VOICE_ID_FEMALE : env.ELEVENLABS_VOICE_ID_MALE;
}
