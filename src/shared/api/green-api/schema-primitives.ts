import { z } from 'zod'

/** GREEN-API отдаёт идентификаторы то строкой, то числом; внутри приложения это всегда строка. */
export const greenApiIdSchema = z.union([z.string(), z.number()]).transform(String)
