export const collections = {
  quizzes: 'quizzes',
  users: 'users',
  appSessions: 'appSessions',
  userProgress: 'userProgress',
  rewardGrants: 'rewardGrants',
  adRewardEvents: 'adRewardEvents',
} as const;

export type CollectionName = (typeof collections)[keyof typeof collections];
