import { Link, useBlocker, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { MemberModal } from '@/components/dialogs/MemberModal'
import { RichEditor } from '@/components/editor/RichEditor'
import { ErrorState } from '@/components/states/ErrorState'
import { NothingHere } from '@/components/states/NothingHere'
import { PageLoader } from '@/components/states/PageLoader'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { uploadArticleImage, type ArticleDetail, type ArticleDraft } from './api'
import { useArticle, useCanWrite, useDeleteArticle, useSaveArticle, useSetPublished } from './hooks'

const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Something went wrong. Try again.')

function EditorForm({ article }: { article: ArticleDetail | null }) {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const save = useSaveArticle()
  const publish = useSetPublished()
  const remove = useDeleteArticle()
  const [id, setId] = useState(article?.id ?? null)
  const [draft, setDraft] = useState<ArticleDraft>({
    title: article?.title ?? '',
    kicker: article?.kicker ?? '',
    body: article?.body ?? '',
    cover_image_url: article?.cover_image_url ?? null,
  })
  const [saved, setSaved] = useState(draft)
  const [published, setPublishedState] = useState(!!article?.published_at)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const busy = save.isPending || publish.isPending || remove.isPending
  const ready = draft.title.trim().length > 0 && draft.body.trim().length > 0

  useBlocker({
    shouldBlockFn: () => dirty && !window.confirm('You have unsaved changes. Leave anyway?'),
    enableBeforeUnload: () => dirty,
  })

  const set = (patch: Partial<ArticleDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const upload = (file: File) => uploadArticleImage(player!.id, file)

  async function persist() {
    const newId = await save.mutateAsync({ id, draft })
    setSaved(draft)
    if (!id) {
      setId(newId)
      navigate({ to: '/articles/$articleId/edit', params: { articleId: newId }, replace: true, ignoreBlocker: true })
    }
    return newId
  }

  async function onSave() {
    try {
      await persist()
      toast.success(published ? 'Changes are live.' : 'Draft saved.')
    } catch (e) {
      toast.error(errText(e))
    }
  }

  async function onPublish(next: boolean) {
    try {
      const target = dirty || !id ? await persist() : id
      await publish.mutateAsync({ id: target, published: next })
      setPublishedState(next)
      toast.success(next ? 'Published. It’s on the Articles page now.' : 'Unpublished. Back to a draft.')
    } catch (e) {
      toast.error(errText(e))
    }
  }

  async function onCover(file: File | undefined) {
    if (!file) return
    setCoverBusy(true)
    try {
      set({ cover_image_url: await upload(file) })
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setCoverBusy(false)
      if (coverRef.current) coverRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="sticky top-0 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-white/[0.06] bg-astro-bg/90 px-4 py-3 backdrop-blur md:-mx-0 md:rounded-b-xl md:px-0">
        <Link to="/articles" className="text-[13px] font-bold text-astro-text-muted no-underline hover:text-astro-text">
          &larr; Articles
        </Link>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em]',
            published ? 'border-astro-green/50 text-astro-green' : 'border-white/[0.15] text-astro-text-dim',
          )}
        >
          {published ? 'Published' : 'Draft'}
        </span>
        {dirty && <span className="text-[11.5px] text-astro-text-dim">Unsaved changes</span>}
        <div className="ml-auto flex items-center gap-2">
          {id && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="rounded-[9px] px-2.5 py-2 text-[12.5px] font-bold text-astro-text-dim hover:text-astro-red disabled:opacity-50"
            >
              Delete
            </button>
          )}
          {published && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onPublish(false)}
              className="rounded-[9px] border border-white/[0.12] px-3 py-2 text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text disabled:opacity-50"
            >
              Unpublish
            </button>
          )}
          <button
            type="button"
            disabled={busy || !dirty || !draft.title.trim()}
            onClick={onSave}
            className="rounded-[9px] border border-white/[0.12] px-3 py-2 text-[12.5px] font-extrabold text-astro-text hover:border-astro-accent/60 disabled:opacity-50"
          >
            {published ? 'Save changes' : 'Save draft'}
          </button>
          {!published && (
            <button
              type="button"
              disabled={busy || !ready}
              onClick={() => onPublish(true)}
              className="rounded-[9px] bg-astro-accent px-3.5 py-2 text-[12.5px] font-extrabold text-white hover:opacity-90 disabled:opacity-50"
            >
              Publish
            </button>
          )}
        </div>
      </div>

      <input
        value={draft.kicker}
        onChange={(e) => set({ kicker: e.target.value })}
        maxLength={40}
        placeholder="KICKER, E.G. MATCH REPORT"
        aria-label="Kicker"
        className="mb-2 w-full bg-transparent text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-accent placeholder:text-astro-text-dim focus:outline-none"
      />
      <textarea
        value={draft.title}
        onChange={(e) => set({ title: e.target.value.replace(/\n/g, ' ') })}
        rows={1}
        maxLength={120}
        placeholder="Headline"
        aria-label="Headline"
        className="mb-5 w-full resize-none bg-transparent font-display text-[40px] leading-[0.95] text-astro-text [field-sizing:content] placeholder:text-astro-text-dim focus:outline-none md:text-[56px]"
      />

      <div className="relative mb-6 overflow-hidden rounded-[14px] border border-dashed border-white/[0.14]">
        {draft.cover_image_url ? (
          <img src={draft.cover_image_url} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/7] w-full items-center justify-center bg-[linear-gradient(150deg,#243463,#131c3a)] text-[13px] text-astro-text-dim">
            No cover image
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {draft.cover_image_url && (
            <button
              type="button"
              onClick={() => set({ cover_image_url: null })}
              className="rounded-lg bg-astro-bg/85 px-3 py-1.5 text-xs font-bold text-astro-text-muted backdrop-blur hover:text-astro-text"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            disabled={coverBusy}
            onClick={() => coverRef.current?.click()}
            className="rounded-lg bg-astro-bg/85 px-3 py-1.5 text-xs font-extrabold text-astro-text backdrop-blur hover:bg-astro-bg disabled:opacity-60"
          >
            {coverBusy ? 'Uploading…' : draft.cover_image_url ? 'Replace cover' : 'Add a cover'}
          </button>
        </div>
        <input ref={coverRef} type="file" accept="image/webp,image/jpeg,image/png,image/gif" hidden onChange={(e) => onCover(e.target.files?.[0])} />
      </div>

      <div className="astro-card px-5 py-4">
        <RichEditor
          value={draft.body}
          onChange={(body) => set({ body })}
          variant="article"
          onSubmit={onSave}
          onImageUpload={async (file) => {
            try {
              return await upload(file)
            } catch (e) {
              toast.error(errText(e))
              throw e
            }
          }}
          placeholder="Start the report. Type @ to tag a player."
          aria-label="Article body"
          contentClassName="min-h-[360px] text-[16px] leading-[1.7] text-astro-text"
        />
      </div>
      <p className="mt-2 text-[11.5px] text-astro-text-dim">⌘/Ctrl + Enter saves.</p>

      <MemberModal open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this article?" body="It goes for good, drafts and all. This can’t be undone.">
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-[10px] px-3.5 py-2 text-[13px] font-bold text-astro-text-muted hover:text-astro-text">
            Keep it
          </button>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(id!, {
                onSuccess: () => {
                  setSaved(draft)
                  setConfirmDelete(false)
                  toast.success('Article deleted.')
                  navigate({ to: '/articles', ignoreBlocker: true })
                },
                onError: (e) => toast.error(errText(e)),
              })
            }
            className="rounded-[10px] bg-astro-red px-3.5 py-2 text-[13px] font-extrabold text-white disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </MemberModal>
    </div>
  )
}

/** Write or edit an article. Admins and anyone they've given write access can use it. */
export function ArticleEditorPage({ articleId }: { articleId?: string }) {
  const { player } = useCurrentPlayer()
  const { data: canWrite, isLoading: checking } = useCanWrite()
  const { data: article, isLoading, isError, refetch } = useArticle(articleId ?? null)

  if (checking || isLoading) return <PageLoader />
  if (!canWrite) return <NothingHere title="Not on the masthead" body="Writing articles is by invite. Ask an admin if you’ve got something to say." />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (articleId && !article) return <NothingHere title="Article not found" body="It may have been deleted." />
  if (article && article.author?.id !== player?.id && !player?.is_admin)
    return <NothingHere title="Not your article" body="Only its author or an admin can edit this one." />
  return <EditorForm key={article?.id ?? 'new'} article={article ?? null} />
}
