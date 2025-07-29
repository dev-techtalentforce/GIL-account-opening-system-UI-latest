

export interface UserLoginRequestDto {
  email: string;
  password: string;
}

export interface UserLoginResponseDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  refreshToken: string;
  refreshTokenExpiryTime: string;
  kycStatus: string;
  referralCode: string;
  roleName: string;
  nsdl_status: number;
}

export interface User {
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string; // Optional for login/update
  roleId: 1;
  isActive: boolean;
  createdAt?:any;
  refreshToken?: string;
  refreshTokenExpiryTime?: Date;
  mobile: string;
  panCard: string;
  referralCode: string;
  address: string;
  modifiedAt?: Date;
  status?: number;
  BlockStatus?:number;
}

export interface LoginResponse {
  token: string;
  response: UserLoginResponseDto;
}