// Declaración global para Vue desde CDN
declare const Vue: {
  createApp: (component: any) => {
    mount: (selector: string) => void;
  };
};

// Declaración de módulos Vue SFC
// Este archivo solo debe contener el "shim" para que TypeScript entienda archivos .vue
// Los tipos de dominio (Cliente, Producto, etc.) están en types/models.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  
  // Definición genérica permisiva para que TS no se queje al importar .vue
  const component: DefineComponent<
    Record<string, any>, // Props
    Record<string, any>, // Emits
    any                  // Data/Setup return
  >;
  
  export default component;
}

