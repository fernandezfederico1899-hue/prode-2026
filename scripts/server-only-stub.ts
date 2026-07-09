// El paquete `server-only` tira error si lo importás fuera de un React Server
// Component. Next lo resuelve a un módulo vacío; los tests que corren módulos
// del server con tsx necesitan lo mismo. Mapeado en tsconfig.test.json.
export {};
