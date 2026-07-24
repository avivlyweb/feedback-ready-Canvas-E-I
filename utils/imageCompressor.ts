export async function compressImage(
  dataUrlOrFile: string | File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    const processDataUrl = (dataUrl: string) => {
      if (!dataUrl || typeof dataUrl !== 'string') {
        resolve('');
        return;
      }

      // If not an image (e.g. PDF or non-base64 url), return as is
      if (!dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };

    if (typeof dataUrlOrFile === 'string') {
      processDataUrl(dataUrlOrFile);
    } else if (dataUrlOrFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processDataUrl(reader.result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(dataUrlOrFile);
    } else {
      resolve('');
    }
  });
}

/**
  Ensures that a payload object being sent to Convex is strictly under maxBytes (e.g. 750,000 bytes)
  to prevent Convex "Value is too large (> 1 MiB)" server errors.
 */
export function sanitizePayloadForConvex(payload: any, maxBytes = 750000): any {
  if (!payload) return payload;

  let sanitized = { ...payload };

  // Check initial payload size
  let jsonString = JSON.stringify(sanitized);
  if (jsonString.length <= maxBytes) {
    return sanitized;
  }

  // Step 1: If screenshots exist, trim/limit screenshots array
  if (Array.isArray(sanitized.screenshots) && sanitized.screenshots.length > 0) {
    while (sanitized.screenshots.length > 2 && JSON.stringify(sanitized).length > maxBytes) {
      sanitized.screenshots = sanitized.screenshots.slice(0, sanitized.screenshots.length - 1);
    }
  }

  // Step 2: If notes contain V2 data with snapshots, limit snapshots count
  if (typeof sanitized.notes === 'string' && sanitized.notes.startsWith('__V2_DATA__:')) {
    try {
      const rawJson = sanitized.notes.replace('__V2_DATA__:', '');
      const v2Data = JSON.parse(rawJson);
      if (Array.isArray(v2Data.snapshots) && v2Data.snapshots.length > 2) {
        v2Data.snapshots = v2Data.snapshots.slice(-2); // keep latest 2
        sanitized.notes = `__V2_DATA__:${JSON.stringify(v2Data)}`;
      }
    } catch (e) {
      console.warn('Failed to prune snapshots in notes', e);
    }
  }

  // Step 3: If still over limit, truncate attachments in pins
  if (Array.isArray(sanitized.pins) && JSON.stringify(sanitized).length > maxBytes) {
    sanitized.pins = sanitized.pins.map((pin: any) => ({
      ...pin,
      comments: Array.isArray(pin.comments)
        ? pin.comments.map((c: any) => {
            if (c.attachment?.data && c.attachment.data.length > 50000) {
              return {
                ...c,
                attachment: {
                  ...c.attachment,
                  data: c.attachment.data.slice(0, 50000), // truncate
                },
              };
            }
            return c;
          })
        : [],
    }));
  }

  // Step 4: If still over limit, remove screenshots altogether as fallback
  if (JSON.stringify(sanitized).length > maxBytes) {
    sanitized.screenshots = [];
  }

  return sanitized;
}
