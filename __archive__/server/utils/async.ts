export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T | Promise<T>,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  try {
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const v = await onTimeout();
          resolve(v);
        } catch (e) {
          // swallow
          resolve(onTimeout() as any);
        }
      }, ms);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
