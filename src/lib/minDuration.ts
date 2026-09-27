export const MIN_LOADING_MS = 300;

export async function minDuration<T>(
  work: Promise<T>,
  ms = MIN_LOADING_MS
): Promise<T> {
  const floor = new Promise((resolve) => setTimeout(resolve, ms));
  try {
    return await work;
  } finally {
    await floor;
  }
}
