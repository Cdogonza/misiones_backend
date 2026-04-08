import { env } from './config/env';
import { app } from './app';
const PORT = env.port || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

