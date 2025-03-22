// Backend\src\utils\util.ts
export interface IResponse <T>{
  status: number,
  message:string,
  data:T
}