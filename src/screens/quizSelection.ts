export function selectSingleChoiceId(currentChoiceIds: string[], choiceId: string): string[] {
  if (currentChoiceIds.length === 1 && currentChoiceIds[0] === choiceId) {
    return currentChoiceIds;
  }

  return [choiceId];
}
