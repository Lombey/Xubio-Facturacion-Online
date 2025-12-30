// Declaración global para Vue desde CDN
declare const Vue: {
  createApp: (component: any) => {
    mount: (selector: string) => void;
  };
};

// Declaración de módulos Vue SFC
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

