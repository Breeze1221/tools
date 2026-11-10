/** 工具里唯一接触浏览器文件 API 的地方：把 File 读成字节数组 */
export async function readFileBytes(file: File): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}
