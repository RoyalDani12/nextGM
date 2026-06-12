export interface RegisterDto {
  name:string
  email:string
  password:string
}


export interface LoginDto {
  password:string,
  email:string
}

export interface DeviceInfo {
    ipAddress:  string
    userAgent:  string
    deviceName: string
}