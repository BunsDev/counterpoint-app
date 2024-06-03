import CellinfoModule from './src/CellinfoModule'

export function hello(): string {
  return CellinfoModule.hello()
}
export async function getAllCellInfo(): Promise<any> {
  return await CellinfoModule.getAllCellInfo()
}
