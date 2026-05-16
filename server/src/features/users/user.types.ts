export interface UpdateProfileDto {
  name?:    string,
  phone?:   string,
  address?: string,
  city?:    string,
  country?: string,
  avatar?:  string,
}

export interface changePasswordDto {
  oldPassword:string,
  newPassword:string,
}