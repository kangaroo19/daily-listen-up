export type TossLoginResult = {
  authorizationCode: string;
  referrer: 'DEFAULT' | 'SANDBOX';
};

export async function requestTossLogin(): Promise<TossLoginResult> {
  throw new Error('Toss login is implemented in task 03.');
}
