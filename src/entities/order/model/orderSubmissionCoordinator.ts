type Listener = () => void

export interface OrderSubmissionSnapshot {
  isPending: boolean
  error: unknown | null
}

interface StartOrderSubmissionOptions {
  submit: (signal: AbortSignal) => Promise<void>
  onSuccess: () => void
}

interface ActiveSubmission {
  controller: AbortController
  id: number
}

const IDLE_SUBMISSION: OrderSubmissionSnapshot = {
  isPending: false,
  error: null,
}

let activeSubmission: ActiveSubmission | null = null
let nextSubmissionId = 0
let submissionSnapshot = IDLE_SUBMISSION
const listeners = new Set<Listener>()

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}

function publishSnapshot(snapshot: OrderSubmissionSnapshot): void {
  submissionSnapshot = snapshot
  notifyListeners()
}

function finishSuccessfulSubmission(
  submissionId: number,
  onSuccess: () => void,
): void {
  if (activeSubmission?.id !== submissionId) {
    return
  }

  activeSubmission = null

  try {
    onSuccess()
    publishSnapshot(IDLE_SUBMISSION)
  } catch (error) {
    publishSnapshot({ isPending: false, error })
  }
}

function finishFailedSubmission(submissionId: number, error: unknown): void {
  if (activeSubmission?.id !== submissionId) {
    return
  }

  activeSubmission = null
  publishSnapshot({ isPending: false, error })
}

export function subscribeToOrderSubmission(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getOrderSubmissionSnapshot(): OrderSubmissionSnapshot {
  return submissionSnapshot
}

export function startOrderSubmission({
  submit,
  onSuccess,
}: StartOrderSubmissionOptions): boolean {
  if (activeSubmission !== null) {
    return false
  }

  nextSubmissionId += 1
  const submissionId = nextSubmissionId
  const controller = new AbortController()
  activeSubmission = { controller, id: submissionId }
  publishSnapshot({ isPending: true, error: null })

  void submit(controller.signal).then(
    () => finishSuccessfulSubmission(submissionId, onSuccess),
    (error: unknown) => finishFailedSubmission(submissionId, error),
  )

  return true
}

export function resetOrderSubmission(): void {
  activeSubmission?.controller.abort()
  activeSubmission = null
  publishSnapshot(IDLE_SUBMISSION)
}
