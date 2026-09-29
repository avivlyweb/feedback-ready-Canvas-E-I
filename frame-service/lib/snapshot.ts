export function snapshotPayload(url: string) {
  return {
    success: true,
    url,
    discoveredPages: [],
    breakpoints: [375, 768, 1440],
  };
}
