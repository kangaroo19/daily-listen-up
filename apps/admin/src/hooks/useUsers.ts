import { useEffect, useState } from 'react';
import {
  fetchUsersPage,
  findUserById,
  getUsersErrorMessage,
  type UserPageCursor,
} from '../services/users';
import { AdminUser } from '../types/user';

function resolveUsersErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith('Firebase 환경변수가')) {
    return error.message;
  }

  return getUsersErrorMessage(error);
}

export function useUsers() {
  const [cursorStack, setCursorStack] = useState<UserPageCursor[]>([null]);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchResult, setSearchResult] = useState<AdminUser | null>(null);
  const [searchText, setSearchText] = useState('');
  const [submittedSearchText, setSubmittedSearchText] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);

  async function loadPage(nextPageIndex: number, cursor: UserPageCursor) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const page = await fetchUsersPage(cursor);
      setUsers(page.users);
      setHasNextPage(page.hasNextPage);
      setPageIndex(nextPageIndex);
      setCursorStack((current) => {
        const nextStack = current.slice(0, nextPageIndex + 1);
        nextStack[nextPageIndex] = cursor;
        nextStack[nextPageIndex + 1] = page.lastCursor;
        return nextStack;
      });
    } catch (error) {
      setErrorMessage(resolveUsersErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPage(0, null);
  }, []);

  async function goToNextPage() {
    if (!hasNextPage) {
      return;
    }

    await loadPage(pageIndex + 1, cursorStack[pageIndex + 1] ?? null);
  }

  async function goToPreviousPage() {
    if (pageIndex === 0) {
      return;
    }

    await loadPage(pageIndex - 1, cursorStack[pageIndex - 1] ?? null);
  }

  async function submitSearch() {
    const nextSearchText = searchText.trim();

    if (!nextSearchText) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setErrorMessage('');
    setSubmittedSearchText(nextSearchText);

    try {
      setSearchResult(await findUserById(nextSearchText));
    } catch (error) {
      setSearchResult(null);
      setErrorMessage(resolveUsersErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  }

  function clearSearch() {
    setSearchText('');
    setSubmittedSearchText('');
    setSearchResult(null);
    setErrorMessage('');
  }

  return {
    clearSearch,
    errorMessage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    isLoading,
    isSearching,
    pageIndex,
    searchResult,
    searchText,
    setSearchText,
    submittedSearchText,
    submitSearch,
    users,
  };
}
