declare global {
  namespace Express {
    interface Request {
      user?: { 
        idusuario: number; 
        usuario: string; 
        oficina: string; 
        rol: 'integrante' | 'admin' | 'superAdmin' 
      };
    }
  }
}

export {};

