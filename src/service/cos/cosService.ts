import { CosType } from '@/types/type'

export default interface CosService {
  init(cosInfo?: CosType): void

  batchUploadFile(list: { fileName: string; path: string }[]): void
  uploadFile(filePath: string, path: string): void

  batchRemoveFile(list: string[]): void
  removeFile(fileKey: string): void
}
