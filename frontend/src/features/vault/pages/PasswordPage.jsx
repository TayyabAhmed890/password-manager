import { useCallback, useEffect, useState } from 'react'
import { Edit3, Eye, EyeOff, LoaderCircle, LockKeyhole, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthApiError, getAuthErrorMessage } from '../../auth/api/authApi'
import { useAuth } from '../../../app/useAuth'
import { deleteVaultEntry, getVaultEntries, revealVaultEntry } from '../api/vaultApi'
import UpdateVaultPasswordDialog from '../components/UpdateVaultPasswordDialog'
import { useVaultToast } from '../components/useVaultToast'

const MAX_VAULT_ENTRIES = 10

const PasswordPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { clearAuthenticatedUser } = useAuth()
  const { showToast } = useVaultToast()
  const [entries, setEntries] = useState([])
  const [vaultCount, setVaultCount] = useState(null)
  const [maxEntries, setMaxEntries] = useState(MAX_VAULT_ENTRIES)
  const [searchText, setSearchText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [revealedPasswords, setRevealedPasswords] = useState({})
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [revealingId, setRevealingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState('')
  const [mobileDeleteId, setMobileDeleteId] = useState('')
  const [editingEntry, setEditingEntry] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleExpiredSession = useCallback((error) => {
    if (error instanceof AuthApiError && error.status === 401) {
      clearAuthenticatedUser()
      navigate('/login', { replace: true })
      return true
    }

    return false
  }, [clearAuthenticatedUser, navigate])

  useEffect(() => {
    let active = true

    const fetchEntries = async () => {
      try {
        const result = await getVaultEntries(searchTerm)
        if (active) {
          setErrorMessage('')
          setEntries(result.data)
          setVaultCount(result.vault?.currentCount ?? result.data.length)
          setMaxEntries(result.vault?.maxEntries ?? MAX_VAULT_ENTRIES)
        }
      } catch (error) {
        if (!active) return
        if (handleExpiredSession(error)) return
        const message = getAuthErrorMessage(
          error,
          'We could not load your vault. Please try again.',
          { 401: 'Your session has expired. Please log in again.' }
        )
        setErrorMessage(message)
        showToast(message, 'error')
      } finally {
        if (active) {
          setIsLoading(false)
          setIsSearching(false)
          setIsRefreshing(false)
        }
      }
    }

    fetchEntries()
    return () => {
      active = false
    }
  }, [handleExpiredSession, searchTerm, refreshVersion, showToast])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchText.trim())
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchText])

  useEffect(() => {
    if (location.state?.notice) {
      showToast(location.state.notice)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, showToast])

  const toggleReveal = async (entry) => {
    if (visiblePasswords[entry.id]) {
      setVisiblePasswords((visible) => ({ ...visible, [entry.id]: false }))
      return
    }

    if (revealedPasswords[entry.id] !== undefined) {
      setVisiblePasswords((visible) => ({ ...visible, [entry.id]: true }))
      return
    }

    setRevealingId(entry.id)
    setErrorMessage('')
    try {
      const result = await revealVaultEntry(entry.id)
      setRevealedPasswords((passwords) => ({
        ...passwords,
        [entry.id]: result.data.password,
      }))
      setVisiblePasswords((visible) => ({ ...visible, [entry.id]: true }))
    } catch (error) {
      if (handleExpiredSession(error)) return
      const message = getAuthErrorMessage(
        error,
        'We could not reveal this password. Please try again.',
        { 404: 'This password entry is no longer available.' }
      )
      setErrorMessage(message)
      showToast(message, 'error')
    } finally {
      setRevealingId('')
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    setErrorMessage('')
    try {
      await deleteVaultEntry(id)
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.id !== id))
      setVaultCount((count) => count === null ? count : Math.max(0, count - 1))
      setRevealedPasswords((passwords) => {
        const next = { ...passwords }
        delete next[id]
        return next
      })
      setVisiblePasswords((visible) => {
        const next = { ...visible }
        delete next[id]
        return next
      })
      setConfirmDeleteId('')
      setMobileDeleteId('')
      showToast('Password removed from your vault.')
    } catch (error) {
      if (handleExpiredSession(error)) return
      const message = getAuthErrorMessage(
        error,
        'We could not delete this password. Please try again.',
        { 404: 'This password entry is no longer available.' }
      )
      setErrorMessage(message)
      showToast(message, 'error')
    } finally {
      setDeletingId('')
    }
  }

  const requestDeleteConfirmation = (id) => {
    if (window.matchMedia('(max-width: 639px)').matches) {
      setMobileDeleteId(id)
      return
    }

    setConfirmDeleteId(id)
  }

  const handlePasswordUpdated = () => {
    setRevealedPasswords((passwords) => {
      const next = { ...passwords }
      delete next[editingEntry.id]
      return next
    })
    setVisiblePasswords((visible) => {
      const next = { ...visible }
      delete next[editingEntry.id]
      return next
    })
    setEditingEntry(null)
    showToast('Saved password updated.')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-neutral-500">Your vault</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
            All passwords
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Find a saved sign-in here whenever you need it.
          </p>
        </div>
        {vaultCount !== null && vaultCount >= maxEntries ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 bg-neutral-100 px-4 text-sm font-semibold text-neutral-500 sm:self-auto"
          >
            <Plus size={17} aria-hidden="true" />
            Vault full
          </button>
        ) : (
          <Link
            to="/passwords/create"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-neutral-950 bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-700 sm:self-auto"
          >
            <Plus size={17} aria-hidden="true" />
            Add a password
          </Link>
        )}
      </header>

      {vaultCount !== null && vaultCount >= maxEntries && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
          Your vault is full ({vaultCount}/{maxEntries}). Delete a saved password before adding another.
        </p>
      )}

      <section aria-labelledby="saved-logins-heading" className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 id="saved-logins-heading" className="text-lg font-semibold text-neutral-950">
              Saved logins
            </h2>
            {!isLoading && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                {searchTerm
                  ? `${entries.length} of ${vaultCount ?? entries.length} matches`
                  : `${vaultCount ?? entries.length}/${maxEntries} saved`}
              </span>
            )}
          </div>
          {vaultCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true)
                setRefreshVersion((version) => version + 1)
              }}
              disabled={isRefreshing || isLoading}
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
              {isRefreshing ? 'Refreshing…' : 'Refresh list'}
            </button>
          )}
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
            {errorMessage}
          </p>
        )}

        {vaultCount > 0 && (
          <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 focus-within:border-neutral-400">
            <Search size={17} className="shrink-0 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => {
                const nextSearch = event.target.value
                if (nextSearch.trim() === searchTerm) setIsSearching(false)
                else setIsSearching(true)
                setSearchText(nextSearch)
              }}
              maxLength={100}
              placeholder="Search website or email"
              aria-label="Search saved passwords by website or email"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
            />
            {isSearching && <LoaderCircle size={16} className="animate-spin text-neutral-400" aria-label="Searching" />}
          </label>
        )}

        {isLoading ? (
          <div className="mt-5 space-y-3" role="status" aria-label="Loading saved logins">
            <span className="sr-only">Loading your saved logins…</span>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                aria-hidden="true"
                className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
              >
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-end sm:gap-x-4 sm:gap-y-4">
                  <span className="size-10 animate-pulse rounded-xl bg-neutral-100" />
                  <div className="col-start-2 row-start-1 min-w-0 space-y-2">
                    <span className="block h-4 w-2/5 animate-pulse rounded bg-neutral-100" />
                    <span className="block h-3 w-3/5 animate-pulse rounded bg-neutral-100" />
                    <span className="mt-3 block h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
                  </div>
                  <div className="col-start-2 row-start-2 flex justify-end gap-2 sm:col-start-3 sm:row-start-1">
                    <span className="size-10 animate-pulse rounded-lg bg-neutral-100" />
                    <span className="size-10 animate-pulse rounded-lg bg-neutral-100" />
                    <span className="size-10 animate-pulse rounded-lg bg-neutral-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 && errorMessage ? (
          <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 text-center">
            <p className="text-sm text-neutral-600">Your saved logins aren’t available right now.</p>
            <button
              type="button"
              onClick={() => {
                setIsRefreshing(true)
                setRefreshVersion((version) => version + 1)
              }}
              disabled={isRefreshing}
              className="mt-4 min-h-10 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {isRefreshing ? 'Trying again…' : 'Try again'}
            </button>
          </div>
        ) : entries.length === 0 && searchTerm && vaultCount > 0 ? (
          <div className="mt-5 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-5 text-center">
            <Search size={20} className="text-neutral-400" aria-hidden="true" />
            <h3 className="mt-3 text-base font-semibold text-neutral-950">No matching logins</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Try a different website or email search.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchText('')
                setSearchTerm('')
              }}
              className="mt-4 min-h-10 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Clear search
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600">
              <LockKeyhole size={21} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-neutral-950">Nothing saved yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
              Add a website and its sign-in details. They’ll be here next time you need them.
            </p>
            <Link
              to="/passwords/create"
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              <Plus size={16} aria-hidden="true" />
              Add your first password
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 sm:p-5"
              >
                <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-end sm:gap-x-4 sm:gap-y-4">
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 sm:hidden">
                    <LockKeyhole size={17} aria-hidden="true" />
                  </span>
                  <span
                    className="relative hidden size-10 shrink-0 items-center justify-center self-start rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-sky-100 text-lg font-semibold text-indigo-800 shadow-sm sm:flex"
                    aria-hidden="true"
                  >
                    {entry.website?.trim()?.charAt(0)?.toUpperCase() || '?'}
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-white bg-neutral-900 text-white shadow-sm">
                      <LockKeyhole size={10} />
                    </span>
                  </span>
                  <div className="col-start-2 row-start-1 min-w-0">
                    <h3 className="wrap-break-word text-sm font-semibold text-neutral-950 sm:text-base">
                      {entry.website}
                    </h3>
                    <p className="mt-1 break-all text-sm font-medium text-neutral-600">{entry.email}</p>
                    <p
                      key={visiblePasswords[entry.id] ? 'revealed' : 'hidden'}
                      aria-live="polite"
                      className="vault-password-reveal mt-3 min-h-10 break-all rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 font-mono text-sm leading-6 text-neutral-700"
                    >
                      {visiblePasswords[entry.id]
                        ? revealedPasswords[entry.id]
                        : '••••••••••••'}
                    </p>
                  </div>
                  <div className="col-start-2 row-start-2 flex min-h-10 flex-wrap items-center justify-end gap-2 sm:col-start-3 sm:row-start-1 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditingEntry(entry)}
                      aria-label={`Update password for ${entry.website}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <Edit3 size={15} aria-hidden="true" />
                      <span className="hidden sm:inline">Update</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleReveal(entry)}
                      disabled={revealingId === entry.id}
                      aria-label={
                        revealingId === entry.id
                          ? `Revealing password for ${entry.website}`
                          : visiblePasswords[entry.id]
                            ? `Hide password for ${entry.website}`
                            : `Reveal password for ${entry.website}`
                      }
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"
                    >
                      {revealingId === entry.id
                        ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                        : visiblePasswords[entry.id]
                          ? <EyeOff size={15} aria-hidden="true" />
                          : <Eye size={15} aria-hidden="true" />}
                      <span className="hidden sm:inline">
                        {revealingId === entry.id
                          ? 'Revealing…'
                          : visiblePasswords[entry.id]
                            ? 'Hide'
                            : 'Show'}
                      </span>
                    </button>
                    {confirmDeleteId === entry.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="min-h-10 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
                        >
                          {deletingId === entry.id ? 'Removing…' : 'Confirm removal'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId('')}
                          className="min-h-10 rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Keep it
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestDeleteConfirmation(entry.id)}
                        aria-label={`Remove ${entry.website} from your vault`}
                        title="Remove from vault"
                        className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {editingEntry && (
        <UpdateVaultPasswordDialog
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={handlePasswordUpdated}
        />
      )}
      {mobileDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4 sm:hidden">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-vault-entry-title"
            className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl"
          >
            <h2 id="delete-vault-entry-title" className="text-lg font-semibold text-neutral-950">
              Delete this saved sign-in?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              This will permanently remove <span className="font-medium text-neutral-900">
                {entries.find((entry) => entry.id === mobileDeleteId)?.website}
              </span> from your vault.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-3">
              <button
                type="button"
                onClick={() => setMobileDeleteId('')}
                disabled={deletingId === mobileDeleteId}
                className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(mobileDeleteId)}
                disabled={deletingId === mobileDeleteId}
                className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletingId === mobileDeleteId ? 'Removing…' : 'Delete sign-in'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default PasswordPage
