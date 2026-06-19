import { FormEvent } from 'react';
import { useUsers } from '../hooks/useUsers';
import { formatLoggedInAt, maskUserKey } from '../services/users';
import { AdminUser } from '../types/user';

type UserRowsProps = {
  users: AdminUser[];
};

function UserRows({ users }: UserRowsProps) {
  return (
    <>
      {users.map((user) => (
        <div className="user-table-row" key={user.userId} role="row">
          <span role="cell">
            <strong>{user.userId}</strong>
          </span>
          <span role="cell">{maskUserKey(user.userKey)}</span>
          <span role="cell">{formatLoggedInAt(user.loggedInAt)}</span>
        </div>
      ))}
    </>
  );
}

export function UserList() {
  const {
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
  } = useUsers();

  const isSearchMode = submittedSearchText.length > 0;
  const visibleUsers = isSearchMode && searchResult ? [searchResult] : users;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitSearch();
  }

  return (
    <section className="user-panel" aria-label="유저 관리">
      <div className="panel-header">
        <div>
          <h3>유저 목록</h3>
          <p>{isSearchMode ? `userId 검색: ${submittedSearchText}` : `최근 로그인순 ${pageIndex + 1}페이지`}</p>
        </div>
      </div>

      <form className="user-search" onSubmit={handleSubmit}>
        <label>
          userId 검색
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="userId를 입력하세요"
            type="search"
            value={searchText}
          />
        </label>
        <div className="user-search-actions">
          <button className="primary-button" disabled={isSearching} type="submit">
            검색
          </button>
          <button className="secondary-button" disabled={!isSearchMode && !searchText} onClick={clearSearch} type="button">
            초기화
          </button>
        </div>
      </form>

      {errorMessage ? <p className="error-message" role="alert">{errorMessage}</p> : null}
      {isLoading ? <p className="panel-message">유저 목록을 불러오는 중입니다.</p> : null}
      {isSearching ? <p className="panel-message">유저를 검색하는 중입니다.</p> : null}

      <div className="user-table" role="table" aria-label="유저 목록">
        <div className="user-table-row user-table-head" role="row">
          <span role="columnheader">userId</span>
          <span role="columnheader">userKey</span>
          <span role="columnheader">최근 로그인</span>
        </div>
        <UserRows users={visibleUsers} />
      </div>

      {!isLoading && !isSearchMode && users.length === 0 ? <p className="panel-message">조회된 유저가 없습니다.</p> : null}
      {!isSearching && isSearchMode && !searchResult ? <p className="panel-message">검색 결과가 없습니다.</p> : null}

      {!isSearchMode ? (
        <div className="pagination-actions" aria-label="유저 목록 페이지 이동">
          <button className="secondary-button" disabled={isLoading || pageIndex === 0} onClick={goToPreviousPage} type="button">
            이전
          </button>
          <span>{pageIndex + 1}페이지</span>
          <button className="secondary-button" disabled={isLoading || !hasNextPage} onClick={goToNextPage} type="button">
            다음
          </button>
        </div>
      ) : null}
    </section>
  );
}
