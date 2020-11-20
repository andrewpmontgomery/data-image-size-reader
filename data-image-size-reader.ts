export class DataImageSizeReader {

  static GetImageSize(args: { dataUri: string }): { width: number, height: number, format: string } | null {
    if (!(args?.dataUri?.startsWith('data:'))) {
      return null;
    }
    const format = DataImageSizeReader.GetImageFormat(args);
    let size: { width: number, height: number };
    switch (format) {
      case 'image/jpeg':
        size = DataImageSizeReader.GetJpegSize(args);
        break;
      case 'image/png':
        size = DataImageSizeReader.GetPngSize(args);
        break;
      case 'image/gif':
        size = DataImageSizeReader.GetGifSize(args);
        break;
      default:
        return null;
    }
    if (!size) {
      return null;
    }
    return { ...size, format };
  }
  
  private static GetImageFormat(args: { dataUri: string }): string | null {
    const header = args.dataUri.split(',', 1)[0];
    const mimeType = (header.match(/^data:(image[/][a-z-]+)/) || [null, null])[1];
    return mimeType;
  }
  
  private static GetJpegSize(args: { dataUri: string }): { width: number, height: number } | null {
    const base64 = args.dataUri.split(',')[1];
    const bytes: number[] = atob(base64).split('').map(c => c.charCodeAt(0));
    for (let ix = 2; ix < bytes.length;) { // skip initial "ff d8"
      const ff = bytes[ix++];
      if (ff !== 0xFF) {
        break;
      }
      const type = bytes[ix++];
      const length = (bytes[ix++] * 256) + bytes[ix++];
      if (type === 0xC0) {
        ix++; // skip bits per pixel (nearly always 8)
        const height = (bytes[ix++] * 256) + bytes[ix++];
        const width = (bytes[ix++] * 256) + bytes[ix++];
        return { width, height };
      }
      ix += length - 2;
    }
    return null;
  }

  private static GetPngSize(args: { dataUri: string }): { width: number, height: number } | null {
    const base64 = args.dataUri.substr(args.dataUri.indexOf(',') + 1, 32); // only need first 24 bytes => first 32 base64 chars
    const bytes: number[] = atob(base64).split('').map(c => c.charCodeAt(0));
    if (bytes.length < 24) {
      return null;
    }
    const width = (((((bytes[16] * 256) + bytes[17]) * 256) + bytes[18]) * 256) + bytes[19];
    const height = (((((bytes[20] * 256) + bytes[21]) * 256) + bytes[22]) * 256) + bytes[23];
    return { width, height };
  }

  private static GetGifSize(args: { dataUri: string }): { width: number, height: number } | null {
    const base64 = args.dataUri.substr(args.dataUri.indexOf(',') + 1, 16); // only need first 12 bytes => first 16 base64 chars
    const bytes: number[] = atob(base64).split('').map(c => c.charCodeAt(0));
    if (bytes.length < 12) {
      return null;
    }
    const width = bytes[6] + (bytes[7] * 256);
    const height = bytes[8] + (bytes[9] * 256);
    return { width, height };
  }
}
