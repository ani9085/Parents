// Read an image file and return a downscaled JPEG data URL so it fits inside
// localStorage (which is small, ~5MB). We cap the longest edge and re-encode.

const MAX_EDGE = 800;
const QUALITY = 0.7;

export function fileToDownscaledDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일이 아닙니다."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("사진을 열지 못했습니다."));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > height && width > MAX_EDGE) {
            height = Math.round((height * MAX_EDGE) / width);
            width = MAX_EDGE;
          } else if (height >= width && height > MAX_EDGE) {
            width = Math.round((width * MAX_EDGE) / height);
            height = MAX_EDGE;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("사진 처리를 지원하지 않는 기기입니다."));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", QUALITY));
        } catch {
          reject(new Error("사진 처리에 실패했습니다."));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
