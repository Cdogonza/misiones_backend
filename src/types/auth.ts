export type JwtPayload = {
  sub: number;
  usuario: string;
  oficina: string;
  rol: 'integrante' | 'admin' | 'superAdmin';
};

export type RegisterBody = {
  email: string;
  username: string;
  password: string;
  oficina: string;
  rol: 'integrante' | 'admin' | 'superAdmin';
};

export type LoginBody = {
  username: string;
  password: string;
};

